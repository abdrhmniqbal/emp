/**
 * Purpose: Sets up native audio playback, identifies external intent tracks, replaces the active TrackPlayer queue, and stores queue source context when playback starts.
 * Caller: track rows, player controls, queue recovery flows, bootstrap playback setup, external audio intent handler.
 * Dependencies: TrackPlayer native module, notification icon asset, player store, playback session service, player activity service, crossfade transition service, file URI utilities, logging service.
 * Main Functions: setupPlayer(), playTrack(), playExternalFileUri()
 * Side Effects: Initializes native playback, updates notification options, resets native queue/context and volume transitions, starts playback, persists session state.
 */

import { processColor } from "react-native"
import notificationIcon from "@/assets/notification-icon.png"
import { logError, logInfo, logWarn } from "@/modules/logging/logging.service"
import { handleTrackActivated } from "@/modules/player/player-activity.service"
import {
  mapRepeatMode,
  mapTrackToTrackPlayerInput,
} from "@/modules/player/player-adapter"
import {
  EXTERNAL_TRACK_ID_PREFIX,
  type PlayerQueueContext,
  type Track,
} from "@/modules/player/player.types"
import { resetCrossfadeVolume } from "@/modules/player/player-crossfade.service"
import { setActiveTrack, setPlaybackProgress } from "@/modules/player/player-runtime-state"
import {
  beginPlayerQueueReplacement,
  endPlayerQueueReplacement,
} from "@/modules/player/player-runtime.service"
import { persistPlaybackSession } from "@/modules/player/player-session.service"
import { resolvePlayableFileUri } from "@/utils/file-path"

import {
  AndroidAudioContentType,
  AppKilledPlaybackBehavior,
  Capability,
  IOSCategory,
  TrackPlayer,
} from "@/modules/player/player.utils"

import {
  getIsShuffledState,
  getRepeatModeState,
  getTracksState,
  setImmediateQueueTrackIdsState,
  setIsPlayingState,
  setIsShuffledState,
  setOriginalQueueState,
  setOriginalQueueTrackIdsState,
  setQueueContextState,
  setQueueState,
  setQueueTrackIdsState,
} from "./player.store"

let isPlayerReady = false

function decodeUriRecursively(value: string) {
  let decodedValue = value

  for (let iteration = 0; iteration < 3; iteration += 1) {
    try {
      const nextValue = decodeURIComponent(decodedValue)
      if (nextValue === decodedValue) {
        break
      }
      decodedValue = nextValue
    } catch {
      break
    }
  }

  return decodedValue
}

function normalizeUriForComparison(uri: string) {
  return decodeUriRecursively(uri).replace(/\/+$/, "")
}

