import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControlProps,
} from "react-native"
import * as React from "react"

import { type Artist, ArtistGrid } from "@/components/blocks/artist-grid"
import { LibraryTabState } from "@/components/blocks/library-tab-state"
import LocalUserSolidIcon from "@/components/icons/local/user-solid"
import type { SortConfig } from "@/modules/library/library-sort.types"
import { sortArtists } from "@/modules/library/library-sort.utils"
import { useThemeColors } from "@/modules/ui/theme"
import { useArtists } from "@/modules/library/library.queries"

type ArtistOrderByField = Parameters<typeof useArtists>[0]
type ArtistOrder = Parameters<typeof useArtists>[1]

function getArtistOrderByField(field: SortConfig["field"]): ArtistOrderByField {
  switch (field) {
    case "trackCount":
    case "dateAdded":
    case "name":
      return field
    default:
      return "name"
  }
}

interface ArtistsTabProps {
  onArtistPress?: (artist: Artist) => void
  sortConfig?: SortConfig
  contentBottomPadding?: number
  refreshControl?: React.ReactElement<RefreshControlProps> | null
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollBeginDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
}

export const ArtistsTab: React.FC<ArtistsTabProps> = ({
  onArtistPress,
  sortConfig,
  contentBottomPadding = 0,
  refreshControl,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollEnd,
}) => {
  const theme = useThemeColors()
  const effectiveSortConfig = React.useMemo<SortConfig>(
    () =>
      sortConfig ?? {
        field: "name",
        order: "asc",
      },
    [sortConfig]
  )
  const orderByField = getArtistOrderByField(effectiveSortConfig.field)
  const order: ArtistOrder = effectiveSortConfig.order

  const {
    data: artistsData,
    isLoading,
    isPending,
  } = useArtists(orderByField, order)

  const artists = React.useMemo<Artist[]>(
    () =>
      (artistsData || []).map((artist) => ({
        id: artist.id,
        name: artist.name,
        trackCount: artist.trackCount || 0,
        image:
          artist.artwork ||
          artist.trackArtwork ||
          artist.albumArtwork ||
          undefined,
        dateAdded: 0,
      })),
    [artistsData]
  )
  const sortedArtists = React.useMemo(
    () => sortArtists(artists, effectiveSortConfig) as Artist[],
    [artists, effectiveSortConfig]
  )

  const handleArtistPress = React.useCallback(
    (artist: Artist) => {
      onArtistPress?.(artist)
    },
    [onArtistPress]
  )

  return (
    <LibraryTabState
      isLoading={isLoading || isPending}
      hasData={artists.length > 0}
      skeletonType="artists"
      emptyIcon={
        <LocalUserSolidIcon
          fill="none"
          width={48}
          height={48}
          color={theme.muted}
        />
      }
      emptyTitle="No Artists"
      emptyMessage="Artists from your music library will appear here."
    >
      <ArtistGrid
        data={sortedArtists}
        onArtistPress={handleArtistPress}
        contentContainerStyle={{ paddingBottom: contentBottomPadding }}
        resetScrollKey={`${effectiveSortConfig.field}-${effectiveSortConfig.order}`}
        refreshControl={refreshControl}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
      />
    </LibraryTabState>
  )
}
