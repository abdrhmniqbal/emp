import type { Track } from "@/modules/player/player.types"

import type { SortConfig, SortOrder } from "@/modules/library/library-sort.types"

function compareValues(a: any, b: any, order: SortOrder) {
  if (a === b) return 0
  if (a === undefined || a === null) return 1
  if (b === undefined || b === null) return -1

  if (typeof a === "string" && typeof b === "string") {
    return order === "asc"
      ? a.localeCompare(b, undefined, { sensitivity: "base" })
      : b.localeCompare(a, undefined, { sensitivity: "base" })
  }

  if (a < b) return order === "asc" ? -1 : 1
  if (a > b) return order === "asc" ? 1 : -1
  return 0
}

export function sortTracks(tracks: Track[], config: SortConfig): Track[] {
  const { field, order } = config
  return [...tracks].sort((a, b) => {
    if (field === "trackNumber") {
      const discCompare = compareValues(
        a.discNumber || 1,
        b.discNumber || 1,
        order
      )
      if (discCompare !== 0) {
        return discCompare
      }

      const trackCompare = compareValues(
        a.trackNumber || 0,
        b.trackNumber || 0,
        order
      )
      if (trackCompare !== 0) {
        return trackCompare
      }

      const titleA = (a.title || a.filename || "").toLowerCase()
      const titleB = (b.title || b.filename || "").toLowerCase()
      return compareValues(titleA, titleB, order)
    }

    let aVal: any = a[field as keyof Track]
    let bVal: any = b[field as keyof Track]

    if (field === "filename") {
      aVal = a.filename || a.uri.split("/").pop()
      bVal = b.filename || b.uri.split("/").pop()
    } else if (field === "title") {
      aVal = (a.title || a.filename || "").toLowerCase()
      bVal = (b.title || b.filename || "").toLowerCase()
    } else if (field === "artist") {
      aVal = (a.artist || "Unknown Artist").toLowerCase()
      bVal = (b.artist || "Unknown Artist").toLowerCase()
    } else if (field === "album") {
      aVal = (a.album || "Unknown Album").toLowerCase()
      bVal = (b.album || "Unknown Album").toLowerCase()
    }

    const primaryResult = compareValues(aVal, bVal, order)
    if (field === "playCount" && primaryResult === 0) {
      return compareValues(a.lastPlayedAt || 0, b.lastPlayedAt || 0, "desc")
    }

    return primaryResult
  })
}

export function sortAlbums(albums: any[], config: SortConfig): any[] {
  const { field, order } = config
  return [...albums].sort((a, b) => {
    const aVal = field in a ? a[field] : undefined
    const bVal = field in b ? b[field] : undefined

    if (field === "title" || field === "artist") {
      return compareValues(
        (aVal || "").toString().toLowerCase(),
        (bVal || "").toString().toLowerCase(),
        order
      )
    }

    return compareValues(aVal, bVal, order)
  })
}

export function sortArtists(artists: any[], config: SortConfig): any[] {
  const { field, order } = config
  return [...artists].sort((a, b) => {
    const aVal = field in a ? a[field] : undefined
    const bVal = field in b ? b[field] : undefined

    if (field === "name") {
      return compareValues(
        (aVal || "").toString().toLowerCase(),
        (bVal || "").toString().toLowerCase(),
        order
      )
    }

    return compareValues(aVal, bVal, order)
  })
}

export function sortGeneric(items: any[], config: SortConfig): any[] {
  return sortAlbums(items, config)
}

export function sortGenres(genres: any[], config: SortConfig): any[] {
  return sortArtists(genres, config)
}