function extractExternalUriTrackIds(uri: string) {
  const decodedUri = decodeUriRecursively(uri)
  const candidates = new Set<string>()
  const documentIdMatch = decodedUri.match(
    /(?:document|tree)\/audio:([^/?#]+)/i
  )
  const mediaStoreIdMatch = decodedUri.match(/\/audio\/media\/([^/?#]+)/i)
  const genericMediaIdMatch = decodedUri.match(/\/media\/([^/?#]+)/i)

  const addCandidate = (value?: string) => {
    const decodedValue = value ? decodeUriRecursively(value).trim() : ""
    if (decodedValue) {
      candidates.add(decodedValue)
    }
  }

  addCandidate(documentIdMatch?.[1])
  addCandidate(mediaStoreIdMatch?.[1])
  addCandidate(genericMediaIdMatch?.[1])

  return candidates
}

function getExternalTrackTitle(uri: string) {
  const normalizedUri = decodeUriRecursively(uri)
  const pathWithoutQuery = normalizedUri.split(/[?#]/)[0] ?? normalizedUri
  const filename = pathWithoutQuery.split("/").filter(Boolean).at(-1) ?? ""
  const title = filename.replace(/\.[^.]+$/, "").trim()

  return title || normalizedUri
}

function findIndexedTrackForUri(uri: string, resolvedUri: string) {
  const candidates = new Set([
    normalizeUriForComparison(uri),
    normalizeUriForComparison(resolvedUri),
  ])
  const idCandidates = new Set([
    ...extractExternalUriTrackIds(uri),
    ...extractExternalUriTrackIds(resolvedUri),
  ])

  return getTracksState().find((track) =>
    idCandidates.has(track.id) ||
    candidates.has(normalizeUriForComparison(track.uri))
  )
}

function buildExternalTrack(uri: string, resolvedUri: string): Track {
  return {
    id: `${EXTERNAL_TRACK_ID_PREFIX}${Date.now()}:${resolvedUri}`,
    title: getExternalTrackTitle(resolvedUri || uri),
    duration: 0,
    uri: resolvedUri || uri,
    isExternal: true,
  }
}

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

function allTracksShareValue(
  tracks: Track[],
  getValue: (track: Track) => string | undefined
) {
  const values = tracks
    .map((track) => getValue(track)?.trim())
    .filter((value): value is string => Boolean(value))

  if (values.length !== tracks.length || values.length === 0) {
    return false
  }

  const firstValue = values[0]
  if (!firstValue) {
    return false
  }

  return values.every(
    (value) => value.toLowerCase() === firstValue.toLowerCase()
  )
}

function inferQueueContext(
  track: Track,
  tracks: Track[],
  providedContext?: PlayerQueueContext
): PlayerQueueContext | null {
  const providedTitle = providedContext?.title.trim()
  if (providedContext && providedTitle) {
    return { ...providedContext, title: providedTitle }
  }

  if (track.isExternal) {
    return { type: "external", title: track.title }
  }

  if (
    track.album?.trim() &&
    (allTracksShareValue(tracks, (item) => item.albumId) ||
      allTracksShareValue(tracks, (item) => item.album))
  ) {
    return { type: "album", title: track.album.trim() }
  }

  if (
    track.artist?.trim() &&
    (allTracksShareValue(tracks, (item) => item.artistId) ||
      allTracksShareValue(tracks, (item) => item.artist))
  ) {
    return { type: "artist", title: track.artist.trim() }
  }

  return null
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

export async function playTrack(
  track: Track,
  playlistTracks?: Track[],
  queueContext?: PlayerQueueContext
) {
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

    const wasShuffled = getIsShuffledState()
    const tracks = playlistTracks || getTracksState()
    const resolvedQueueContext = inferQueueContext(track, tracks, queueContext)
    const { queue: linearQueue, queueTrackIds: linearQueueTrackIds } =
      buildPlaybackQueue(tracks, track.id)

    let effectiveQueue = linearQueue
    let effectiveQueueTrackIds = linearQueueTrackIds

    if (wasShuffled && linearQueue.length > 1) {
      const [head, ...rest] = linearQueue
      for (let i = rest.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[rest[i], rest[j]] = [rest[j], rest[i]]
      }
      effectiveQueue = head ? [head, ...rest] : rest
      effectiveQueueTrackIds = effectiveQueue.map((t) => t.id)
    }

    setQueueState(effectiveQueue)
    setOriginalQueueState(linearQueue)
    setQueueTrackIdsState(effectiveQueueTrackIds)
    setOriginalQueueTrackIdsState(linearQueueTrackIds)
    setImmediateQueueTrackIdsState([])
    setQueueContextState(resolvedQueueContext)
    setIsShuffledState(wasShuffled)
    setActiveTrack(track)
    setIsPlayingState(true)
    setPlaybackProgress(0, track.duration || 0)

    await TrackPlayer.reset()
    await resetCrossfadeVolume()

    await TrackPlayer.add(effectiveQueue.map(mapTrackToTrackPlayerInput))
    await TrackPlayer.setRepeatMode(mapRepeatMode(getRepeatModeState()))

    await TrackPlayer.play()
    if (!track.isExternal) {
      await handleTrackActivated(track)
      await persistPlaybackSession({ force: true })
    }
  } catch (error) {
    logError("Failed to play track", error, { trackId: track.id })
  } finally {
    endPlayerQueueReplacement()
  }
}

export async function playExternalFileUri(uri: string) {
  const decodedUri = decodeUriRecursively(uri).trim()
  if (!decodedUri) {
    return false
  }

  if (!isPlayerReady) {
    await setupPlayer()
  }

  if (!isPlayerReady) {
    logWarn("Ignored external file playback because player is not ready", {
      uri: decodedUri,
    })
    return false
  }

  const resolvedUri = await resolvePlayableFileUri(decodedUri)
  const indexedTrack = findIndexedTrackForUri(decodedUri, resolvedUri)

  if (indexedTrack) {
    await playTrack(indexedTrack, undefined, {
      type: "external",
      title: indexedTrack.title,
    })
    return true
  }

  const externalTrack = buildExternalTrack(decodedUri, resolvedUri)
  await playTrack(externalTrack, [externalTrack], {
    type: "external",
    title: externalTrack.title,
  })
  return true
}
