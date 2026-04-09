import { logError, logWarn } from "@/modules/logging/logging.service"
import {
  pauseTrack,
  playNext,
  playPrevious,
  resumeTrack,
  seekTo,
} from "@/modules/player/player-controls.service"
import { setPlaybackProgress } from "@/modules/player/player-runtime-state"
import { isPlayerQueueReplacementInFlight } from "@/modules/player/player-runtime.service"
import {
  persistPlaybackSession,
  syncCurrentTrackFromPlayer,
} from "@/modules/player/player-session.service"
import { Event, State, TrackPlayer } from "@/modules/player/player.utils"

import { handleTrackActivated } from "./player-activity.service"
import {
  getCurrentTrackState,
  getRepeatModeState,
  setIsPlayingState,
} from "./player.store"

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
    logWarn("Playback interruption event received", {
      paused: event.paused,
      permanent: event.permanent,
    })
  })

  TrackPlayer.addEventListener(Event.ServiceKilled, () => {
    logError("TrackPlayer service was killed while app in background")
  })

  TrackPlayer.addEventListener(Event.PlaybackError, (event) => {
    logError("TrackPlayer playback error", event)
  })

  TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
    const isPlaying = event.state === State.Playing

    if (isPlayerQueueReplacementInFlight() && !isPlaying) {
      return
    }

    setIsPlayingState(isPlaying)
    void persistPlaybackSession()
  })

  TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async () => {
    try {
      const previousTrackId = getCurrentTrackState()?.id ?? null
      await syncCurrentTrackFromPlayer()
      const currentTrack = getCurrentTrackState()
      const isTrackRepeat = getRepeatModeState() === "track"
      if (
        !currentTrack ||
        (currentTrack.id === previousTrackId && !isTrackRepeat)
      ) {
        return
      }

      await handleTrackActivated(currentTrack)
      void persistPlaybackSession({ force: true })
    } catch (error) {
      logError("Failed to handle playback track change", error)
    }
  })

  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event) => {
    setPlaybackProgress(event.position, event.duration)
    void persistPlaybackSession()
  })
}
