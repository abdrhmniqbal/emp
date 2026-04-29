/**
 * Purpose: Provides playback control commands for pause, resume, seeking, queue navigation, and repeat mode.
 * Caller: playback UI controls, notification/remote events, bootstrap resume behavior, and lifecycle listeners.
 * Dependencies: TrackPlayer native module, player session service, player store, audio playback settings, crossfade volume helpers, logging service.
 * Main Functions: pauseTrack(), resumeTrack(), togglePlayback(), playNext(), playPrevious(), seekTo(), setRepeatMode()
 * Side Effects: Mutates native playback state, updates player store, persists playback cursor/session state, and may change native volume.
 */

import type { RepeatModeType } from "@/modules/player/player.types"
import {
  isExtraLoggingEnabled,
  logError,
  logInfo,
  logWarn,
} from "@/modules/logging/logging.service"
import { mapRepeatMode } from "@/modules/player/player-adapter"
import {
  fadePlaybackVolumeIn,
  fadePlaybackVolumeOut,
  restorePlaybackVolume,
} from "@/modules/player/player-crossfade.service"
import { setPlaybackProgress } from "@/modules/player/player-runtime-state"
import {
  ensureNativePlaybackQueue,
  persistPlaybackSession,
  syncCurrentTrackFromPlayer,
} from "@/modules/player/player-session.service"
import { State, TrackPlayer } from "@/modules/player/player.utils"
import { ensureAudioPlaybackConfigLoaded } from "@/modules/settings/audio-playback"

import { playTrack } from "./player.service"
import {
  getQueueState,
  getRepeatModeState,
  setIsPlayingState,
  setRepeatModeState,
  usePlayerStore,
} from "./player.store"

export async function pauseTrack() {
  try {
    const audioPlaybackConfig = await ensureAudioPlaybackConfigLoaded()
    logInfo("Pausing playback")
    if (audioPlaybackConfig.fadePlayPauseStop) {
      await fadePlaybackVolumeOut()
    }
    await TrackPlayer.pause()
    setIsPlayingState(false)
    await persistPlaybackSession({
      force: true,
      cursorOnly: true,
      cursor: {
        isPlaying: false,
      },
    })
    logInfo("Playback paused")
  } catch (error) {
    logError("Failed to pause playback", error)
  }
}

export async function resumeTrack() {
  try {
    const audioPlaybackConfig = await ensureAudioPlaybackConfigLoaded()
    const hasNativeQueue = await ensureNativePlaybackQueue({ autoPlay: false })
    if (!hasNativeQueue) {
      logWarn("Skipped resume because no playback queue is available")
      return
    }

    logInfo("Resuming playback")
    await TrackPlayer.play()
    if (audioPlaybackConfig.fadePlayPauseStop) {
      await fadePlaybackVolumeIn()
    } else {
      await restorePlaybackVolume()
    }
    setIsPlayingState(true)
    await persistPlaybackSession({
      force: true,
      cursorOnly: true,
      cursor: {
        isPlaying: true,
      },
    })
    logInfo("Playback resumed")
  } catch (error) {
    logError("Failed to resume playback", error)
  }
}

export async function togglePlayback() {
  try {
    const state = await TrackPlayer.getState()
    logInfo("Toggling playback", {
      currentState: state,
    })

    if (state === State.Playing) {
      await pauseTrack()
      return
    }

    await resumeTrack()
  } catch (error) {
    logError("Failed to toggle playback", error)
  }
}

