import { queryClient } from "@/lib/tanstack-query"
import { invalidatePlayerQueries, optimisticallyUpdateRecentlyPlayedQueries } from "@/modules/player/player.keys"
import type { Track } from "@/modules/player/player.types"
import { addTrackToHistory, incrementTrackPlayCount } from "@/modules/history/history.repository"

import {
  getPlaybackRefreshVersionState,
  setPlaybackRefreshVersionState,
} from "./player.store"

function bumpPlaybackRefreshVersion() {
  setPlaybackRefreshVersionState(getPlaybackRefreshVersionState() + 1)
}

export async function handleTrackActivated(track: Track) {
  optimisticallyUpdateRecentlyPlayedQueries(queryClient, track)
  await Promise.allSettled([
    addTrackToHistory(track.id),
    incrementTrackPlayCount(track.id),
  ])
  bumpPlaybackRefreshVersion()
  void invalidatePlayerQueries(queryClient)
}
