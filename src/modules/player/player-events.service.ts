/**
 * Purpose: Registers native TrackPlayer event listeners, synchronizes playback runtime state, and applies playback transitions.
 * Caller: TrackPlayer background service bootstrap.
 * Dependencies: TrackPlayer events, player controls/session/runtime modules, crossfade transition service, audio playback settings, playback activity guard service, player domain types.
 * Main Functions: PlaybackService()
 * Side Effects: Updates player store/session state for indexed tracks, updates native player volume, and records qualified play activity.
 */

import { logError, logWarn } from "@/modules/logging/logging.service"
import {
  pauseTrack,
  playNext,
  playPrevious,
  resumeTrack,
  seekTo,
} from "@/modules/player/player-controls.service"
import {
  handleCrossfadePlaybackState,
  handleCrossfadePlaybackStopped,
  handleCrossfadeProgress,
  handleCrossfadeTrackActivated,
  duckPlaybackVolume,
  resetCrossfadeVolume,
  restorePlaybackVolume,
} from "@/modules/player/player-crossfade.service"
import { setPlaybackProgress } from "@/modules/player/player-runtime-state"
import { isPlayerQueueReplacementInFlight } from "@/modules/player/player-runtime.service"
import {
  persistPlaybackSession,
  syncCurrentTrackFromPlayer,
} from "@/modules/player/player-session.service"
import { EXTERNAL_TRACK_ID_PREFIX } from "@/modules/player/player.types"
import { Event, State, TrackPlayer } from "@/modules/player/player.utils"
import { ensureAudioPlaybackConfigLoaded } from "@/modules/settings/audio-playback"

import { handleTrackActivated, handleTrackProgress } from "./player-activity.service"
import {
  getCurrentTrackState,
  getIsPlayingState,
  getRepeatModeState,
  setIsPlayingState,
} from "./player.store"

let shouldResumeAfterFocusGain = false
let didDuckForFocusLoss = false

function isExternalCurrentTrack() {
  const currentTrack = getCurrentTrackState()
  return (
    currentTrack?.isExternal === true ||
    currentTrack?.id.startsWith(EXTERNAL_TRACK_ID_PREFIX) === true
  )
}

export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    void resumeTrack()
  })

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    void pauseTrack()
  })

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    void playNext()
  })

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    void playPrevious()
  })

  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    if (event.position !== undefined) {
      void seekTo(event.position)
    }
  })

  TrackPlayer.addEventListener(Event.RemoteDuck, (event) => {
    void (async () => {
      const audioPlaybackConfig = await ensureAudioPlaybackConfigLoaded()

      logWarn("Playback interruption event received", {
        paused: event.paused,
        permanent: event.permanent,
      })

      if (event.paused === false) {
        if (didDuckForFocusLoss) {
          await restorePlaybackVolume()
        }

        if (
          shouldResumeAfterFocusGain &&
          audioPlaybackConfig.resumeOnFocusGain
        ) {
          await resumeTrack()
        }

        shouldResumeAfterFocusGain = false
        didDuckForFocusLoss = false
        return
      }

      if (event.permanent) {
        if (didDuckForFocusLoss) {
          await restorePlaybackVolume()
        }
        shouldResumeAfterFocusGain = false
        didDuckForFocusLoss = false
        if (audioPlaybackConfig.permanentAudioFocusChange) {
          await pauseTrack()
        }
        return
      }

      const shouldPauseForCall =
        audioPlaybackConfig.pauseInCall && event.paused === true
      const shouldPauseForShortFocus =
        audioPlaybackConfig.shortAudioFocusChange && event.paused === true

      if (shouldPauseForCall || shouldPauseForShortFocus) {
        shouldResumeAfterFocusGain =
          getIsPlayingState() &&
          audioPlaybackConfig.resumeOnFocusGain &&
          (shouldPauseForShortFocus || audioPlaybackConfig.resumeAfterCall)
        await pauseTrack()
        return
      }

      if (audioPlaybackConfig.duckVolume) {
        didDuckForFocusLoss = true
        await duckPlaybackVolume()
      }
    })().catch((error) => {
      logError("Failed to handle playback interruption event", error)
    })
  })

  TrackPlayer.addEventListener(Event.ServiceKilled, () => {
    logError("TrackPlayer service was killed while app in background")
  })

  TrackPlayer.addEventListener(Event.PlaybackError, (event) => {
    void resetCrossfadeVolume()
    logError("TrackPlayer playback error", event)
  })

  TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
    const isPlaying = event.state === State.Playing

    if (isPlayerQueueReplacementInFlight() && !isPlaying) {
      return
    }

    setIsPlayingState(isPlaying)
    void handleCrossfadePlaybackState(event.state)
    if (!isExternalCurrentTrack()) {
      void persistPlaybackSession({ cursorOnly: true })
    }
  })

  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
    void handleCrossfadePlaybackStopped()
  })

  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (event) => {
    try {
      const previousTrackId = getCurrentTrackState()?.id ?? null
      await syncCurrentTrackFromPlayer({
        skipQueueRefresh: true,
        activeIndex: event.index ?? null,
        activeTrack: event.track ?? null,
      })
      const currentTrack = getCurrentTrackState()
      const isTrackRepeat = getRepeatModeState() === "track"
      if (
        !currentTrack ||
        (currentTrack.id === previousTrackId && !isTrackRepeat)
      ) {
        return
      }

      void handleCrossfadeTrackActivated()
      if (!isExternalCurrentTrack()) {
        void persistPlaybackSession({
          force: true,
          cursorOnly: true,
          consumeImmediateQueue: true,
          cursor: {
            currentTrackId: currentTrack.id,
            activeIndex: event.index ?? null,
            currentTrack,
            positionSeconds: 0,
          },
        })
        handleTrackActivated(currentTrack)
      }
    } catch (error) {
      logError("Failed to handle playback track change", error)
    }
  })

  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event) => {
    setPlaybackProgress(event.position, event.duration)
    void handleCrossfadeProgress(event.position, event.duration)
    handleTrackProgress(event.position, event.duration)
    if (!isExternalCurrentTrack()) {
      void persistPlaybackSession({
        cursorOnly: true,
        cursor: {
          positionSeconds: event.position,
        },
      })
    }
  })
}
