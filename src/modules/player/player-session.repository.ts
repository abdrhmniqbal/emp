import type { RepeatModeType, Track } from "./player.types"
import { File, Paths } from "expo-file-system"

interface PersistedPlaybackSession {
  queueTrackIds: string[]
  originalQueueTrackIds: string[]
  immediateQueueTrackIds: string[]
  trackMap: Record<string, Track>
  currentTrackId: string | null
  positionSeconds: number
  repeatMode: RepeatModeType
  wasPlaying: boolean
  isShuffled: boolean
  savedAt: number
}

const PLAYBACK_SESSION_FILE = new File(Paths.document, "playback-session.json")

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null
  }

  return value as Record<string, unknown>
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined
}

function sanitizeTrack(track: unknown): Track | null {
  const source = asObject(track)
  if (!source) {
    return null
  }

  const id = asString(source.id) || ""
  const title = asString(source.title) || ""
  const uri = asString(source.uri) || ""

  if (!id || !title || !uri) {
    return null
  }

  return {
    id,
    title,
    artist: asString(source.artist),
    artistId: asString(source.artistId),
    albumArtist: asString(source.albumArtist),
    album: asString(source.album),
    albumId: asString(source.albumId),
    duration: asNumber(source.duration) ?? 0,
    uri,
    image: asString(source.image),
    lyrics: asString(source.lyrics),
    fileHash: asString(source.fileHash),
    scanTime: asNumber(source.scanTime),
    isDeleted: asBoolean(source.isDeleted),
    playCount: asNumber(source.playCount),
    lastPlayedAt: asNumber(source.lastPlayedAt),
    year: asNumber(source.year),
    filename: asString(source.filename),
    dateAdded: asNumber(source.dateAdded),
    isFavorite: asBoolean(source.isFavorite),
    discNumber: asNumber(source.discNumber),
    trackNumber: asNumber(source.trackNumber),
    genre: asString(source.genre),
  }
}

function sanitizeSession(payload: unknown): PersistedPlaybackSession | null {
  const source = asObject(payload)
  if (!source) {
    return null
  }

  const hasIdQueue = Array.isArray(source.queueTrackIds)
  const hasLegacyQueue = Array.isArray(source.queue)

  if (!hasIdQueue && !hasLegacyQueue) {
    return null
  }

  const trackMap: Record<string, Track> = {}
  let queueTrackIds: string[] = []

  if (hasIdQueue) {
    const payloadTrackMap = asObject(source.trackMap) || {}

    for (const [trackId, value] of Object.entries(payloadTrackMap)) {
      const sanitized = sanitizeTrack(value)
      if (!sanitized) {
        continue
      }

      trackMap[sanitized.id] = sanitized
      if (sanitized.id !== trackId) {
        trackMap[trackId] = sanitized
      }
    }

    queueTrackIds = (source.queueTrackIds as unknown[])
      ?.filter((trackId): trackId is string => typeof trackId === "string")
      .filter((trackId) => Boolean(trackMap[trackId]))
      .filter((trackId, index, array) => array.indexOf(trackId) === index) || []
  } else {
    const legacyQueue = (source.queue as unknown[])
      .map((item) => sanitizeTrack(item))
      .filter((item): item is Track => Boolean(item))

    for (const item of legacyQueue) {
      trackMap[item.id] = item
    }

    queueTrackIds = legacyQueue.map((item) => item.id)
  }

  const originalQueueTrackIds = Array.isArray(source.originalQueueTrackIds)
    ? (source.originalQueueTrackIds as unknown[])
        .filter((trackId): trackId is string => typeof trackId === "string")
        .filter((trackId) => Boolean(trackMap[trackId]))
        .filter((trackId, index, array) => array.indexOf(trackId) === index)
    : [...queueTrackIds]

  const immediateQueueTrackIds = Array.isArray(source.immediateQueueTrackIds)
    ? (source.immediateQueueTrackIds as unknown[])
        .filter((trackId): trackId is string => typeof trackId === "string")
        .filter((trackId) => Boolean(trackMap[trackId]))
        .filter((trackId, index, array) => array.indexOf(trackId) === index)
    : []

  const positionSeconds = Number.isFinite(asNumber(source.positionSeconds))
    ? Math.max(0, asNumber(source.positionSeconds) ?? 0)
    : 0

  const repeatMode: RepeatModeType =
    source.repeatMode === "track" ||
    source.repeatMode === "queue" ||
    source.repeatMode === "off"
      ? (source.repeatMode as RepeatModeType)
      : "off"

  const currentTrackIdValue = asString(source.currentTrackId)
  const currentTrackId =
    typeof currentTrackIdValue === "string" && currentTrackIdValue.length > 0
      ? (trackMap[currentTrackIdValue] ? currentTrackIdValue : null)
      : null

  return {
    queueTrackIds,
    originalQueueTrackIds,
    immediateQueueTrackIds,
    trackMap,
    currentTrackId,
    positionSeconds,
    repeatMode,
    wasPlaying: Boolean(source.wasPlaying),
    isShuffled: Boolean(source.isShuffled),
    savedAt: asNumber(source.savedAt) ?? Date.now(),
  }
}

export async function savePlaybackSession(
  session: PersistedPlaybackSession
): Promise<void> {
  const sanitized = sanitizeSession(session)
  if (!sanitized) {
    return
  }

  if (!PLAYBACK_SESSION_FILE.exists) {
    PLAYBACK_SESSION_FILE.create({
      intermediates: true,
      overwrite: true,
    })
  }

  PLAYBACK_SESSION_FILE.write(JSON.stringify(sanitized), {
    encoding: "utf8",
  })
}

export async function loadPlaybackSession(): Promise<PersistedPlaybackSession | null> {
  try {
    if (!PLAYBACK_SESSION_FILE.exists) {
      return null
    }

    const raw = await PLAYBACK_SESSION_FILE.text()
    const parsed = JSON.parse(raw) as unknown
    return sanitizeSession(parsed)
  } catch {
    return null
  }
}
