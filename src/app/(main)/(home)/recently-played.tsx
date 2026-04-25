/**
 * Purpose: Renders the Recently Played route with playback actions and a full history list.
 * Caller: Home stack nested route.
 * Dependencies: history query, track playback service, themed refresh control, theme colors.
 * Main Functions: RecentlyPlayedScreen()
 * Side Effects: Starts indexing on refresh and updates scroll state.
 */

import { View } from "react-native"

import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { TrackList } from "@/components/blocks/track-list"
import LocalClockSolidIcon from "@/components/icons/local/clock-solid"
import { EmptyState } from "@/components/ui/empty-state"
import { ThemedRefreshControl } from "@/components/ui/themed-refresh-control"
import { useRecentlyPlayedTracks } from "@/modules/history/history.queries"
import { startIndexing } from "@/modules/indexer/indexer.service"
import { useIndexerStore } from "@/modules/indexer/indexer.store"
import { playTrack } from "@/modules/player/player.service"
import { useThemeColors } from "@/modules/ui/theme"
import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/modules/ui/ui.store"

const RECENTLY_PLAYED_SCREEN_LIMIT = 50

export default function RecentlyPlayedScreen() {
  const theme = useThemeColors()
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)
  const { data: historyData, isLoading, isFetching, refetch } =
    useRecentlyPlayedTracks(RECENTLY_PLAYED_SCREEN_LIMIT)

  const history = historyData ?? []

  async function refresh() {
    await startIndexing(false)
    await refetch()
  }

  function playFirst() {
    if (history.length === 0) {
      return
    }

    playTrack(history[0], history)
  }

  function shuffle() {
    if (history.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * history.length)
    playTrack(history[randomIndex], history)
  }

  return (
    <View className="flex-1 bg-background">
      {history.length === 0 ? (
        <EmptyState
          icon={
            <LocalClockSolidIcon
              fill="none"
              width={48}
              height={48}
              color={theme.muted}
            />
          }
          title="No recently played"
          message="Your listening history will appear here once you start playing music."
          className="mt-12 px-4"
        />
      ) : (
        <TrackList
          data={history}
          contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: 16 }}
          onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
          onScrollBeginDrag={handleScrollStart}
          onMomentumScrollEnd={handleScrollStop}
          onScrollEndDrag={handleScrollStop}
          refreshControl={
            <ThemedRefreshControl
              refreshing={isIndexing || isLoading || isFetching}
              onRefresh={refresh}
            />
          }
          listHeader={
            <PlaybackActionsRow
              onPlay={playFirst}
              onShuffle={shuffle}
              className="px-0 py-0"
            />
          }
        />
      )}
    </View>
  )
}
