/**
 * Purpose: Renders artist detail overview, artist tracks, artist albums, and artist header actions.
 * Caller: Expo Router artist detail route.
 * Dependencies: artist track queries, playback service, favorites mutations, sort store, media transition helpers, theme and UI scroll stores.
 * Main Functions: ArtistDetailsScreen()
 * Side Effects: Plays tracks, toggles artist favorites, navigates to album routes, updates scroll UI state.
 */

import type { SortField } from "@/modules/library/library-sort.types"
import type { Track } from "@/modules/player/player.store"
import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams } from "expo-router"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { Button, PressableFeedback } from "heroui-native"
import * as React from "react"
import { useState } from "react"

import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import Transition from "react-native-screen-transitions"
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { type Album, AlbumGrid } from "@/components/blocks/album-grid"
import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { SortSheet } from "@/components/blocks/sort-sheet"
import { TrackList } from "@/components/blocks/track-list"
import LocalChevronLeftIcon from "@/components/icons/local/chevron-left"
import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import LocalUserSolidIcon from "@/components/icons/local/user-solid"
import { Stack } from "@/layouts/stack"
import { BackButton } from "@/components/patterns/back-button"
import { TrackRow } from "@/components/patterns/track-row"
import { ScaleLoader } from "@/components/ui/scale-loader"
import { SectionTitle } from "@/components/ui/section-header"
import {
  screenEnterTransition,
  screenExitTransition,
} from "@/constants/animations"
import {
  SCREEN_SECTION_HEADING_GAP,
  SCREEN_SECTION_TOP_SPACING,
} from "@/constants/layout"
import {
  resolveAlbumTransitionId,
  resolveArtistTransitionId,
} from "@/modules/artists/artist-transition"
import { buildArtistAlbums } from "@/modules/artists/artists.utils"
import { useToggleFavorite } from "@/modules/favorites/favorites.mutations"
import { useIsFavorite } from "@/modules/favorites/favorites.queries"
import {
  ALBUM_SORT_OPTIONS,
  TRACK_SORT_OPTIONS,
} from "@/modules/library/library-sort.constants"
import {
  setSortConfig,
  useLibrarySortStore,
} from "@/modules/library/library-sort.store"
import {
  sortAlbums,
  sortTracks,
} from "@/modules/library/library-sort.utils"
import { useTracksByArtistName } from "@/modules/library/library.queries"
import { logWarn } from "@/modules/logging/logging.service"
import {
  useCurrentTrack,
  usePlayerTracks,
} from "@/modules/player/player-selectors"
import { playTrack } from "@/modules/player/player.service"
import { useThemeColors } from "@/modules/ui/theme"
import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/modules/ui/ui.store"
import { cn } from "@/utils/common"

const SCROLL_SYNC_DELTA = 12

function setAnimatedValue<T>(target: { value: T }, nextValue: T) {
  target.value = nextValue
}

