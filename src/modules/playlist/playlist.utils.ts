import type { Track } from "@/modules/player/player.types"

export const MAX_PLAYLIST_NAME_LENGTH = 20
export const MAX_PLAYLIST_DESCRIPTION_LENGTH = 40

export function toggleTrackSelection(
  current: Set<string>,
  trackId: string
): Set<string> {
  const next = new Set(current)

  if (next.has(trackId)) {
    next.delete(trackId)
  } else {
    next.add(trackId)
  }

  return next
}

export function clampPlaylistName(value: string): string {
  return value.slice(0, MAX_PLAYLIST_NAME_LENGTH)
}

export function clampPlaylistDescription(value: string): string {
  return value.slice(0, MAX_PLAYLIST_DESCRIPTION_LENGTH)
}

interface PlaylistTrackRelation {
  track: PlaylistTrackRecord
}

interface PlaylistTrackArtist {
  name?: string | null
}

interface PlaylistTrackAlbum {
  title?: string | null
  artwork?: string | null
}

interface PlaylistTrackRecord {
  [key: string]: unknown
  id: string
  title: string
  duration: number
  uri: string
  artist?: string | PlaylistTrackArtist | null
  album?: string | PlaylistTrackAlbum | null
  artwork?: string | null
  image?: string | null
  lyrics?: string | null
}

interface PlaylistEntity {
  artwork?: string | null
  tracks?: PlaylistTrackRelation[]
}

export function buildPlaylistTracks(playlist?: PlaylistEntity | null): Track[] {
  return (playlist?.tracks || []).map((playlistTrack) => {
    const track = playlistTrack.track
    const artist =
      typeof track.artist === "object" && track.artist
        ? track.artist.name
        : track.artist
    const album =
      typeof track.album === "object" && track.album
        ? track.album.title
        : track.album
    const image =
      track.image ||
      track.artwork ||
      (typeof track.album === "object" && track.album
        ? track.album.artwork || undefined
        : undefined)

    return {
      ...track,
      artist: artist ?? undefined,
      album: album ?? undefined,
      image,
      lyrics: typeof track.lyrics === "string" ? track.lyrics : undefined,
    }
  })
}

export function buildPlaylistImages(
  playlist: PlaylistEntity | null | undefined,
  tracks: Track[]
): string[] {
  const images = new Set<string>()

  if (playlist?.artwork) {
    images.add(playlist.artwork)
  }

  for (const track of tracks) {
    if (track.image) {
      images.add(track.image)
    }

    if (images.size >= 4) {
      break
    }
  }

  return Array.from(images)
}

export function getPlaylistDuration(tracks: Track[]): number {
  return tracks.reduce((sum, track) => sum + (track.duration || 0), 0)
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }

  return `${minutes}m ${seconds}s`
}
