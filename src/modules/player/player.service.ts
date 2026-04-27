/**
 * Purpose: Sets up native audio playback and replaces the active TrackPlayer queue when playback starts.
 * Caller: track rows, player controls, queue recovery flows, bootstrap playback setup.
 * Dependencies: TrackPlayer native module, notification icon asset, player store, playback session service, player activity service, crossfade transition service, logging service.
 * Main Functions: setupPlayer(), playTrack()
 * Side Effects: Initializes native playback, updates notification options, resets native queue and volume transitions, starts playback, persists session state.
 */

import type { Track } from "@/modules/player/player.types"

import { processColor } from "react-native"
import notificationIcon from "@/assets/notification-icon.png"
import { logError, logInfo, logWarn } from "@/modules/logging/logging.service"
import { handleTrackActivated } from "@/modules/player/player-activity.service"
import {
  mapRepeatMode,
  mapTrackToTrackPlayerInput,
} from "@/modules/player/player-adapter"
import { resetCrossfadeVolume } from "@/modules/player/player-crossfade.service"
import { setActiveTrack, setPlaybackProgress } from "@/modules/player/player-runtime-state"
import {
  beginPlayerQueueReplacement,
  endPlayerQueueReplacement,
} from "@/modules/player/player-runtime.service"
import { persistPlaybackSession } from "@/modules/player/player-session.service"

import {
  AndroidAudioContentType,
  AppKilledPlaybackBehavior,
  Capability,
  IOSCategory,
  TrackPlayer,
} from "@/modules/player/player.utils"

import {
  getRepeatModeState,
  getTracksState,
  setImmediateQueueTrackIdsState,
  setIsPlayingState,
  setIsShuffledState,
  setOriginalQueueState,
  setOriginalQueueTrackIdsState,
  setQueueState,
  setQueueTrackIdsState,
} from "./player.store"

let isPlayerReady = false

function buildPlaybackQueue(tracks: Track[], selectedTrackId: string) {
  const selectedTrackIndex = tracks.findIndex((track) => track.id === selectedTrackId)
  const currentTrackIndex = selectedTrackIndex >= 0 ? selectedTrackIndex : 0
  const queue = tracks
    .slice(currentTrackIndex)
    .concat(tracks.slice(0, currentTrackIndex))

  return {
    queue,
    queueTrackIds: queue.map((track) => track.id),
  }
}

export async function setupPlayer() {
  try {
    if (isPlayerReady) {
      return
    }

    logInfo("Setting up track player")
    await TrackPlayer.setupPlayer({
      autoHandleInterruptions: true,
      androidAudioContentType: AndroidAudioContentType.Music,
      iosCategory: IOSCategory.Playback,
    })

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
        stopForegroundGracePeriod: 30,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      notificationCapabilities: [
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
      progressUpdateEventInterval: 0.5,
      icon: notificationIcon,
      color: processColor("#FFFFFF") as number,
    })

    isPlayerReady = true
    logInfo("Track player setup completed")
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("already been initialized")) {
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

  beginPlayerQueueReplacement()

  try {
    logInfo("Playing track", {
      trackId: track.id,
      queueLength: playlistTracks?.length ?? getTracksState().length,
    })

    const tracks = playlistTracks || getTracksState()
    const { queue, queueTrackIds } = buildPlaybackQueue(tracks, track.id)

    setQueueState(queue)
    setOriginalQueueState(queue)
    setQueueTrackIdsState(queueTrackIds)
    setOriginalQueueTrackIdsState(queueTrackIds)
    setImmediateQueueTrackIdsState([])
    setIsShuffledState(false)
    setActiveTrack(track)
    setIsPlayingState(true)
    setPlaybackProgress(0, track.duration || 0)

    await TrackPlayer.reset()
    await resetCrossfadeVolume()

    await TrackPlayer.add(queue.map(mapTrackToTrackPlayerInput))
    await TrackPlayer.setRepeatMode(mapRepeatMode(getRepeatModeState()))

    await TrackPlayer.play()
    await handleTrackActivated(track)
    await persistPlaybackSession({ force: true })
  } catch (error) {
    logError("Failed to play track", error, { trackId: track.id })
  } finally {
    endPlayerQueueReplacement()
  }
}
