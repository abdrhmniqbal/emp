import type { RepeatModeType, Track } from "@/modules/player/player.types"
import type { RepeatMode } from "@/modules/player/player.utils"
import { logError, logInfo } from "@/modules/logging/logging.service"
import { updateColorsForImage } from "@/modules/player/player-colors.service"
import {
  loadPlaybackSession,
  savePlaybackSession,
} from "@/modules/player/player-session.repository"
import { State, TrackPlayer } from "@/modules/player/player.utils"

import {
  mapRepeatMode,
  mapTrackPlayerRepeatMode,
  mapTrackPlayerTrackToTrack,
  mapTrackToTrackPlayerInput,
} from "./player-adapter"
import { setActiveTrack } from "./player-runtime-state"
import {
  beginPlayerQueueReplacement,
  endPlayerQueueReplacement,
} from "./player-runtime.service"
import {
  getCurrentTimeState,
  getCurrentTrackState,
  getImmediateQueueTrackIdsState,
  getIsPlayingState,
  getIsShuffledState,
  getOriginalQueueTrackIdsState,
  getQueueState,
  getQueueTrackIdsState,
  getRepeatModeState,
  getTracksState,
  setImmediateQueueTrackIdsState,
  setIsPlayingState,
  setQueueState,
  setQueueTrackIdsState,
  usePlayerStore,
} from "./player.store"

const MIN_SESSION_SAVE_INTERVAL_MS = 2000
const MAX_TRACKMAP_SIZE = 300
const TRACKMAP_ACTIVE_WINDOW = 120
const PLAYBACK_POSITION_EPSILON = 0.01

type NativeQueue = Awaited<ReturnType<typeof TrackPlayer.getQueue>>

interface ResolvedPlaybackSession {
  currentTrackId: string | null
  immediateQueueTrackIds: string[]
  isPlaying: boolean
  isShuffled: boolean
  originalQueue: Track[]
  positionSeconds: number
  queue: Track[]
  repeatMode: RepeatModeType
}

interface NativePlaybackStatusSnapshot {
  currentTrack: Track | null
  currentTrackId: string | null
  isPlaying: boolean
  positionSeconds: number
  repeatMode: RepeatModeType
}

let lastPlaybackSessionSavedAt = 0

function dedupeTrackIds(trackIds: string[]) {
  return trackIds.filter((trackId, index) => trackIds.indexOf(trackId) === index)
}

function areStringArraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false
    }
  }

  return true
}

function areTracksPresentationEqual(left: Track | null, right: Track | null) {
  if (left === right) {
    return true
  }

  if (!left || !right) {
    return left === right
  }

  return (
    left.id === right.id &&
    left.uri === right.uri &&
    left.duration === right.duration &&
    left.image === right.image &&
    left.title === right.title &&
    left.artist === right.artist &&
    left.album === right.album
  )
}

function mapNativeQueueToTracks(nativeQueue: NativeQueue) {
  return nativeQueue
    .map((track) => mapTrackPlayerTrackToTrack(track, getTracksState()))
    .filter((track) => track.id && track.uri)
}

function createPersistedTrackMap(queueTracks: ReturnType<typeof getQueueState>) {
  if (queueTracks.length === 0) {
    return {}
  }

  const currentTrackId = getCurrentTrackState()?.id ?? null
  const currentIndex = currentTrackId
    ? queueTracks.findIndex((track) => track.id === currentTrackId)
    : 0
  const startIndex =
    currentIndex >= 0 ? Math.max(0, currentIndex - TRACKMAP_ACTIVE_WINDOW) : 0
  const endIndex =
    currentIndex >= 0
      ? Math.min(queueTracks.length, currentIndex + TRACKMAP_ACTIVE_WINDOW + 1)
      : Math.min(queueTracks.length, MAX_TRACKMAP_SIZE)
  const selectedIds = new Set(
    queueTracks.slice(startIndex, endIndex).map((track) => track.id)
  )

  if (currentTrackId) {
    selectedIds.add(currentTrackId)
  }

  if (selectedIds.size < MAX_TRACKMAP_SIZE) {
    for (const trackId of getImmediateQueueTrackIdsState()) {
      selectedIds.add(trackId)
      if (selectedIds.size >= MAX_TRACKMAP_SIZE) {
        break
      }
    }
  }

  if (selectedIds.size < MAX_TRACKMAP_SIZE) {
    for (const track of queueTracks) {
      if (selectedIds.size >= MAX_TRACKMAP_SIZE) {
        break
      }
      selectedIds.add(track.id)
    }
  }

  return Object.fromEntries(
    queueTracks
      .filter((track) => selectedIds.has(track.id))
      .map((track) => [track.id, track])
  )
}

