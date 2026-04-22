/**
 * Purpose: Renders the full Recently Added route from the Search tab.
 * Caller: Search screen's View More action.
 * Dependencies: track query sorted by dateAdded, DB-to-playback track transform, playback actions, themed refresh control, theme colors.
 * Main Functions: RecentlyAddedScreen()
 * Side Effects: Starts indexing on refresh and updates scroll state.
 */

import { useMemo } from "react"
import { View } from "react-native"

import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { TrackList } from "@/components/blocks/track-list"
import LocalClockSolidIcon from "@/components/icons/local/clock-solid"
import { EmptyState } from "@/components/ui/empty-state"
import { ThemedRefreshControl } from "@/components/ui/themed-refresh-control"
import { useIndexerStore } from "@/modules/indexer/indexer.store"
import { startIndexing } from "@/modules/indexer/indexer.service"
import { playTrack } from "@/modules/player/player.service"
import { useTracks } from "@/modules/tracks/tracks.queries"
import { useThemeColors } from "@/modules/ui/theme"
import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/modules/ui/ui.store"
import { transformDBTrackToTrack } from "@/utils/transformers"
import type { DBTrack } from "@/types/database"

const RECENTLY_ADDED_SCREEN_LIMIT = 50

export default function RecentlyAddedScreen() {
  const theme = useThemeColors()
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)
  const { data: tracksData = [], isLoading, isFetching, refetch } = useTracks({
    sortBy: "dateAdded",
    sortOrder: "desc",
  })

  const tracks = useMemo(
    () =>
      (tracksData as DBTrack[])
        .map(transformDBTrackToTrack)
        .slice(0, RECENTLY_ADDED_SCREEN_LIMIT),
    [tracksData]
  )

  async function refresh() {
    await startIndexing(false)
    await refetch()
  }

  function playFirst() {
    if (tracks.length === 0) {
      return
    }

    playTrack(tracks[0], tracks)
  }

  function shuffle() {
    if (tracks.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * tracks.length)
    playTrack(tracks[randomIndex], tracks)
  }

  return (
    <View className="flex-1 bg-background">
      {tracks.length === 0 ? (
        <EmptyState
          icon={
            <LocalClockSolidIcon
              fill="none"
              width={48}
              height={48}
              color={theme.muted}
            />
          }
          title="No recently added"
          message="New tracks added to your library will appear here."
          className="mt-12 px-4"
        />
      ) : (
        <TrackList
          data={tracks}
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
              className="px-0 py-4"
            />
          }
        />
      )}
    </View>
  )
}