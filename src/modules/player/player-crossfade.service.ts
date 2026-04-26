/**
 * Purpose: Applies saved audio crossfade preferences to native playback volume transitions.
 * Caller: Player event service progress, active-track, playback-state, and queue-ended handlers.
 * Dependencies: TrackPlayer native module, settings crossfade config loader, settings store, player queue state, logging service.
 * Main Functions: handleCrossfadeProgress(), handleCrossfadeTrackActivated(), handleCrossfadePlaybackState(), handleCrossfadePlaybackStopped(), resetCrossfadeVolume()
 * Side Effects: Reads local settings and updates native TrackPlayer volume.
 */

import { logError } from "@/modules/logging/logging.service"
import { ensureCrossfadeConfigLoaded } from "@/modules/settings/audio-crossfade"
import { getSettingsState } from "@/modules/settings/settings.store"

import { State, TrackPlayer } from "./player.utils"
import {
  getCurrentTrackState,
  getQueueTrackIdsState,
  getRepeatModeState,
} from "./player.store"

const FULL_VOLUME = 1
const SILENT_VOLUME = 0
const MIN_FADE_SECONDS = 0.5
const FADE_STEP_MS = 100

let volumeRampTimer: ReturnType<typeof setInterval> | null = null
let activeRampId = 0
let fadingOutTrackId: string | null = null
let shouldFadeInNextTrack = false

function clampVolume(value: number) {
  if (!Number.isFinite(value)) {
    return FULL_VOLUME
  }

  return Math.max(SILENT_VOLUME, Math.min(FULL_VOLUME, value))
}

function clearVolumeRamp() {
  activeRampId += 1

  if (volumeRampTimer) {
    clearInterval(volumeRampTimer)
    volumeRampTimer = null
  }
}

async function setPlayerVolume(value: number) {
  await TrackPlayer.setVolume(clampVolume(value))
}

async function startVolumeRamp(toVolume: number, durationSeconds: number) {
  clearVolumeRamp()

  const rampId = activeRampId
  const fromVolume = clampVolume(await TrackPlayer.getVolume())
  const targetVolume = clampVolume(toVolume)
  const durationMs = Math.max(1, durationSeconds * 1000)
  const startedAt = Date.now()

  if (durationMs <= FADE_STEP_MS) {
    await setPlayerVolume(targetVolume)
    return
  }

  volumeRampTimer = setInterval(() => {
    const progress = Math.min(1, (Date.now() - startedAt) / durationMs)
    const nextVolume = fromVolume + (targetVolume - fromVolume) * progress

    void setPlayerVolume(nextVolume).catch((error) => {
      clearVolumeRamp()
      logError("Failed to update crossfade volume", error)
    })

    if (progress >= 1 && rampId === activeRampId) {
      clearVolumeRamp()
    }
  }, FADE_STEP_MS)
}

function getFadeDurationSeconds(duration: number, requestedSeconds: number) {
  if (!Number.isFinite(duration) || duration <= 0) {
    return requestedSeconds
  }

  return Math.max(
    MIN_FADE_SECONDS,
    Math.min(requestedSeconds, Math.max(MIN_FADE_SECONDS, duration / 2))
  )
}

function hasNextQueueTrack() {
  const currentTrack = getCurrentTrackState()
  const queueTrackIds = getQueueTrackIdsState()

  if (!currentTrack || queueTrackIds.length <= 1) {
    return false
  }

  const currentIndex = queueTrackIds.indexOf(currentTrack.id)
  if (currentIndex < 0) {
    return false
  }

  if (currentIndex < queueTrackIds.length - 1) {
    return true
  }

  return getRepeatModeState() === "queue"
}

export async function resetCrossfadeVolume() {
  try {
    clearVolumeRamp()
    fadingOutTrackId = null
    shouldFadeInNextTrack = false
    await setPlayerVolume(FULL_VOLUME)
  } catch (error) {
    logError("Failed to reset crossfade volume", error)
  }
}

export async function handleCrossfadeProgress(
  position: number,
  duration: number
) {
  try {
    await ensureCrossfadeConfigLoaded()
    const config = getSettingsState().crossfadeConfig

    if (!config.isEnabled || config.durationSeconds <= 0) {
      if (volumeRampTimer || fadingOutTrackId || shouldFadeInNextTrack) {
        await resetCrossfadeVolume()
      }
      return
    }

    const currentTrack = getCurrentTrackState()
    if (!currentTrack || !hasNextQueueTrack()) {
      if (fadingOutTrackId || shouldFadeInNextTrack) {
        await resetCrossfadeVolume()
      }
      return
    }

    const fadeDurationSeconds = getFadeDurationSeconds(
      duration,
      config.durationSeconds
    )
    const remainingSeconds = duration - position

    if (
      !Number.isFinite(remainingSeconds) ||
      remainingSeconds <= 0 ||
      remainingSeconds > fadeDurationSeconds ||
      fadingOutTrackId === currentTrack.id
    ) {
      return
    }

    fadingOutTrackId = currentTrack.id
    shouldFadeInNextTrack = true
    await startVolumeRamp(
      SILENT_VOLUME,
      Math.max(MIN_FADE_SECONDS, remainingSeconds)
    )
  } catch (error) {
    logError("Failed to handle crossfade progress", error)
  }
}

export async function handleCrossfadeTrackActivated() {
  try {
    await ensureCrossfadeConfigLoaded()
    const config = getSettingsState().crossfadeConfig

    clearVolumeRamp()
    fadingOutTrackId = null

    if (!config.isEnabled || !shouldFadeInNextTrack) {
      shouldFadeInNextTrack = false
      await setPlayerVolume(FULL_VOLUME)
      return
    }

    shouldFadeInNextTrack = false
    await setPlayerVolume(SILENT_VOLUME)
    await startVolumeRamp(FULL_VOLUME, config.durationSeconds)
  } catch (error) {
    logError("Failed to handle crossfade track activation", error)
  }
}

export async function handleCrossfadePlaybackState(state: State) {
  if (
    state === State.Paused ||
    state === State.Stopped ||
    state === State.Ended ||
    state === State.None ||
    state === State.Error
  ) {
    await resetCrossfadeVolume()
  }
}

export async function handleCrossfadePlaybackStopped() {
  await resetCrossfadeVolume()
}
