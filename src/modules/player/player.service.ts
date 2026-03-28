import { processColor } from "react-native"

import { invalidateFavoriteQueries } from "@/modules/favorites/favorites.keys"
import { setTrackFavoriteFlag } from "@/modules/favorites/favorites.repository"
import { logError, logInfo, logWarn } from "@/modules/logging/logging.service"
import {
  persistPlaybackSession,
} from "@/modules/player/player-session.service"
import type { RepeatModeType, Track } from "@/modules/player/player.types"
import {
  mapRepeatMode,
  mapTrackToTrackPlayerInput,
} from "@/modules/player/player-adapter"
import { setActiveTrack, setPlaybackProgress } from "@/modules/player/player-runtime-state"
import { handleTrackActivated } from "@/modules/player/player-activity.service"

import {
  Capability,
  State,
  TrackPlayer,
} from "@/modules/player/player.utils"

import {
  getCurrentTrackState,
  getQueueState,
  getRepeatModeState,
  getTracksState,
  setIsPlayingState,
  setRepeatModeState,
  setTracksState,
  usePlayerStore,
} from "./player.store"

let isPlayerReady = false

async function setQueueStore(tracks: Track[]): Promise<void> {
  const { setQueue } = await import("./queue.store")
  setQueue(tracks)
}

export async function setupPlayer() {
  try {
    if (isPlayerReady) {
      return
    }

    logInfo("Setting up track player")
    await TrackPlayer.setupPlayer({
      autoHandleInterruptions: true,
    })

    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      progressUpdateEventInterval: 0.1,
      color: processColor("#0088F6") as number,
    })

    isPlayerReady = true
    logInfo("Track player setup completed")
  } catch (error: any) {
    if (error?.message?.includes("already been initialized")) {
      isPlayerReady = true
      logInfo("Track player already initialized")
      return
    }

    logError("Track player setup failed", error)
  }
}

export async function playTrack(track: Track, playlistTracks?: Track[]) {
  if (!isPlayerReady) {
    logWarn("Ignored playTrack call because player is not ready", {
      trackId: track.id,
    })
    return
  }

  try {
    logInfo("Playing track", {
      trackId: track.id,
      queueLength: playlistTracks?.length ?? getTracksState().length,
    })
    await TrackPlayer.reset()

    const tracks = playlistTracks || getTracksState()
    const selectedTrackIndex = tracks.findIndex((t) => t.id === track.id)
    const currentTrackIndex = selectedTrackIndex >= 0 ? selectedTrackIndex : 0

    const queue = tracks
      .slice(currentTrackIndex)
      .concat(tracks.slice(0, currentTrackIndex))

    await setQueueStore(queue)

    await TrackPlayer.add(queue.map(mapTrackToTrackPlayerInput))

    setActiveTrack(track)

    await TrackPlayer.play()
    setIsPlayingState(true)
    setPlaybackProgress(0, track.duration || 0)
    await handleTrackActivated(track)
    await persistPlaybackSession({ force: true })
  } catch (error) {
    logError("Failed to play track", error, { trackId: track.id })
  }
}

export async function pauseTrack() {
  try {
    logInfo("Pausing playback")
    await TrackPlayer.pause()
    setIsPlayingState(false)
    await persistPlaybackSession({ force: true })
  } catch (error) {
    logError("Failed to pause playback", error)
  }
}

export async function resumeTrack() {
  try {
    logInfo("Resuming playback")
    await TrackPlayer.play()
    setIsPlayingState(true)
    await persistPlaybackSession({ force: true })
  } catch (error) {
    logError("Failed to resume playback", error)
  }
}

export async function togglePlayback() {
  const state = await TrackPlayer.getState()
  if (state === State.Playing) {
    await pauseTrack()
  } else {
    await resumeTrack()
  }
}

export async function playNext() {
  try {
    logInfo("Skipping to next track")
    await TrackPlayer.skipToNext()
    await persistPlaybackSession({ force: true })
  } catch (error) {
    logWarn("Failed to skip to next track, falling back to queue restart", {
      error: error instanceof Error ? error.message : String(error),
    })
    const queue = getQueueState()
    if (queue.length > 0) {
      await playTrack(queue[0], queue)
    }
  }
}

export async function playPrevious() {
  try {
    const position = await TrackPlayer.getPosition()
    if (position > 3) {
      logInfo("Restarting current track from beginning")
      await TrackPlayer.seekTo(0)
    } else {
      logInfo("Skipping to previous track")
      await TrackPlayer.skipToPrevious()
      await persistPlaybackSession({ force: true })
    }
  } catch (error) {
    logError("Failed to play previous track", error)
  }
}

export async function seekTo(seconds: number) {
  try {
    logInfo("Seeking playback", { seconds })
    await TrackPlayer.seekTo(seconds)
    setPlaybackProgress(seconds, usePlayerStore.getState().duration)
    await persistPlaybackSession({ force: true })
  } catch (error) {
    logError("Failed to seek playback", error, { seconds })
  }
}

export async function setRepeatMode(mode: RepeatModeType) {
  try {
    logInfo("Updating repeat mode", { mode })
    await TrackPlayer.setRepeatMode(mapRepeatMode(mode))
    setRepeatModeState(mode)
    await persistPlaybackSession({ force: true })
  } catch (error) {
    logError("Failed to update repeat mode", error, { mode })
  }
}

export async function toggleRepeatMode() {
  const currentMode = getRepeatModeState()
  const nextMode: RepeatModeType =
    currentMode === "off" ? "track" : currentMode === "track" ? "queue" : "off"
  await setRepeatMode(nextMode)
}

export function toggleFavorite(trackId: string) {
  const tracks = getTracksState()
  const index = tracks.findIndex((track) => track.id === trackId)
  if (index === -1) {
    return
  }

  const track = tracks[index]
  if (!track) {
    return
  }

  const newStatus = !track.isFavorite
  const newTracks = [...tracks]
  newTracks[index] = { ...track, isFavorite: newStatus }
  setTracksState(newTracks)

  const current = getCurrentTrackState()
  if (current?.id === trackId) {
    setActiveTrack({ ...current, isFavorite: newStatus })
  }

  void setTrackFavoriteFlag(trackId, newStatus).then(async () => {
    await invalidateFavoriteQueries(queryClient)
  })
}

export async function loadTracks() {
  try {
    const { getAllTracks } = await import("./player.repository")
    const trackList = await getAllTracks()
    setTracksState(trackList)
    logInfo("Loaded tracks into player store", { trackCount: trackList.length })
  } catch (error) {
    logError("Failed to load tracks into player store", error)
  }
}