function applyResolvedPlaybackSession(session: ResolvedPlaybackSession) {
  const queueTrackIds = session.queue.map((track) => track.id)
  const originalQueueTrackIds = session.originalQueue.map((track) => track.id)
  const currentTrack =
    (session.currentTrackId
      ? session.queue.find((track) => track.id === session.currentTrackId)
      : null) ||
    session.queue[0] ||
    null
  const nextOriginalQueueTrackIds =
    originalQueueTrackIds.length > 0 ? originalQueueTrackIds : queueTrackIds
  const nextDuration = currentTrack?.duration || 0
  const previousState = usePlayerStore.getState()
  const updates: Partial<ReturnType<typeof usePlayerStore.getState>> = {}
  const shouldUpdateCurrentTrack = !areTracksPresentationEqual(
    previousState.currentTrack,
    currentTrack
  )

  if (!areStringArraysEqual(previousState.queueTrackIds, queueTrackIds)) {
    updates.queue = session.queue
    updates.queueTrackIds = queueTrackIds
  }

  if (
    !areStringArraysEqual(
      previousState.originalQueueTrackIds,
      nextOriginalQueueTrackIds
    )
  ) {
    updates.originalQueue = session.originalQueue
    updates.originalQueueTrackIds = nextOriginalQueueTrackIds
  }

  if (
    !areStringArraysEqual(
      previousState.immediateQueueTrackIds,
      session.immediateQueueTrackIds
    )
  ) {
    updates.immediateQueueTrackIds = session.immediateQueueTrackIds
  }

  if (previousState.isShuffled !== session.isShuffled) {
    updates.isShuffled = session.isShuffled
  }

  if (previousState.repeatMode !== session.repeatMode) {
    updates.repeatMode = session.repeatMode
  }

  if (previousState.isPlaying !== session.isPlaying) {
    updates.isPlaying = session.isPlaying
  }

  if (
    Math.abs(previousState.currentTime - session.positionSeconds) >=
    PLAYBACK_POSITION_EPSILON
  ) {
    updates.currentTime = session.positionSeconds
  }

  if (previousState.duration !== nextDuration) {
    updates.duration = nextDuration
  }

  if (shouldUpdateCurrentTrack) {
    updates.currentTrack = currentTrack
  }

  if (Object.keys(updates).length === 0) {
    return
  }

  usePlayerStore.setState(updates)

  if (shouldUpdateCurrentTrack) {
    void updateColorsForImage(currentTrack?.image)
  }
}

function resolveTracksFromIds(
  trackIds: string[],
  resolveTrack: (trackId: string) => Track | undefined
) {
  return dedupeTrackIds(trackIds)
    .map((trackId) => resolveTrack(trackId))
    .filter((track): track is Track => Boolean(track))
}

async function readNativePlaybackSession(): Promise<ResolvedPlaybackSession | null> {
  const [nativeQueue, activeIndex, positionSeconds, playbackState, repeatMode] =
    await Promise.all([
      TrackPlayer.getQueue(),
      TrackPlayer.getCurrentTrack(),
      TrackPlayer.getPosition(),
      TrackPlayer.getState(),
      TrackPlayer.getRepeatMode(),
    ])

  const mappedQueue = mapNativeQueueToTracks(nativeQueue)
  if (mappedQueue.length === 0) {
    return null
  }

  const currentTrackId =
    activeIndex !== null && activeIndex >= 0 && activeIndex < mappedQueue.length
      ? (mappedQueue[activeIndex]?.id ?? null)
      : (mappedQueue[0]?.id ?? null)

  return {
    queue: mappedQueue,
    originalQueue: mappedQueue,
    immediateQueueTrackIds: [],
    currentTrackId,
    positionSeconds: Math.max(0, positionSeconds),
    repeatMode: mapTrackPlayerRepeatMode(repeatMode as RepeatMode),
    isPlaying: playbackState === State.Playing,
    isShuffled: false,
  }
}

