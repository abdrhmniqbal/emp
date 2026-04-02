import { logError, logInfo } from "@/modules/logging/logging.service"
import {
  loadPlaybackSession,
  savePlaybackSession,
} from "@/modules/player/player-session.repository"
import { getQueueState } from "@/modules/player/player.store"
import { RepeatMode, State, TrackPlayer } from "@/modules/player/player.utils"

import {
  mapRepeatMode,
  mapTrackPlayerRepeatMode,
  mapTrackPlayerTrackToTrack,
  mapTrackToTrackPlayerInput,
} from "./player-adapter"
import { setActiveTrack, setPlaybackProgress } from "./player-runtime-state"
import {
  getCurrentTrackState,
  getIsPlayingState,
  getRepeatModeState,
  getTracksState,
  setIsPlayingState,
  setOriginalQueueState,
  setQueueState,
  setRepeatModeState,
} from "./player.store"

const MIN_SESSION_SAVE_INTERVAL_MS = 2000

let lastPlaybackSessionSavedAt = 0

function mapNativeQueueToTracks(nativeQueue: Awaited<ReturnType<typeof TrackPlayer.getQueue>>) {
  return nativeQueue
    .map((track) => mapTrackPlayerTrackToTrack(track, getTracksState()))
    .filter((track) => track.id && track.uri)
}

export async function persistPlaybackSession(options?: {
  force?: boolean
}): Promise<void> {
  const now = Date.now()
  if (
    !options?.force &&
    now - lastPlaybackSessionSavedAt < MIN_SESSION_SAVE_INTERVAL_MS
  ) {
    return
  }

  try {
    const queue = mapNativeQueueToTracks(await TrackPlayer.getQueue())
    const currentIndex = await TrackPlayer.getCurrentTrack()
    const positionSeconds = await TrackPlayer.getPosition()

    const currentTrackId =
      currentIndex !== null && currentIndex >= 0 && currentIndex < queue.length
        ? (queue[currentIndex]?.id ?? null)
        : (getCurrentTrackState()?.id ?? null)

    await savePlaybackSession({
      queue,
      currentTrackId,
      positionSeconds,
      repeatMode: getRepeatModeState(),
      wasPlaying: getIsPlayingState(),
      savedAt: now,
    })
    lastPlaybackSessionSavedAt = now
  } catch (error) {
    logError("Failed to persist playback session", error, options)
  }
}

export async function restorePlaybackSession(): Promise<void> {
  try {
    const nativeQueue = await TrackPlayer.getQueue()

    if (nativeQueue.length > 0) {
      logInfo("Restoring playback session from native queue", {
        queueLength: nativeQueue.length,
      })
      const mappedQueue = mapNativeQueueToTracks(nativeQueue)
      if (mappedQueue.length > 0) {
        setQueueState(mappedQueue)
        setOriginalQueueState(mappedQueue)
      }

      const currentIndex = await TrackPlayer.getCurrentTrack()
      if (
        currentIndex !== null &&
        currentIndex >= 0 &&
        currentIndex < mappedQueue.length
      ) {
        setActiveTrack(mappedQueue[currentIndex] || null)
      } else {
        setActiveTrack(mappedQueue[0] || null)
      }

      const [position, playbackState, repeatMode] = await Promise.all([
        TrackPlayer.getPosition(),
        TrackPlayer.getState(),
        TrackPlayer.getRepeatMode(),
      ])

      setPlaybackProgress(position, getCurrentTrackState()?.duration || 0)
      setIsPlayingState(playbackState === State.Playing)
      setRepeatModeState(mapTrackPlayerRepeatMode(repeatMode as RepeatMode))
      await persistPlaybackSession({ force: true })
      return
    }

    const snapshot = await loadPlaybackSession()
    if (!snapshot || snapshot.queue.length === 0) {
      logInfo("No playback session snapshot available to restore")
      return
    }

    logInfo("Restoring playback session from saved snapshot", {
      queueLength: snapshot.queue.length,
      currentTrackId: snapshot.currentTrackId,
      wasPlaying: snapshot.wasPlaying,
    })

    await TrackPlayer.reset()
    await TrackPlayer.add(snapshot.queue.map(mapTrackToTrackPlayerInput))

    const currentIndex =
      snapshot.currentTrackId !== null
        ? snapshot.queue.findIndex(
            (track) => track.id === snapshot.currentTrackId
          )
        : 0
    const targetIndex = currentIndex >= 0 ? currentIndex : 0
    const targetPosition = Math.max(0, snapshot.positionSeconds || 0)

    await TrackPlayer.skip(targetIndex, targetPosition)
    await TrackPlayer.setRepeatMode(mapRepeatMode(snapshot.repeatMode))

    const currentTrack = snapshot.queue[targetIndex] || null
    setQueueState(snapshot.queue)
    setOriginalQueueState(snapshot.queue)
    setActiveTrack(currentTrack)
    setPlaybackProgress(targetPosition, currentTrack?.duration || 0)
    setRepeatModeState(snapshot.repeatMode)

    await TrackPlayer.pause()
    setIsPlayingState(false)

    await persistPlaybackSession({ force: true })
  } catch (error) {
    logError("Failed to restore playback session", error)
  }
}

export async function syncCurrentTrackFromPlayer(): Promise<void> {
  try {
    const [activeIndex, nativeQueue, activeTrack] = await Promise.all([
      TrackPlayer.getCurrentTrack(),
      TrackPlayer.getQueue(),
      TrackPlayer.getActiveTrack(),
    ])

    const mappedQueue = mapNativeQueueToTracks(nativeQueue)
    if (mappedQueue.length > 0) {
      setQueueState(mappedQueue)
    }

    if (
      activeIndex !== null &&
      activeIndex >= 0 &&
      activeIndex < mappedQueue.length
    ) {
      setActiveTrack(mappedQueue[activeIndex] || null)
      return
    }

    if (!activeTrack) {
      setActiveTrack(mappedQueue[0] || null)
      return
    }

    const mappedTrack = mapTrackPlayerTrackToTrack(activeTrack, getTracksState())
    setActiveTrack(mappedTrack)
  } catch (error) {
    logError("Failed to sync current track from player", error)
  }
}
