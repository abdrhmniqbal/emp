import { atom } from "nanostores"

import { queryClient } from "@/lib/tanstack-query"
import { toggleFavoriteDB } from "@/modules/favorites/favorites.api"
import {
  addTrackToHistory,
  incrementTrackPlayCount,
} from "@/modules/history/history.api"
import {
  Capability,
  Event,
  RepeatMode,
  State,
  TrackPlayer,
} from "@/modules/player/player.utils"
import {
  loadPlaybackSession,
  savePlaybackSession,
} from "@/modules/player/player-session"

import type { Album, Artist, LyricLine, Track } from "./player.types"

export type { Album, Artist, LyricLine, Track }

export const $tracks = atom<Track[]>([])
export const $currentTrack = atom<Track | null>(null)
export const $isPlaying = atom(false)
export const $currentTime = atom(0)
export const $duration = atom(0)

export type RepeatModeType = "off" | "track" | "queue"
export const $repeatMode = atom<RepeatModeType>("off")

let isPlayerReady = false
const MIN_SESSION_SAVE_INTERVAL_MS = 2000
let lastPlaybackSessionSavedAt = 0

function mapTrackPlayerTrackToTrack(track: any): Track {
  const trackId = String(track.id)
  const existingTrack = $tracks.get().find((item) => item.id === trackId)

  return {
    ...existingTrack,
    id: trackId,
    title: typeof track.title === "string" ? track.title : "Unknown Track",
    artist: track.artist,
    album: track.album,
    duration: track.duration || 0,
    uri: track.url as string,
    image: track.artwork as string | undefined,
  }
}

function mapTrackToTrackPlayerInput(track: Track) {
  return {
    id: track.id,
    url: track.uri,
    title: track.title,
    artist: track.artist,
    album: track.album,
    artwork: track.image,
    duration: track.duration,
  }
}

function mapTrackPlayerRepeatMode(mode: RepeatMode): RepeatModeType {
  switch (mode) {
    case RepeatMode.Track:
      return "track"
    case RepeatMode.Queue:
      return "queue"
    case RepeatMode.Off:
    default:
      return "off"
  }
}

function mapRepeatMode(mode: RepeatModeType): RepeatMode {
  switch (mode) {
    case "track":
      return RepeatMode.Track
    case "queue":
      return RepeatMode.Queue
    case "off":
    default:
      return RepeatMode.Off
  }
}

async function setQueueStore(tracks: Track[]): Promise<void> {
  const { setQueue } = await import("./queue.store")
  setQueue(tracks)
}

export async function persistPlaybackSession(
  options?: { force?: boolean }
): Promise<void> {
  if (!isPlayerReady) {
    return
  }

  const now = Date.now()
  if (!options?.force && now - lastPlaybackSessionSavedAt < MIN_SESSION_SAVE_INTERVAL_MS) {
    return
  }

  try {
    const queue = (await TrackPlayer.getQueue())
      .map(mapTrackPlayerTrackToTrack)
      .filter((track) => track.id && track.uri)
    const currentIndex = await TrackPlayer.getCurrentTrack()
    const positionSeconds = await TrackPlayer.getPosition()

    const currentTrackId =
      currentIndex !== null && currentIndex >= 0 && currentIndex < queue.length
        ? queue[currentIndex]?.id ?? null
        : $currentTrack.get()?.id ?? null

    await savePlaybackSession({
      queue,
      currentTrackId,
      positionSeconds,
      repeatMode: $repeatMode.get(),
      wasPlaying: $isPlaying.get(),
      savedAt: now,
    })
    lastPlaybackSessionSavedAt = now
  } catch {}
}

