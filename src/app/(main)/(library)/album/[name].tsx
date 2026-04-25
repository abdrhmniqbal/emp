/**
 * Purpose: Renders album details, album actions, and the album track list.
 * Caller: Album detail route in the library, search, and genre flows.
 * Dependencies: album queries, favorites mutations, player service, sorting state, theme colors.
 * Main Functions: AlbumDetailsScreen()
 * Side Effects: Updates favorites, starts playback, and updates shared scroll state.
 */

import type { AlbumTrackSortField } from "@/modules/library/library-sort.types"
import type { Track } from "@/modules/player/player.store"
import { Image } from "expo-image"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Button } from "heroui-native"
import * as React from "react"
import { useState } from "react"

import { Text, View } from "react-native"
import Animated from "react-native-reanimated"
import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { SortSheet } from "@/components/blocks/sort-sheet"
import { TrackList } from "@/components/blocks/track-list"
import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import LocalVynilSolidIcon from "@/components/icons/local/vynil-solid"
import { BackButton } from "@/components/patterns/back-button"
import { EmptyState } from "@/components/ui/empty-state"
import { screenEnterTransition } from "@/constants/animations"
import {
  DETAIL_HEADER_BOTTOM_SPACING,
  SCREEN_SECTION_HEADING_GAP,
  SCREEN_SECTION_TOP_SPACING,
} from "@/constants/layout"
import { Stack } from "@/layouts/stack"
import { formatAlbumDuration } from "@/modules/albums/albums.utils"
import { useToggleFavorite } from "@/modules/favorites/favorites.mutations"
import { useIsFavorite } from "@/modules/favorites/favorites.queries"
import {
  ALBUM_TRACK_SORT_OPTIONS,
} from "@/modules/library/library-sort.constants"
import {
  setSortConfig,
  useLibrarySortStore,
} from "@/modules/library/library-sort.store"
import { sortTracks } from "@/modules/library/library-sort.utils"
import { useTracksByAlbumName } from "@/modules/library/library.queries"
import { logWarn } from "@/modules/logging/logging.service"
import { usePlayerTracks } from "@/modules/player/player-selectors"
import { playTrack } from "@/modules/player/player.service"
import { useThemeColors } from "@/modules/ui/theme"
import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/modules/ui/ui.store"
import { mergeText } from "@/utils/merge-text"

const HEADER_COLLAPSE_THRESHOLD = 120

function getRandomIndex(max: number) {
  return Math.floor(Math.random() * max)
}

function getSafeRouteName(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? (value[0] ?? "") : (value ?? "")
  try {
    return {
      value: decodeURIComponent(raw),
      raw,
      decodeFailed: false,
    }
  } catch {
    return {
      value: raw,
      raw,
      decodeFailed: true,
    }
  }
}

