/**
 * Purpose: Renders the Home landing screen with recently played and top tracks previews.
 * Caller: Expo Router home tab.
 * Dependencies: history queries, react-i18next, track playback service, themed refresh control, theme colors.
 * Main Functions: HomeScreen()
 * Side Effects: Starts indexing on refresh and updates scroll state.
 */

import type { Track } from "@/modules/player/player.store"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import * as React from "react"

import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"
import { ContentSection } from "@/components/blocks/content-section"
import { MediaCarousel } from "@/components/blocks/media-carousel"
import { RankedTrackCarousel } from "@/components/blocks/ranked-track-carousel"
import LocalClockSolidIcon from "@/components/icons/local/clock-solid"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import { SCREEN_SECTION_TOP_SPACING } from "@/constants/layout"
import { TrackRow } from "@/components/patterns/track-row"
import { ScaleLoader } from "@/components/ui/scale-loader"
import { ThemedRefreshControl } from "@/components/ui/themed-refresh-control"
import {
  useRecentlyPlayedTracks,
  useTopTracksByPeriod,
} from "@/modules/history/history.queries"
import { startIndexing } from "@/modules/indexer/indexer.service"
import { useIndexerStore } from "@/modules/indexer/indexer.store"
import { useCurrentTrackId } from "@/modules/player/player-selectors"
import { playTrack } from "@/modules/player/player.service"
import { useThemeColors } from "@/modules/ui/theme"
import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/modules/ui/ui.store"

const CHUNK_SIZE = 5
const RECENTLY_PLAYED_LIMIT = 8
const TOP_TRACKS_LIMIT = 25

export default function HomeScreen() {
  const router = useRouter()
  const theme = useThemeColors()
  const { t } = useTranslation()
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)
  const currentTrackId = useCurrentTrackId()
  const {
    data: recentlyPlayedTracksData,
    isLoading: isRecentlyPlayedLoading,
    isFetching: isRecentlyPlayedFetching,
    refetch: refetchRecentlyPlayedTracks,
  } = useRecentlyPlayedTracks(RECENTLY_PLAYED_LIMIT)
  const {
    data: topTracksData,
    isLoading: isTopTracksLoading,
    isFetching: isTopTracksFetching,
    refetch: refetchTopTracks,
  } = useTopTracksByPeriod("all", TOP_TRACKS_LIMIT)

  const recentlyPlayedTracks = recentlyPlayedTracksData ?? []
  const topTracks = topTracksData ?? []
  const isLoading =
    (isRecentlyPlayedLoading ||
      isRecentlyPlayedFetching ||
      isTopTracksLoading ||
      isTopTracksFetching) &&
    recentlyPlayedTracks.length === 0 &&
    topTracks.length === 0

  async function refresh() {
    await startIndexing(false)
    await Promise.all([refetchRecentlyPlayedTracks(), refetchTopTracks()])
  }

  function renderRecentlyPlayedItem(item: Track) {
    return (
      <TrackRow
        track={item}
        variant="grid"
        onPress={() => playTrack(item, recentlyPlayedTracks)}
        titleClassName={
          currentTrackId === item.id ? "text-accent" : undefined
        }
        imageOverlay={
          currentTrackId === item.id ? <ScaleLoader size={16} /> : undefined
        }
      />
    )
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 220 }}
      contentInsetAdjustmentBehavior="automatic"
      onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
      onScrollBeginDrag={handleScrollStart}
      onMomentumScrollEnd={handleScrollStop}
      onScrollEndDrag={handleScrollStop}
      scrollEventThrottle={16}
      refreshControl={
        <ThemedRefreshControl refreshing={isIndexing || isLoading} onRefresh={refresh} />
      }
    >
      <View style={{ paddingTop: SCREEN_SECTION_TOP_SPACING }}>
        <ContentSection
          title={t("home.recentlyPlayed")}
          data={recentlyPlayedTracks}
          onViewMore={() => router.push("/(main)/(home)/recently-played")}
          emptyState={{
            icon: (
              <LocalClockSolidIcon
                fill="none"
                width={48}
                height={48}
                color={theme.muted}
              />
            ),
            title: t("home.empty.recentlyPlayedTitle"),
            message: t("home.empty.recentlyPlayedMessage"),
          }}
          renderContent={(data) => (
            <MediaCarousel
              data={data}
              renderItem={renderRecentlyPlayedItem}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              gap={10}
            />
          )}
        />

        <ContentSection
          title={t("home.topTracks")}
          data={topTracks}
          onViewMore={() => router.push("/(main)/(home)/top-tracks")}
          emptyState={{
            icon: (
              <LocalMusicNoteSolidIcon
                fill="none"
                width={48}
                height={48}
                color={theme.muted}
              />
            ),
            title: t("home.empty.topTracksTitle"),
            message: t("home.empty.topTracksMessage"),
          }}
          renderContent={(data) => (
            <RankedTrackCarousel data={data} chunkSize={CHUNK_SIZE} />
          )}
        />
      </View>
    </ScrollView>
  )
}