export async function restorePlaybackSession(): Promise<void> {
  if (!isPlayerReady) {
    return
  }

  try {
    const nativeQueue = await TrackPlayer.getQueue()

    if (nativeQueue.length > 0) {
      const mappedQueue = nativeQueue
        .map(mapTrackPlayerTrackToTrack)
        .filter((track) => track.id && track.uri)
      if (mappedQueue.length > 0) {
        await setQueueStore(mappedQueue)
      }

      const currentIndex = await TrackPlayer.getCurrentTrack()
      if (
        currentIndex !== null
        && currentIndex >= 0
        && currentIndex < mappedQueue.length
      ) {
        $currentTrack.set(mappedQueue[currentIndex] || null)
      } else {
        $currentTrack.set(mappedQueue[0] || null)
      }

      const [position, playbackState, repeatMode] = await Promise.all([
        TrackPlayer.getPosition(),
        TrackPlayer.getState(),
        TrackPlayer.getRepeatMode(),
      ])

      $currentTime.set(position)
      $duration.set($currentTrack.get()?.duration || 0)
      $isPlaying.set(playbackState === State.Playing)
      $repeatMode.set(mapTrackPlayerRepeatMode(repeatMode))
      await persistPlaybackSession({ force: true })
      return
    }

    const snapshot = await loadPlaybackSession()
    if (!snapshot || snapshot.queue.length === 0) {
      return
    }

    await TrackPlayer.reset()
    await TrackPlayer.add(snapshot.queue.map(mapTrackToTrackPlayerInput))

    const currentIndex =
      snapshot.currentTrackId !== null
        ? snapshot.queue.findIndex((track) => track.id === snapshot.currentTrackId)
        : 0
    const targetIndex = currentIndex >= 0 ? currentIndex : 0
    const targetPosition = Math.max(0, snapshot.positionSeconds || 0)

    await TrackPlayer.skip(targetIndex, targetPosition)
    await TrackPlayer.setRepeatMode(mapRepeatMode(snapshot.repeatMode))

    const currentTrack = snapshot.queue[targetIndex] || null
    await setQueueStore(snapshot.queue)
    $currentTrack.set(currentTrack)
    $currentTime.set(targetPosition)
    $duration.set(currentTrack?.duration || 0)
    $repeatMode.set(snapshot.repeatMode)

    if (snapshot.wasPlaying) {
      await TrackPlayer.play()
      $isPlaying.set(true)
    } else {
      await TrackPlayer.pause()
      $isPlaying.set(false)
    }

    await persistPlaybackSession({ force: true })
  } catch {}
}

export async function setupPlayer() {
  try {
    // Check if player is already initialized
    if (isPlayerReady) {
      return
    }

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
      progressUpdateEventInterval: 1,
    })

    isPlayerReady = true
  } catch (e: any) {
    // If already initialized, mark as ready
    if (e?.message?.includes("already been initialized")) {
      isPlayerReady = true
    }
  }
}

// Playback service for background controls
export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play()
  })

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause()
  })

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    playNext()
  })

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    playPrevious()
  })

  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    if (event.position !== undefined) {
      TrackPlayer.seekTo(event.position)
    }
  })

  TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
    $isPlaying.set(event.state === State.Playing)
    void persistPlaybackSession()
  })

  // v4 API: Use PlaybackTrackChanged with nextTrack property
  TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async (event) => {
    if (event.nextTrack !== undefined && event.nextTrack !== null) {
      const track = await TrackPlayer.getTrack(event.nextTrack)
      if (track) {
        const currentTrack = mapTrackPlayerTrackToTrack(track)
        $currentTrack.set(currentTrack)

        addTrackToHistory(currentTrack.id)
        incrementTrackPlayCount(currentTrack.id)
        void persistPlaybackSession({ force: true })
      }
    }
  })

  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event) => {
    $currentTime.set(event.position)
    $duration.set(event.duration)
    void persistPlaybackSession()
  })
}

export async function playTrack(track: Track, playlistTracks?: Track[]) {
  if (!isPlayerReady) {
    return
  }

  try {
    await TrackPlayer.reset()

    const tracks = playlistTracks || $tracks.get()
    const selectedTrackIndex = tracks.findIndex((t) => t.id === track.id)
    const currentTrackIndex = selectedTrackIndex >= 0 ? selectedTrackIndex : 0

    const queue = tracks
      .slice(currentTrackIndex)
      .concat(tracks.slice(0, currentTrackIndex))

    await setQueueStore(queue)

    await TrackPlayer.add(queue.map(mapTrackToTrackPlayerInput))

    $currentTrack.set(track)

    await TrackPlayer.play()
    $isPlaying.set(true)
    $currentTime.set(0)
    $duration.set(track.duration || 0)
    await persistPlaybackSession({ force: true })
  } catch {}
}