function getRandomTrackIndex(trackCount: number) {
  return Math.floor(Math.random() * trackCount)
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

export default function ArtistDetailsScreen() {
  const { t } = useTranslation()
  const theme = useThemeColors()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const { name, transitionId } = useLocalSearchParams<{
    name: string
    transitionId?: string
  }>()
  const toggleFavoriteMutation = useToggleFavorite()
  const headerCollapseThreshold = screenWidth - 120
  const lastSyncedScrollYRef = React.useRef(0)

  const [isHeaderSolid, setIsHeaderSolid] = useState(false)
  const [activeView, setActiveView] = useState<
    "overview" | "tracks" | "albums"
  >("overview")
  const [sortModalVisible, setSortModalVisible] = useState(false)
  const scrollY = useSharedValue(0)
  const currentTrack = useCurrentTrack()
  const allTracks = usePlayerTracks()
  const allSortConfigs = useLibrarySortStore((state) => state.sortConfig)
  const parsedArtistRouteName = React.useMemo(() => getSafeRouteName(name), [name])
  const artistName =
    parsedArtistRouteName.value.trim() || t("library.unknownArtist")

  React.useEffect(() => {
    if (!parsedArtistRouteName.value.trim()) {
      logWarn("Artist details route missing name param", {
        route: "/artist/[name]",
      })
      return
    }

    if (parsedArtistRouteName.decodeFailed) {
      logWarn("Artist details route name decode failed", {
        route: "/artist/[name]",
        rawName: parsedArtistRouteName.raw,
      })
    }
  }, [
    parsedArtistRouteName.decodeFailed,
    parsedArtistRouteName.raw,
    parsedArtistRouteName.value,
  ])

  const normalizedArtistName = artistName.toLowerCase()
  const {
    data: artistTracksFromQuery = [],
    isLoading: isArtistTracksLoading,
    isFetching: isArtistTracksFetching,
  } = useTracksByArtistName(artistName)
  const artistTracks =
    artistTracksFromQuery.length > 0
      ? artistTracksFromQuery
      : allTracks.filter(
          (track) =>
            (track.artist || track.albumArtist || "").trim().toLowerCase() ===
            normalizedArtistName
        )
  const artistId = artistTracks[0]?.artistId
  const artistImage = artistTracks.find((track) => track.image)?.image
  const artistTransitionId = resolveArtistTransitionId({
    transitionId,
    id: artistId,
    name: artistName,
  })
  const { data: isArtistFavorite = false } = useIsFavorite(
    "artist",
    artistId || ""
  )
  const isLoading =
    (isArtistTracksLoading || isArtistTracksFetching) &&
    artistTracks.length === 0
  const albums = buildArtistAlbums(artistTracks)
  const sortedArtistTracks = sortTracks(
    artistTracks,
    allSortConfigs.ArtistTracks
  )
  const popularTracks = sortedArtistTracks.slice(0, 5)
  const sortedAlbums = sortAlbums(
    albums.map((album): Album => ({
      id: album.title,
      title: album.title,
      artist: album.artist || t("library.unknownArtist"),
      albumArtist: album.albumArtist,
      image: album.image,
      trackCount: album.trackCount,
      year: album.year || 0,
      dateAdded: 0,
    })),
    allSortConfigs.ArtistAlbums
  )
  const currentTab =
    activeView === "tracks"
      ? "ArtistTracks"
      : activeView === "albums"
        ? "ArtistAlbums"
        : "ArtistTracks"
  const sortConfig = allSortConfigs[currentTab]

  const smoothScrollY = useDerivedValue(() =>
    withTiming(scrollY.value, { duration: 90 })
  )

  const onScreenScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y
      setAnimatedValue(scrollY, y)

      const scrollDelta = Math.abs(y - lastSyncedScrollYRef.current)
      if (scrollDelta >= SCROLL_SYNC_DELTA || y <= 0) {
        handleScroll(y)
        lastSyncedScrollYRef.current = y
      }

      const nextHeaderSolid = y > headerCollapseThreshold
      setIsHeaderSolid((previous) =>
        previous === nextHeaderSolid ? previous : nextHeaderSolid
      )
    },
    [headerCollapseThreshold, scrollY]
  )

  const heroArtworkStyle = useAnimatedStyle(() => {
    const y = smoothScrollY.value
    return {
      transform: [
        {
          translateY: interpolate(
            y,
            [-220, 0, 220],
            [-52, 0, 0],
            Extrapolation.CLAMP
          ),
        },
        {
          scale: interpolate(
            y,
            [-220, 0, 220],
            [1.22, 1.08, 1],
            Extrapolation.CLAMP
          ),
        },
      ],
    }
  })

  if (isLoading) {
    return <View className="flex-1 bg-background" />
  }

  function handleSortSelect(field: SortField, order?: "asc" | "desc") {
    setSortConfig(currentTab, field, order)
  }

  function navigateTo(view: "overview" | "tracks" | "albums") {
    setActiveView(view)
  }

  function handleBack() {
    router.back()
  }

  function toggleArtistFavorite() {
    if (!artistId) {
      return
    }

    void toggleFavoriteMutation.mutateAsync({
      type: "artist",
      itemId: artistId,
      isCurrentlyFavorite: isArtistFavorite,
      name: artistName,
      subtitle: t("library.count.track", {
        count: artistTracks.length,
      }),
      image: artistImage,
    })
  }

  function playArtistTrack(track: Track) {
    playTrack(track, sortedArtistTracks)
  }

  function playAllTracks() {
    if (sortedArtistTracks.length === 0) {
      return
    }

    playTrack(sortedArtistTracks[0], sortedArtistTracks)
  }

  function shuffleTracks() {
    if (sortedArtistTracks.length === 0) {
      return
    }

    const randomIndex = getRandomTrackIndex(sortedArtistTracks.length)
    playTrack(sortedArtistTracks[randomIndex], sortedArtistTracks)
  }

  function openAlbum(album: Album) {
    router.push({
      pathname: "/album/[name]",
      params: {
        name: album.title,
        transitionId: resolveAlbumTransitionId({
          id: album.id,
          title: album.title,
        }),
      },
    })
  }

  function getSortLabel() {
    const options =
      activeView === "tracks" ? TRACK_SORT_OPTIONS : ALBUM_SORT_OPTIONS
    const selectedOption = options.find(
      (option) => option.field === sortConfig.field
    )
    return selectedOption ? t(selectedOption.label) : t("library.sort")
  }

  const renderHeroSection = () => (
    <View style={{ height: screenWidth }} className="relative overflow-hidden">
      <Transition.Boundary.View
        id={artistTransitionId}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <Animated.View
          style={[
            { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
            heroArtworkStyle,
          ]}
        >
          {artistImage ? (
            <Image
              source={{ uri: artistImage }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <View className="h-full w-full items-center justify-center bg-surface-secondary">
              <LocalUserSolidIcon
                fill="none"
                width={120}
                height={120}
                color={theme.muted}
              />
            </View>
          )}
        </Animated.View>
      </Transition.Boundary.View>

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.7)", theme.background]}
        locations={[0.3, 0.7, 1]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "60%",
        }}
      />

      <View className="absolute right-6 bottom-8 left-6">
        <Text className="mb-2 text-4xl font-bold text-white">{artistName}</Text>
        <Text className="text-base text-white/70">
          {t("library.count.track", { count: artistTracks.length })}
        </Text>
      </View>
    </View>
  )

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
            headerShown: false,
          }}
        />
        <View
          className="absolute right-0 left-0 flex-row items-end justify-between px-4 pb-2"
          style={{
            top: 0,
            height: insets.top + 52,
            zIndex: 100,
            elevation: 100,
            backgroundColor: isHeaderSolid ? theme.background : "transparent",
          }}
        >
          <BackButton
            className={cn("-ml-2", !isHeaderSolid && "bg-overlay/30")}
            fallbackHref="/(main)/(library)"
            iconColor={isHeaderSolid ? theme.foreground : "white"}
            onPress={handleBack}
          />
          {isHeaderSolid ? (
            <View
              pointerEvents="none"
              className="absolute right-16 bottom-4 left-16 items-center"
            >
              <Text
                className="text-base font-semibold text-foreground"
                numberOfLines={1}
              >
                {artistName}
              </Text>
            </View>
          ) : null}
          {artistId ? (
            <Button
              onPress={toggleArtistFavorite}
              isDisabled={toggleFavoriteMutation.isPending}
              variant="ghost"
              className={cn("-mr-2", !isHeaderSolid && "bg-overlay/30")}
              isIconOnly
            >
              {isArtistFavorite ? (
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
                  color={isHeaderSolid ? theme.foreground : "white"}
                />
              )}
            </Button>
          ) : (
            <View className="h-10 w-10" />
          )}
        </View>

        {activeView === "overview" ? (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 200 }}
            onScroll={onScreenScroll}
            onScrollBeginDrag={handleScrollStart}
            onMomentumScrollEnd={handleScrollStop}
            onScrollEndDrag={handleScrollStop}
            scrollEventThrottle={16}
          >
            {renderHeroSection()}

            <Animated.View
              key={activeView}
              entering={screenEnterTransition()}
              exiting={screenExitTransition()}
              style={{ paddingTop: SCREEN_SECTION_TOP_SPACING }}
            >
              <View className="px-6">
                <SectionTitle
                  title={t("library.tracks")}
                  onViewMore={() => navigateTo("tracks")}
                />
                <View style={{ gap: 8 }}>
                  {popularTracks.map((track) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      onPress={() => playArtistTrack(track)}
                      titleClassName={
                        currentTrack?.id === track.id
                          ? "text-accent"
                          : undefined
                      }
                      imageOverlay={
                        currentTrack?.id === track.id ? (
                          <ScaleLoader size={16} />
                        ) : undefined
                      }
                    />
                  ))}
                </View>
              </View>

              {albums.length > 0 && (
                <View className="mt-8 px-6">
                  <SectionTitle
                    title={t("library.albums")}
                    onViewMore={() => navigateTo("albums")}
                  />
                  <AlbumGrid
                    horizontal
                    data={albums.map(
                      (album) => ({ ...album, id: album.title }) as Album
                    )}
                    onAlbumPress={openAlbum}
                  />
                </View>
              )}
            </Animated.View>
          </ScrollView>
        ) : activeView === "tracks" ? (
          <TrackList
            data={sortedArtistTracks}
            onTrackPress={playArtistTrack}
            resetScrollKey={`${artistId || artistName}-tracks-${sortConfig.field}-${sortConfig.order}`}
            contentContainerStyle={{
              paddingBottom: 200,
              paddingHorizontal: 24,
            }}
            onScroll={onScreenScroll}
            onScrollBeginDrag={handleScrollStart}
            onMomentumScrollEnd={handleScrollStop}
            onScrollEndDrag={handleScrollStop}
            listHeader={
              <>
                <View style={{ marginHorizontal: -24 }}>
                  {renderHeroSection()}
                </View>
                <Animated.View
                  entering={screenEnterTransition()}
                  style={{ paddingTop: SCREEN_SECTION_TOP_SPACING }}
                >
                  <View
                    className="flex-row items-center justify-between"
                    style={{ marginBottom: SCREEN_SECTION_HEADING_GAP }}
                  >
                    <View className="flex-row items-center gap-3">
                      <PressableFeedback
                        onPress={() => navigateTo("overview")}
                        className="mr-2 active:opacity-50"
                      >
                        <LocalChevronLeftIcon
                          fill="none"
                          width={20}
                          height={20}
                          color={theme.muted}
                        />
                      </PressableFeedback>
                      <Text className="text-lg font-bold text-foreground">
                        {t("library.allTracks")}
                      </Text>
                    </View>
                    <SortSheet.Trigger label={getSortLabel()} iconSize={14} />
                  </View>
                  <PlaybackActionsRow
                    onPlay={playAllTracks}
                    onShuffle={shuffleTracks}
                    className="mb-2"
                  />
                </Animated.View>
              </>
            }
          />
        ) : (
          <AlbumGrid
            data={sortedAlbums}
            onAlbumPress={openAlbum}
            resetScrollKey={`${artistId || artistName}-albums-${sortConfig.field}-${sortConfig.order}`}
            contentContainerStyle={{
              paddingBottom: 200,
              paddingHorizontal: 16,
            }}
            onScroll={onScreenScroll}
            onScrollBeginDrag={handleScrollStart}
            onMomentumScrollEnd={handleScrollStop}
            onScrollEndDrag={handleScrollStop}
            listHeader={
              <>
                <View style={{ marginHorizontal: -16 }}>
                  {renderHeroSection()}
                </View>
                <Animated.View
                  entering={screenEnterTransition()}
                  className="px-2"
                  style={{ paddingTop: SCREEN_SECTION_TOP_SPACING }}
                >
                  <View
                    className="flex-row items-center justify-between"
                    style={{ marginBottom: SCREEN_SECTION_HEADING_GAP }}
                  >
                    <View className="flex-row items-center gap-3">
                      <PressableFeedback
                        onPress={() => navigateTo("overview")}
                        className="mr-2 active:opacity-50"
                      >
                        <LocalChevronLeftIcon
                          fill="none"
                          width={20}
                          height={20}
                          color={theme.muted}
                        />
                      </PressableFeedback>
                      <Text className="text-lg font-bold text-foreground">
                        All Albums
                      </Text>
                    </View>
                    <SortSheet.Trigger label={getSortLabel()} iconSize={14} />
                  </View>
                </Animated.View>
              </>
            }
          />
        )}

        <SortSheet.Content
          options={
            activeView === "tracks"
              ? TRACK_SORT_OPTIONS
              : activeView === "albums"
                ? ALBUM_SORT_OPTIONS
                : []
          }
        />
      </View>
    </SortSheet>
  )
}