async function readNativePlaybackStatus(): Promise<NativePlaybackStatusSnapshot | null> {
  const [activeTrack, positionSeconds, playbackState, repeatMode] =
    await Promise.all([
      TrackPlayer.getActiveTrack(),
      TrackPlayer.getPosition(),
      TrackPlayer.getState(),
      TrackPlayer.getRepeatMode(),
    ])

  return {
    currentTrack: activeTrack
      ? mapTrackPlayerTrackToTrack(activeTrack, getTracksState())
      : null,
    currentTrackId:
      activeTrack?.id !== undefined ? String(activeTrack.id) : null,
    positionSeconds: Math.max(0, positionSeconds),
    repeatMode: mapTrackPlayerRepeatMode(repeatMode as RepeatMode),
    isPlaying: playbackState === State.Playing,
  }
}

async function readStoredPlaybackSession(): Promise<ResolvedPlaybackSession | null> {
  const snapshot = await loadPlaybackSession()
  if (!snapshot || snapshot.queueTrackIds.length === 0) {
    return null
  }

  const libraryTrackMap = new Map(getTracksState().map((track) => [track.id, track]))
  const resolveTrack = (trackId: string) =>
    libraryTrackMap.get(trackId) || snapshot.trackMap[trackId]

  const resolvedQueue = resolveTracksFromIds(snapshot.queueTrackIds, resolveTrack)
  if (resolvedQueue.length === 0) {
    return null
  }

  const resolvedOriginalQueue = resolveTracksFromIds(
    snapshot.originalQueueTrackIds,
    resolveTrack
  )
  const resolvedQueueIdSet = new Set(resolvedQueue.map((track) => track.id))
  const currentTrackId =
    snapshot.currentTrackId && resolvedQueueIdSet.has(snapshot.currentTrackId)
      ? snapshot.currentTrackId
      : (resolvedQueue[0]?.id ?? null)

  return {
    queue: resolvedQueue,
    originalQueue: resolvedOriginalQueue.length > 0 ? resolvedOriginalQueue : resolvedQueue,
    immediateQueueTrackIds: dedupeTrackIds(snapshot.immediateQueueTrackIds).filter(
      (trackId) => resolvedQueueIdSet.has(trackId)
    ),
    currentTrackId,
    positionSeconds: Math.max(0, snapshot.positionSeconds || 0),
    repeatMode: snapshot.repeatMode,
    isPlaying: false,
    isShuffled: snapshot.isShuffled,
  }
}

export async function persistPlaybackSession(options?: {
  force?: boolean
  skipQueueSync?: boolean
}): Promise<void> {
  const now = Date.now()
  if (
    !options?.force &&
    now - lastPlaybackSessionSavedAt < MIN_SESSION_SAVE_INTERVAL_MS
  ) {
    return
  }

  try {
    const shouldSyncQueueWithNativePlayer =
      options?.skipQueueSync !== true &&
      (options?.force === true || getQueueTrackIdsState().length === 0)
    const queueTracks = shouldSyncQueueWithNativePlayer
      ? mapNativeQueueToTracks(await TrackPlayer.getQueue())
      : getQueueState()
    const queueTrackIds = queueTracks.map((track) => track.id)
    const trackMap = createPersistedTrackMap(queueTracks)
    let currentTrackId = getCurrentTrackState()?.id ?? null

    if (shouldSyncQueueWithNativePlayer) {
      const currentIndex = await TrackPlayer.getCurrentTrack()
      currentTrackId =
        currentIndex !== null &&
        currentIndex >= 0 &&
        currentIndex < queueTracks.length
          ? (queueTracks[currentIndex]?.id ?? null)
          : (getCurrentTrackState()?.id ?? null)
    }

    const positionSeconds = await TrackPlayer.getPosition()

    await savePlaybackSession({
      queueTrackIds,
      originalQueueTrackIds:
        getOriginalQueueTrackIdsState().length > 0
          ? getOriginalQueueTrackIdsState()
          : queueTrackIds,
      immediateQueueTrackIds: getImmediateQueueTrackIdsState(),
      trackMap,
      currentTrackId,
      positionSeconds,
      repeatMode: getRepeatModeState(),
      wasPlaying: getIsPlayingState(),
      isShuffled: getIsShuffledState(),
      savedAt: now,
    })
    lastPlaybackSessionSavedAt = now
  } catch (error) {
    logError("Failed to persist playback session", error, options)
  }
}