export async function pauseTrack() {
  try {
    await TrackPlayer.pause()
    $isPlaying.set(false)
    await persistPlaybackSession({ force: true })
  } catch {}
}

export async function resumeTrack() {
  try {
    await TrackPlayer.play()
    $isPlaying.set(true)
    await persistPlaybackSession({ force: true })
  } catch {}
}

export async function togglePlayback() {
  // v4 API: getState() returns the state directly
  const state = await TrackPlayer.getState()
  if (state === State.Playing) {
    await pauseTrack()
  } else {
    await resumeTrack()
  }
}

export async function playNext() {
  try {
    await TrackPlayer.skipToNext()
    // v4 API: getCurrentTrack() returns the active track index
    const currentTrackId = await TrackPlayer.getCurrentTrack()
    if (currentTrackId !== undefined && currentTrackId !== null) {
      const track = await TrackPlayer.getTrack(currentTrackId)
      if (track) {
        $currentTrack.set(mapTrackPlayerTrackToTrack(track))
        await persistPlaybackSession({ force: true })
      }
    }
  } catch {
    // If at end of queue, wrap to beginning
    const tracks = $tracks.get()
    if (tracks.length > 0) {
      await playTrack(tracks[0])
    }
  }
}

export async function playPrevious() {
  try {
    // v4 API: getPosition() returns position directly
    const position = await TrackPlayer.getPosition()
    if (position > 3) {
      await TrackPlayer.seekTo(0)
    } else {
      await TrackPlayer.skipToPrevious()
      // v4 API: getCurrentTrack() returns the active track index
      const currentTrackId = await TrackPlayer.getCurrentTrack()
      if (currentTrackId !== undefined && currentTrackId !== null) {
        const track = await TrackPlayer.getTrack(currentTrackId)
        if (track) {
          $currentTrack.set(mapTrackPlayerTrackToTrack(track))
          await persistPlaybackSession({ force: true })
        }
      }
    }
  } catch {
    // If at beginning of queue, stay at first track
  }
}

export async function seekTo(seconds: number) {
  try {
    await TrackPlayer.seekTo(seconds)
    $currentTime.set(seconds)
    await persistPlaybackSession({ force: true })
  } catch {}
}

export async function setRepeatMode(mode: RepeatModeType) {
  try {
    await TrackPlayer.setRepeatMode(mapRepeatMode(mode))
    $repeatMode.set(mode)
    await persistPlaybackSession({ force: true })
  } catch {}
}

export async function toggleRepeatMode() {
  const currentMode = $repeatMode.get()
  const nextMode: RepeatModeType =
    currentMode === "off" ? "track" : currentMode === "track" ? "queue" : "off"
  await setRepeatMode(nextMode)
}

export function toggleFavorite(trackId: string) {
  const tracks = $tracks.get()
  const index = tracks.findIndex((t) => t.id === trackId)
  if (index === -1) return

  const track = tracks[index]
  const newStatus = !track.isFavorite

  // Create new array reference for immutability
  const newTracks = [...tracks]
  newTracks[index] = { ...track, isFavorite: newStatus }
  $tracks.set(newTracks)

  const current = $currentTrack.get()
  if (current?.id === trackId) {
    $currentTrack.set({ ...current, isFavorite: newStatus })
  }

  void toggleFavoriteDB(trackId, newStatus).then(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["favorites"] }),
      queryClient.invalidateQueries({ queryKey: ["library", "favorites"] }),
      queryClient.invalidateQueries({ queryKey: ["tracks"] }),
      queryClient.invalidateQueries({ queryKey: ["library", "tracks"] }),
    ])
  })
}

export async function setQueue(tracks: Track[]) {
  $tracks.set(tracks)
}

// Load tracks from database
export async function loadTracks() {
  try {
    const { getAllTracks } = await import("@/modules/player/player.api")
    const trackList = await getAllTracks()
    $tracks.set(trackList)
  } catch {}
}
