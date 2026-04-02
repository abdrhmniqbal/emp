import { queryClient } from "@/lib/tanstack-query"
import { invalidateFavoriteQueries } from "@/modules/favorites/favorites.keys"
import { setTrackFavoriteFlag } from "@/modules/favorites/favorites.repository"

import { setActiveTrack } from "./player-runtime-state"
import {
  getCurrentTrackState,
  getTracksState,
  setTracksState,
} from "./player.store"

export function toggleFavorite(trackId: string) {
  const tracks = getTracksState()
  const index = tracks.findIndex((track) => track.id === trackId)
  if (index === -1) {
    return
  }

  const track = tracks[index]
  if (!track) {
    return
  }

  const newStatus = !track.isFavorite
  const nextTracks = [...tracks]
  nextTracks[index] = { ...track, isFavorite: newStatus }
  setTracksState(nextTracks)

  const currentTrack = getCurrentTrackState()
  if (currentTrack?.id === trackId) {
    setActiveTrack({ ...currentTrack, isFavorite: newStatus })
  }

  void setTrackFavoriteFlag(trackId, newStatus).then(async () => {
    await invalidateFavoriteQueries(queryClient)
  })
}
