/**
 * Purpose: Controls when playback activity should be recorded in history and play count metrics.
 * Caller: player-events.service activation/progress handlers.
 * Dependencies: history cache service, history repository writes, player store current-track state.
 * Main Functions: handleTrackActivated(), handleTrackProgress()
 * Side Effects: Writes to play history and play count after threshold playback; invalidates history-related queries.
 */

import { queryClient } from "@/lib/tanstack-query"
import type { Track } from "@/modules/player/player.types"
import {
  invalidateHistoryAfterPlayback,
  optimisticallyUpdateRecentlyPlayedHistory,
} from "@/modules/history/history-cache.service"
import { addTrackToHistory, incrementTrackPlayCount } from "@/modules/history/history.repository"

import {
  getCurrentTrackState,
  getPlaybackRefreshVersionState,
  setPlaybackRefreshVersionState,
} from "./player.store"

const MINIMUM_PLAYED_RATIO_FOR_COUNT = 0.05

let pendingTrackId: string | null = null
let hasRecordedPendingTrack = false

function bumpPlaybackRefreshVersion() {
  setPlaybackRefreshVersionState(getPlaybackRefreshVersionState() + 1)
}

async function recordQualifiedTrackPlayback(track: Track) {
  optimisticallyUpdateRecentlyPlayedHistory(queryClient, track)
  await Promise.allSettled([
    addTrackToHistory(track.id),
    incrementTrackPlayCount(track.id),
  ])
  bumpPlaybackRefreshVersion()
  void invalidateHistoryAfterPlayback(queryClient)
}

export function handleTrackActivated(track: Track) {
  pendingTrackId = track.id
  hasRecordedPendingTrack = false
}

export function handleTrackProgress(positionSeconds: number, durationSeconds: number) {
  if (!pendingTrackId || hasRecordedPendingTrack) {
    return
  }

  const currentTrack = getCurrentTrackState()
  if (!currentTrack || currentTrack.id !== pendingTrackId) {
    return
  }

  const resolvedDuration = Math.max(durationSeconds, currentTrack.duration || 0)
  if (!Number.isFinite(resolvedDuration) || resolvedDuration <= 0) {
    return
  }

  const minimumPlayedSeconds = resolvedDuration * MINIMUM_PLAYED_RATIO_FOR_COUNT
  if (positionSeconds < minimumPlayedSeconds) {
    return
  }

  hasRecordedPendingTrack = true
  void recordQualifiedTrackPlayback(currentTrack)
}