export default function AlbumDetailsScreen() {
  const theme = useThemeColors()
  const router = useRouter()
  const { name } = useLocalSearchParams<{ name: string }>()
  const toggleFavoriteMutation = useToggleFavorite()
  const [sortModalVisible, setSortModalVisible] = useState(false)
  const [showHeaderTitle, setShowHeaderTitle] = useState(false)
  const allSortConfigs = useLibrarySortStore((state) => state.sortConfig)
  const allTracks = usePlayerTracks()
  const parsedAlbumRouteName = React.useMemo(() => getSafeRouteName(name), [name])
  const albumName = parsedAlbumRouteName.value

  React.useEffect(() => {
    if (!albumName.trim()) {
      logWarn("Album details route missing name param", {
        route: "/album/[name]",
      })
      return
    }

    if (parsedAlbumRouteName.decodeFailed) {
      logWarn("Album details route name decode failed", {
        route: "/album/[name]",
        rawName: parsedAlbumRouteName.raw,
      })
    }
  }, [albumName, parsedAlbumRouteName.decodeFailed, parsedAlbumRouteName.raw])

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
  const albumInfo =
    albumTracks.length > 0
      ? {
          title: albumTracks[0].album || "Unknown Album",
          artist:
            albumTracks[0].albumArtist ||
            albumTracks[0].artist ||
            "Unknown Artist",
          image: albumTracks[0].albumArtwork || albumTracks[0].image,
          year: albumTracks[0].year,
        }
      : null
  const totalDuration = albumTracks.reduce(
    (sum, track) => sum + (track.duration || 0),
    0
  )
  const sortConfig = allSortConfigs.AlbumTracks || {
    field: "trackNumber" as AlbumTrackSortField,
    order: "asc" as const,
  }
  const sortedTracks = sortTracks(albumTracks, sortConfig)
  const albumId = albumTracks[0]?.albumId
  const { data: isAlbumFavorite = false } = useIsFavorite(
    "album",
    albumId || ""
  )
  const isLoading =
    (isAlbumTracksLoading || isAlbumTracksFetching) && albumTracks.length === 0
  const totalDurationLabel = formatAlbumDuration(totalDuration)
  const hasMultipleDiscs =
    new Set(sortedTracks.map((track) => track.discNumber || 1)).size > 1

  function handleSortSelect(
    field: AlbumTrackSortField,
    order?: "asc" | "desc"
  ) {
    setSortConfig("AlbumTracks", field, order)
  }

  function handleBack() {
    router.back()
  }

  if (!albumInfo) {
    if (isLoading) {
      return <View className="flex-1 bg-background" />
    }

    return (
      <EmptyState
        icon={
          <LocalVynilSolidIcon
            fill="none"
            width={48}
            height={48}
            color={theme.muted}
          />
        }
        title="No albums found"
        message="No albums found"
        className="mt-12"
      />
    )
  }

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
      playTrack(sortedTracks[getRandomIndex(sortedTracks.length)], sortedTracks)
    }
  }

  function getSortLabel() {
    const option = ALBUM_TRACK_SORT_OPTIONS.find(
      (item) => item.field === sortConfig.field
    )
    return option?.label || "Sort"
  }

  return (
    <SortSheet
      visible={sortModalVisible}
      onOpenChange={setSortModalVisible}
      currentField={sortConfig.field}
      currentOrder={sortConfig.order}
      onSelect={handleSortSelect}
    >
      <View className="flex-1 bg-background">
        <Stack.Screen
          options={{
            title: showHeaderTitle ? albumInfo.title : "",
            headerBackVisible: false,
            headerLeft: () => (
              <BackButton className="-ml-2" onPress={handleBack} />
            ),
            headerRight: () =>
              albumId && (
                <Button
                  onPress={() => {
                    if (!albumId) {
                      return
                    }

                    void toggleFavoriteMutation.mutateAsync({
                      type: "album",
                      itemId: albumId,
                      isCurrentlyFavorite: isAlbumFavorite,
                      name: albumInfo.title,
                      subtitle: albumInfo.artist,
                      image: albumInfo.image,
                    })
                  }}
                  isDisabled={toggleFavoriteMutation.isPending}
                  variant="ghost"
                  className="-mr-2"
                  isIconOnly
                >
                  {isAlbumFavorite ? (
                    <LocalFavouriteSolidIcon
                      fill="none"
                      width={24}
                      height={24}
                      color="#ef4444"
                    />
                  ) : (
                    <LocalFavouriteIcon
                      fill="none"
                      width={24}
                      height={24}
                      color={theme.foreground}
                    />
                  )}
                </Button>
              ),
          }}
        />
        <TrackList
          data={sortedTracks}
          showNumbers
          hideCover
          hideArtist
          getNumber={(track, index) => track.trackNumber || index + 1}
          renderItemPrefix={(track, index, tracks) => {
            if (sortConfig.field !== "trackNumber" || !hasMultipleDiscs) {
              return null
            }

            const currentDisc = track.discNumber || 1
            const previousDisc = tracks[index - 1]?.discNumber || 1
            const shouldShowDiscSeparator =
              index === 0 || currentDisc !== previousDisc

            if (!shouldShowDiscSeparator) {
              return null
            }

            return (
              <View className="pt-3 pb-1">
                <Text className="text-xs font-semibold tracking-wide text-muted uppercase">
                  Disc {currentDisc}
                </Text>
              </View>
            )
          }}
          onTrackPress={playSelectedTrack}
          resetScrollKey={`${albumId || albumInfo.title}-${sortConfig.field}-${sortConfig.order}`}
          contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: 16 }}
          onScroll={(event) => {
            const y = event.nativeEvent.contentOffset.y
            handleScroll(y)
            const nextShowHeaderTitle = y > HEADER_COLLAPSE_THRESHOLD
            if (nextShowHeaderTitle !== showHeaderTitle) {
              setShowHeaderTitle(nextShowHeaderTitle)
            }
          }}
          onScrollBeginDrag={handleScrollStart}
          onMomentumScrollEnd={handleScrollStop}
          onScrollEndDrag={handleScrollStop}
          listHeader={
            <>
              <View
                style={{
                  paddingTop: SCREEN_SECTION_TOP_SPACING,
                  paddingBottom: DETAIL_HEADER_BOTTOM_SPACING,
                }}
              >
                <View className="flex-row gap-4">
                  <View className="h-36 w-36 overflow-hidden rounded-lg bg-surface-secondary">
                    {albumInfo.image ? (
                      <Image
                        source={{ uri: albumInfo.image }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="h-full w-full items-center justify-center">
                        <LocalVynilSolidIcon
                          fill="none"
                          width={48}
                          height={48}
                          color={theme.muted}
                        />
                      </View>
                    )}
                  </View>

                  <View className="flex-1 justify-center">
                    <Text
                      className="text-xl font-bold text-foreground"
                      numberOfLines={1}
                    >
                      {albumInfo.title}
                    </Text>
                    <Text className="mt-1 text-sm text-muted" numberOfLines={1}>
                      {albumInfo.artist}
                    </Text>
                    <Text className="mt-2 text-sm text-muted">
                      {mergeText([albumInfo?.year, totalDurationLabel])}
                    </Text>
                  </View>
                </View>
              </View>

              <Animated.View entering={screenEnterTransition()}>
                <PlaybackActionsRow
                  onPlay={playAllTracks}
                  onShuffle={shuffleTracks}
                />
              </Animated.View>

              <View
                className="flex-row items-center justify-between"
                style={{ marginBottom: SCREEN_SECTION_HEADING_GAP }}
              >
                <Text className="text-lg font-bold text-foreground">
                  {sortedTracks.length} Tracks
                </Text>
                <SortSheet.Trigger label={getSortLabel()} iconSize={16} />
              </View>
            </>
          }
        />

        <SortSheet.Content options={ALBUM_TRACK_SORT_OPTIONS} />
      </View>
    </SortSheet>
  )
}
