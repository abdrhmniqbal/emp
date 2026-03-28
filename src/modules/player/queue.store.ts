import { useMemo } from "react"

import {
  usePlayerStore,
  type Track,
} from "./player.store"

function buildQueueInfo(queue: Track[], currentTrack: Track | null) {
  const currentIndex = currentTrack
    ? queue.findIndex((track) => track.id === currentTrack.id)
    : -1

  return {
    queue,
    currentIndex,
    length: queue.length,
    upNext: currentIndex >= 0 ? queue.slice(currentIndex + 1) : queue,
    hasNext: currentIndex < queue.length - 1,
    hasPrevious: currentIndex > 0,
  }
}

export function useQueueInfo() {
  const queue = usePlayerStore((state) => state.queue)
  const currentTrack = usePlayerStore((state) => state.currentTrack)

  return useMemo(
    () => buildQueueInfo(queue, currentTrack),
    [currentTrack, queue]
  )
}

export function setQueue(tracks: Track[]) {
  usePlayerStore.setState({ queue: tracks })
}
