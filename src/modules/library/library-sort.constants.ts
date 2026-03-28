import type {
  AlbumSortField,
  AlbumTrackSortField,
  ArtistSortField,
  FolderSortField,
  PlaylistSortField,
  SortConfig,
  TabName,
  TrackSortField,
} from "@/modules/library/library-sort.types"

export const DEFAULT_SORT_CONFIG: Record<TabName, SortConfig> = {
  Tracks: { field: "title", order: "asc" },
  Albums: { field: "title", order: "asc" },
  Artists: { field: "name", order: "asc" },
  Genres: { field: "name", order: "asc" },
  Playlists: { field: "name", order: "asc" },
  Folders: { field: "name", order: "asc" },
  Favorites: { field: "dateAdded", order: "desc" },
  ArtistTracks: { field: "playCount", order: "desc" },
  ArtistAlbums: { field: "year", order: "desc" },
  AlbumTracks: { field: "trackNumber", order: "asc" },
}

export const TRACK_SORT_OPTIONS: { label: string; field: TrackSortField }[] = [
  { label: "Title", field: "title" },
  { label: "Artist", field: "artist" },
  { label: "Album", field: "album" },
  { label: "Year", field: "year" },
  { label: "Play Count", field: "playCount" },
  { label: "Date Added", field: "dateAdded" },
  { label: "Filename", field: "filename" },
]

export const ALBUM_TRACK_SORT_OPTIONS: {
  label: string
  field: AlbumTrackSortField
}[] = [
  { label: "Track Number", field: "trackNumber" },
  { label: "Title", field: "title" },
  { label: "Artist", field: "artist" },
  { label: "Year", field: "year" },
  { label: "Play Count", field: "playCount" },
  { label: "Date Added", field: "dateAdded" },
  { label: "Filename", field: "filename" },
]

export const ALBUM_SORT_OPTIONS: { label: string; field: AlbumSortField }[] = [
  { label: "Title", field: "title" },
  { label: "Artist", field: "artist" },
  { label: "Year", field: "year" },
  { label: "Date Added", field: "dateAdded" },
  { label: "Number of Tracks", field: "trackCount" },
]

export const ARTIST_SORT_OPTIONS: { label: string; field: ArtistSortField }[] =
  [
    { label: "Name", field: "name" },
    { label: "Date Added", field: "dateAdded" },
    { label: "Number of Tracks", field: "trackCount" },
  ]

export const PLAYLIST_SORT_OPTIONS: {
  label: string
  field: PlaylistSortField
}[] = [
  { label: "Name", field: "name" },
  { label: "Date Added", field: "dateAdded" },
  { label: "Number of Tracks", field: "trackCount" },
]

export const FOLDER_SORT_OPTIONS: { label: string; field: FolderSortField }[] =
  [
    { label: "Name", field: "name" },
    { label: "Date Added", field: "dateAdded" },
    { label: "Number of Files", field: "trackCount" },
  ]

export const GENRE_SORT_OPTIONS: { label: string; field: ArtistSortField }[] = [
  { label: "Name", field: "name" },
  { label: "Number of Tracks", field: "trackCount" },
]
