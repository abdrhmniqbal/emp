import { useStore } from "@nanostores/react"
import { useLocalSearchParams } from "expo-router"

import { useIsFavorite } from "@/modules/favorites/favorites.queries"
import {
  ALBUM_TRACK_SORT_OPTIONS,
  $sortConfig,
  setSortConfig,
  sortTracks,
  type AlbumTrackSortField,
} from "@/modules/library/library-sort.store"
import { useTracksByAlbumName } from "@/modules/library/library.queries"
import { $tracks, playTrack, type Track } from "@/modules/player/player.store"

import { formatAlbumDuration, groupTracksByDisc } from "../albums.utils"

function getRandomIndex(max: number) {
  return Math.floor(Math.random() * max)
}

function getSafeRouteName(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? (value[0] ?? "") : (value ?? "")
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export function useAlbumDetailsScreen() {
  const { name } = useLocalSearchParams<{ name: string }>()
  const allSortConfigs = useStore($sortConfig)
  const allTracks = useStore($tracks)

  const albumName = getSafeRouteName(name)
  const normalizedAlbumName = albumName.trim().toLowerCase()
  const {
    data: albumTracksFromQuery = [],
    isLoading: isAlbumTracksLoading,
    isFetching: isAlbumTracksFetching,
  } = useTracksByAlbumName(albumName)
  const albumTracks =
    albumTracksFromQuery.length > 0
      ? albumTracksFromQuery
      : allTracks.filter(
          (track) =>
            (track.album || "").trim().toLowerCase() === normalizedAlbumName
        )

  const albumInfo = (() => {
    if (albumTracks.length === 0) {
      return null
    }

    const firstTrack = albumTracks[0]
    return {
      title: firstTrack.album || "Unknown Album",
      artist: firstTrack.albumArtist || firstTrack.artist || "Unknown Artist",
      image: firstTrack.image,
      year: firstTrack.year,
    }
  })()

  const totalDuration = albumTracks.reduce(
    (sum, track) => sum + (track.duration || 0),
    0
  )
  const sortConfig = allSortConfigs.AlbumTracks || {
    field: "trackNumber" as AlbumTrackSortField,
    order: "asc" as const,
  }

  const sortedTracks = sortTracks(albumTracks, sortConfig)

  const tracksByDisc = groupTracksByDisc(sortedTracks)
  const albumId = albumTracks[0]?.albumId
  const { data: isAlbumFavorite = false } = useIsFavorite("album", albumId || "")
  const isLoading =
    (isAlbumTracksLoading || isAlbumTracksFetching) && albumTracks.length === 0

  function playSelectedTrack(track: Track) {
    playTrack(track, sortedTracks)
  }

  function playAllTracks() {
    if (sortedTracks.length > 0) {
      playTrack(sortedTracks[0], sortedTracks)
    }
  }

  function shuffleTracks() {
    if (sortedTracks.length > 0) {
      const randomIndex = getRandomIndex(sortedTracks.length)
      playTrack(sortedTracks[randomIndex], sortedTracks)
    }
  }

  function selectSort(field: AlbumTrackSortField, order?: "asc" | "desc") {
    setSortConfig("AlbumTracks", field, order)
  }

  function getSortLabel() {
    const option = ALBUM_TRACK_SORT_OPTIONS.find(
      (item) => item.field === sortConfig.field
    )
    return option?.label || "Sort"
  }

  return {
    albumInfo,
    isLoading,
    albumId,
    isAlbumFavorite,
    tracksByDisc,
    sortedTracks,
    sortConfig,
    totalDurationLabel: formatAlbumDuration(totalDuration),
    playSelectedTrack,
    playAllTracks,
    shuffleTracks,
    selectSort,
    getSortLabel,
  }
}