export async function playNext() {
  try {
    const hasNativeQueue = await ensureNativePlaybackQueue()
    if (!hasNativeQueue) {
      logWarn("Skipped next track because no playback queue is available")
      return
    }

    const [activeIndex, nativeQueue] = await Promise.all([
      TrackPlayer.getCurrentTrack(),
      TrackPlayer.getQueue(),
    ])

    if (
      activeIndex === null ||
      activeIndex < 0 ||
      nativeQueue.length === 0
    ) {
      logWarn("Skipped next track because no active queue item is available")
      return
    }

    if (activeIndex >= nativeQueue.length - 1) {
      if (getRepeatModeState() === "queue" && nativeQueue.length > 0) {
        logInfo("Wrapping to first track in queue")
        await TrackPlayer.skip(0)
        await syncCurrentTrackFromPlayer({ skipQueueRefresh: true })
        await persistPlaybackSession({
          force: true,
          cursorOnly: true,
          consumeImmediateQueue: true,
        })
        logInfo("Wrapped to first track in queue")
      } else {
        logInfo("Ignored next track because queue is already at the end", {
          activeIndex,
          queueLength: nativeQueue.length,
        })
      }
      return
    }

    logInfo("Skipping to next track")
    await TrackPlayer.skipToNext()
    await syncCurrentTrackFromPlayer({ skipQueueRefresh: true })
    await persistPlaybackSession({
      force: true,
      cursorOnly: true,
      consumeImmediateQueue: true,
    })
    logInfo("Skipped to next track")
  } catch (error) {
    logWarn("Failed to skip to next track, falling back to queue restart", {
      error: error instanceof Error ? error.message : String(error),
    })
    const queue = getQueueState()
    if (queue.length > 0) {
      try {
        await playTrack(queue[0], queue)
        logInfo("Recovered playback by restarting queue from first track")
      } catch (fallbackError) {
        logError("Failed queue restart fallback after next-track error", fallbackError)
      }
    }
  }
}

export async function skipToQueueItem(index: number) {
  try {
    const hasNativeQueue = await ensureNativePlaybackQueue()
    if (!hasNativeQueue) {
      logWarn("Skipped jumping to track because no playback queue is available")
      return
    }

    logInfo("Skipping to specific track in queue", { index })
    await TrackPlayer.skip(index)
    await syncCurrentTrackFromPlayer({ skipQueueRefresh: true })
    await persistPlaybackSession({
      force: true,
      cursorOnly: true,
      consumeImmediateQueue: true,
    })
    logInfo("Skipped to specific track in queue", { index })
  } catch (error) {
    logError("Failed to skip to specific track in queue", error, { index })
  }
}

export async function playPrevious() {
  try {
    const hasNativeQueue = await ensureNativePlaybackQueue()
    if (!hasNativeQueue) {
      logWarn("Skipped previous track because no playback queue is available")
      return
    }

    logInfo("Playing previous track")
    const position = await TrackPlayer.getPosition()
    if (position > 3) {
      logInfo("Restarting current track from beginning")
      await TrackPlayer.seekTo(0)
      logInfo("Restarted current track from beginning")
    } else {
      logInfo("Skipping to previous track")
      await TrackPlayer.skipToPrevious()
      await syncCurrentTrackFromPlayer({ skipQueueRefresh: true })
      await persistPlaybackSession({
        force: true,
        cursorOnly: true,
        consumeImmediateQueue: true,
      })
      logInfo("Skipped to previous track")
    }
  } catch (error) {
    logError("Failed to play previous track", error)
  }
}

export async function seekTo(seconds: number) {
  try {
    const audioPlaybackConfig = await ensureAudioPlaybackConfigLoaded()
    const hasNativeQueue = await ensureNativePlaybackQueue()
    if (!hasNativeQueue) {
      logWarn("Skipped seek because no playback queue is available", { seconds })
      return
    }

    if (isExtraLoggingEnabled()) {
      logInfo("Seeking playback", { seconds })
    }
    const playbackState = await TrackPlayer.getState()
    const shouldFadeSeek =
      audioPlaybackConfig.fadeOnSeek && playbackState === State.Playing

    if (shouldFadeSeek) {
      await fadePlaybackVolumeOut()
    }
    await TrackPlayer.seekTo(seconds)
    if (shouldFadeSeek) {
      await fadePlaybackVolumeIn()
    }
    setPlaybackProgress(seconds, usePlayerStore.getState().duration)
    await persistPlaybackSession({
      force: true,
      cursorOnly: true,
      cursor: {
        positionSeconds: seconds,
      },
    })
    if (isExtraLoggingEnabled()) {
      logInfo("Playback seek completed", { seconds })
    }
  } catch (error) {
    logError("Failed to seek playback", error, { seconds })
  }
}

export async function setRepeatMode(mode: RepeatModeType) {
  try {
    logInfo("Updating repeat mode", { mode })
    await TrackPlayer.setRepeatMode(mapRepeatMode(mode))
    setRepeatModeState(mode)
    await persistPlaybackSession({
      force: true,
      cursorOnly: true,
      cursor: {
        repeatMode: mode,
      },
    })
    logInfo("Repeat mode updated", { mode })
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
