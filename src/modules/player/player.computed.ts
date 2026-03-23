import {
  type ColorPalette,
  usePlayerColorsStore,
} from "./player-colors.store"
import { usePlayerStore } from "./player.store"

export interface PlayerState {
  track: ReturnType<typeof usePlayerStore.getState>["currentTrack"]
  isPlaying: boolean
  currentTime: number
  duration: number
  progressPercent: number
  formattedCurrentTime: string
  formattedDuration: string
}

export interface QueueState {
  tracks: ReturnType<typeof usePlayerStore.getState>["tracks"]
  currentTrack: ReturnType<typeof usePlayerStore.getState>["currentTrack"]
  currentIndex: number
  queueLength: number
  hasNext: boolean
  hasPrevious: boolean
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`
}

export const $playerState = {
  get: (): PlayerState => {
    const { currentTrack, isPlaying, currentTime, duration } =
      usePlayerStore.getState()

    return {
      track: currentTrack,
      isPlaying,
      currentTime,
      duration,
      progressPercent: duration > 0 ? (currentTime / duration) * 100 : 0,
      formattedCurrentTime: formatTime(currentTime),
      formattedDuration: formatTime(duration),
    }
  },
}

export const $queueState = {
  get: (): QueueState => {
    const { tracks, currentTrack } = usePlayerStore.getState()
    const currentIndex = currentTrack
      ? tracks.findIndex((track) => track.id === currentTrack.id)
      : -1

    return {
      tracks,
      currentTrack,
      currentIndex,
      queueLength: tracks.length,
      hasNext: currentIndex < tracks.length - 1,
      hasPrevious: currentIndex > 0,
    }
  },
}

export const $playerColors = {
  get: (): { colors: ColorPalette; isLoading: boolean } => {
    const { currentColors, isLoadingColors } = usePlayerColorsStore.getState()

    return {
      colors: currentColors,
      isLoading: isLoadingColors,
    }
  },
}

export const $orderedQueue = {
  get: () => {
    const { tracks, currentTrack } = usePlayerStore.getState()

    if (!currentTrack || tracks.length === 0) {
      return []
    }

    const currentIndex = tracks.findIndex(
      (track) => track.id === currentTrack.id
    )
    if (currentIndex === -1) {
      return tracks
    }

    return [...tracks.slice(currentIndex), ...tracks.slice(0, currentIndex)]
  },
}
