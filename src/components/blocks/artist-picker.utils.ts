/**
 * Purpose: Builds reusable artist picker sheet items from resolved track artist data.
 * Caller: Track action sheet and player route.
 * Dependencies: Shared artist picker item types and artist artwork resolver.
 * Main Functions: buildArtistPickerItems()
 * Side Effects: None.
 */

import { resolveArtistArtwork } from "@/modules/artists/artist-artwork"

import type { ArtistPickerSheetItem } from "./artist-picker-sheet"

interface PickerArtistSource {
  name?: string | null
  artwork?: string | null
  trackCount?: number | null
}

interface PickerSource {
  artwork?: string | null
  albumArtwork?: string | null
  artist?: PickerArtistSource | null
  featuredArtists?: Array<{ artist?: PickerArtistSource | null }>
}

function dedupeArtistPickerItems(items: ArtistPickerSheetItem[]) {
  const seen = new Set<string>()

  return items.filter((item) => {
    const key = item.value.trim().toLowerCase()
    if (!key || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export function buildArtistPickerItems(
  source: PickerSource,
  fallbackNames: string[],
  translateTrackCount: (count: number) => string
) {
  const items: ArtistPickerSheetItem[] = []

  if (source.artist?.name?.trim()) {
    items.push({
      value: source.artist.name.trim(),
      subtitle: translateTrackCount(source.artist.trackCount || 0),
      image: resolveArtistArtwork(
        source.artwork,
        source.artist.artwork,
        source.albumArtwork
      ),
    })
  }

  for (const entry of source.featuredArtists ?? []) {
    if (!entry.artist?.name?.trim()) {
      continue
    }

    items.push({
      value: entry.artist.name.trim(),
      subtitle: translateTrackCount(entry.artist.trackCount || 0),
      image: resolveArtistArtwork(
        source.artwork,
        entry.artist.artwork,
        source.albumArtwork
      ),
    })
  }

  const richItems = dedupeArtistPickerItems(items)
  if (richItems.length > 0) {
    return richItems
  }

  return dedupeArtistPickerItems(
    fallbackNames
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .map((value) => ({ value }))
  )
}