export async function restorePlaybackSession(): Promise<void> {
  try {
    const [nativeStatus, storedSession] = await Promise.all([
      readNativePlaybackStatus(),
      readStoredPlaybackSession(),
    ])

    if (
      storedSession &&
      (!nativeStatus?.currentTrackId ||
        storedSession.queue.some(
          (track) => track.id === nativeStatus.currentTrackId
        ))
    ) {
      logInfo("Hydrating playback session from saved snapshot", {
        queueLength: storedSession.queue.length,
        currentTrackId:
          nativeStatus?.currentTrackId ?? storedSession.currentTrackId,
      })
      applyResolvedPlaybackSession({
        ...storedSession,
        currentTrackId:
          nativeStatus?.currentTrackId ?? storedSession.currentTrackId,
        isPlaying: nativeStatus?.isPlaying ?? storedSession.isPlaying,
        positionSeconds:
          nativeStatus?.positionSeconds ?? storedSession.positionSeconds,
        repeatMode: nativeStatus?.repeatMode ?? storedSession.repeatMode,
      })
      return
    }

    const nativeSession = await readNativePlaybackSession()
    if (nativeSession) {
      logInfo("Restoring playback session from native queue", {
        queueLength: nativeSession.queue.length,
      })
      applyResolvedPlaybackSession(nativeSession)
      return
    }

    if (!storedSession) {
      logInfo("No playback session snapshot available to restore")
      return
    }

    logInfo("Hydrating playback session from saved snapshot", {
      queueLength: storedSession.queue.length,
      currentTrackId: storedSession.currentTrackId,
    })
    applyResolvedPlaybackSession(storedSession)
  } catch (error) {
    logError("Failed to restore playback session", error)
  }
}

export async function syncPlaybackSessionFromPlayer() {
  try {
    return await syncPlaybackSessionFromPlayerWithStrategy("full")
  } catch (error) {
    logError("Failed to sync playback session from player", error)
    return false
  }
}

async function syncPlaybackSessionFromPlayerWithStrategy(
  strategy: "foreground" | "full"
) {
  if (strategy === "full") {
    const nativeSession = await readNativePlaybackSession()
    if (!nativeSession) {
      return false
    }

    applyResolvedPlaybackSession(nativeSession)
    return true
  }

  const nativeStatus = await readNativePlaybackStatus()
  if (!nativeStatus) {
    return false
  }

  const previousState = usePlayerStore.getState()
  const queue = getQueueState()
  const hasTrackInQueue =
    !nativeStatus.currentTrackId ||
    queue.some((track) => track.id === nativeStatus.currentTrackId)

  if (queue.length === 0 || !hasTrackInQueue) {
    const storedSession = await readStoredPlaybackSession()

    if (
      storedSession &&
      (!nativeStatus.currentTrackId ||
        storedSession.queue.some(
          (track) => track.id === nativeStatus.currentTrackId
        ))
    ) {
      applyResolvedPlaybackSession({
        ...storedSession,
        currentTrackId:
          nativeStatus.currentTrackId ?? storedSession.currentTrackId,
        isPlaying: nativeStatus.isPlaying,
        positionSeconds: nativeStatus.positionSeconds,
        repeatMode: nativeStatus.repeatMode,
      })
      return true
    }

    const nativeSession = await readNativePlaybackSession()
    if (!nativeSession) {
      return false
    }

    applyResolvedPlaybackSession(nativeSession)
    return true
  }

  const resolvedCurrentTrack =
    (nativeStatus.currentTrackId
      ? queue.find((track) => track.id === nativeStatus.currentTrackId) ?? null
      : previousState.currentTrack) || nativeStatus.currentTrack
  const shouldUpdateCurrentTrack = !areTracksPresentationEqual(
    previousState.currentTrack,
    resolvedCurrentTrack
  )
  const nextDuration = resolvedCurrentTrack?.duration || 0
  const updates: Partial<ReturnType<typeof usePlayerStore.getState>> = {}

  if (shouldUpdateCurrentTrack) {
    updates.currentTrack = resolvedCurrentTrack
  }

  if (previousState.duration !== nextDuration) {
    updates.duration = nextDuration
  }

  if (
    Math.abs(previousState.currentTime - nativeStatus.positionSeconds) >=
    PLAYBACK_POSITION_EPSILON
  ) {
    updates.currentTime = nativeStatus.positionSeconds
  }

  if (previousState.repeatMode !== nativeStatus.repeatMode) {
    updates.repeatMode = nativeStatus.repeatMode
  }

  if (previousState.isPlaying !== nativeStatus.isPlaying) {
    updates.isPlaying = nativeStatus.isPlaying
  }

  if (Object.keys(updates).length === 0) {
    return true
  }

  usePlayerStore.setState(updates)

  if (shouldUpdateCurrentTrack) {
    void updateColorsForImage(resolvedCurrentTrack?.image)
  }

  return true
}

