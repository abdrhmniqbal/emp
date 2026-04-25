/**
 * Purpose: Renders search result rows for artists, albums, playlists, and tracks.
 * Caller: Search results lists.
 * Dependencies: media item primitives, playlist artwork, player service, theme colors.
 * Main Functions: MemoizedSearchResultRow
 * Side Effects: Starts playback for track results and triggers route handlers passed from parents.
 */

import type {
  SearchAlbumResult,
  SearchArtistResult,
  SearchPlaylistResult,
} from "@/modules/library/library.types"
import type { Track } from "@/modules/player/player.store"
import * as React from "react"
import { Text } from "react-native"

import LocalCheckmarkCircleSolidIcon from "@/components/icons/local/checkmark-circle-solid"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import LocalUserSolidIcon from "@/components/icons/local/user-solid"
import LocalVynilSolidIcon from "@/components/icons/local/vynil-solid"
import {
  PlaylistArtwork,
  resolvePlaylistArtworkImages,
} from "@/components/patterns/playlist-artwork"
import {
  MediaItem as Item,
  MediaItemAction as ItemAction,
  MediaItemContent as ItemContent,
  MediaItemDescription as ItemDescription,
  MediaItemImage as ItemImage,
  MediaItemTitle as ItemTitle,
} from "@/components/ui/media-item"
import { ICON_SIZES } from "@/constants/icon-sizes"
import { playTrack } from "@/modules/player/player.service"
import { useThemeColors } from "@/modules/ui/theme"

export type SearchResultEntityItem =
  | { id: string; type: "artist"; artist: SearchArtistResult }
  | { id: string; type: "album"; album: SearchAlbumResult }
  | { id: string; type: "playlist"; playlist: SearchPlaylistResult }
  | { id: string; type: "track"; track: Track }

interface SearchResultRowProps {
  item: SearchResultEntityItem
  onArtistPress?: (artist: SearchArtistResult) => void
  onAlbumPress?: (album: SearchAlbumResult) => void
  onPlaylistPress?: (playlist: SearchPlaylistResult) => void
  onTrackPress?: (track: Track) => void
}

function SearchResultRow({
  item,
  onArtistPress,
  onAlbumPress,
  onPlaylistPress,
  onTrackPress,
}: SearchResultRowProps) {
  const theme = useThemeColors()

  if (item.type === "artist") {
    return (
      <Item
        variant="list"
        className="py-1"
        onPress={() => onArtistPress?.(item.artist)}
      >
        <ItemImage
          icon={
            <LocalUserSolidIcon
              fill="none"
              width={ICON_SIZES.listFallback}
              height={ICON_SIZES.listFallback}
              color={theme.muted}
            />
          }
          image={item.artist.image}
          className="h-14 w-14 rounded-full bg-default"
        />
        <ItemContent>
          <ItemTitle className="text-lg">{item.artist.name}</ItemTitle>
          <Text className="text-xs text-muted">{item.artist.type}</Text>
        </ItemContent>
      </Item>
    )
  }

  if (item.type === "album") {
    return (
      <Item onPress={() => onAlbumPress?.(item.album)}>
        <ItemImage
          icon={
            <LocalVynilSolidIcon
              fill="none"
              width={ICON_SIZES.listFallback}
              height={ICON_SIZES.listFallback}
              color={theme.muted}
            />
          }
          image={item.album.image}
          className="rounded-md"
        />
        <ItemContent>
          <ItemTitle>{item.album.title || "Unknown Album"}</ItemTitle>
          <ItemDescription>
            {item.album.artist || "Unknown Artist"}
          </ItemDescription>
        </ItemContent>
        {item.album.isVerified && (
          <ItemAction>
            <LocalCheckmarkCircleSolidIcon
              fill="none"
              width={20}
              height={20}
              color={theme.accent}
            />
          </ItemAction>
        )}
      </Item>
    )
  }

  if (item.type === "playlist") {
    return (
      <Item onPress={() => onPlaylistPress?.(item.playlist)}>
        <ItemImage className="items-center justify-center overflow-hidden bg-default">
          <PlaylistArtwork
            images={resolvePlaylistArtworkImages(
              item.playlist.images,
              item.playlist.image
            )}
          />
        </ItemImage>
        <ItemContent>
          <ItemTitle>{item.playlist.title}</ItemTitle>
          <ItemDescription>
            {item.playlist.trackCount} {item.playlist.trackCount === 1 ? "track" : "tracks"}
          </ItemDescription>
        </ItemContent>
      </Item>
    )
  }

  return (
    <Item
      onPress={() => {
        onTrackPress?.(item.track)
        playTrack(item.track)
      }}
    >
      <ItemImage
        icon={
          <LocalMusicNoteSolidIcon
            fill="none"
            width={ICON_SIZES.listFallback}
            height={ICON_SIZES.listFallback}
            color={theme.muted}
          />
        }
        image={item.track.image}
        className="rounded-md"
      />
      <ItemContent>
        <ItemTitle>{item.track.title}</ItemTitle>
        <ItemDescription>{item.track.artist || "Unknown Artist"}</ItemDescription>
      </ItemContent>
    </Item>
  )
}

export const MemoizedSearchResultRow = React.memo(SearchResultRow)