export async function syncPlaybackStateAfterForeground() {
  try {
    return await syncPlaybackSessionFromPlayerWithStrategy("foreground")
  } catch (error) {
    logError("Failed to sync playback state after foreground", error)
    return false
  }
}

export async function ensureNativePlaybackQueue(options?: { autoPlay?: boolean }) {
  const nativeQueue = await TrackPlayer.getQueue()
  if (nativeQueue.length > 0) {
    return true
  }

  const queue = getQueueState()
  if (queue.length === 0) {
    return false
  }

  const currentTrackId = getCurrentTrackState()?.id ?? queue[0]?.id ?? null
  const targetIndex = currentTrackId
    ? queue.findIndex((track) => track.id === currentTrackId)
    : 0
  const positionSeconds = Math.max(0, getCurrentTimeState())

  logInfo("Hydrating native playback queue from player store", {
    queueLength: queue.length,
    currentTrackId,
    autoPlay: options?.autoPlay ?? false,
  })

  beginPlayerQueueReplacement()

  try {
    await TrackPlayer.reset()
    await TrackPlayer.add(queue.map(mapTrackToTrackPlayerInput))
    await TrackPlayer.setRepeatMode(mapRepeatMode(getRepeatModeState()))

    if (targetIndex > 0) {
      await TrackPlayer.skip(targetIndex)
    }

    if (positionSeconds > 0) {
      await TrackPlayer.seekTo(positionSeconds)
    }

    if (options?.autoPlay) {
      await TrackPlayer.play()
      setIsPlayingState(true)
    }

    return true
  } finally {
    endPlayerQueueReplacement()
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
      setQueueTrackIdsState(mappedQueue.map((track) => track.id))

      const mappedQueueIdSet = new Set(mappedQueue.map((track) => track.id))
      const currentImmediateIds = getImmediateQueueTrackIdsState()
      const nextImmediateIds = currentImmediateIds.filter((trackId) =>
        mappedQueueIdSet.has(trackId)
      )

      if (nextImmediateIds.length !== currentImmediateIds.length) {
        setImmediateQueueTrackIdsState(nextImmediateIds)
      }
    }

    if (
      activeIndex !== null &&
      activeIndex >= 0 &&
      activeIndex < mappedQueue.length
    ) {
      const consumedTrackIds = new Set(
        mappedQueue.slice(0, activeIndex + 1).map((track) => track.id)
      )
      const currentImmediateIds = getImmediateQueueTrackIdsState()
      const nextImmediateIds = currentImmediateIds.filter(
        (trackId) => !consumedTrackIds.has(trackId)
      )

      if (nextImmediateIds.length !== currentImmediateIds.length) {
        setImmediateQueueTrackIdsState(nextImmediateIds)
      }

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
