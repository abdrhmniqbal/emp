import type { HistoryTopTracksPeriod as TopTracksPeriod } from "@/modules/history/history.types"
import { Tabs } from "heroui-native"
import { useState } from "react"
import { RefreshControl, View } from "react-native"

import Animated from "react-native-reanimated"
import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { TrackList } from "@/components/blocks/track-list"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import { EmptyState } from "@/components/ui/empty-state"
import {
  screenEnterTransition,
  screenExitTransition,
} from "@/constants/animations"
import { useTopTracksByPeriod } from "@/modules/history/history.queries"
import { startIndexing } from "@/modules/indexer/indexer.service"
import { useIndexerStore } from "@/modules/indexer/indexer.store"
import { playTrack } from "@/modules/player/player.service"
import { useThemeColors } from "@/modules/ui/theme"
import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/modules/ui/ui.store"

const TOP_TRACKS_TABS = ["Realtime", "Daily", "Weekly"] as const
type TopTracksTab = (typeof TOP_TRACKS_TABS)[number]
const TOP_TRACKS_LIMIT = 50

function tabToPeriod(tab: TopTracksTab): TopTracksPeriod {
  if (tab === "Daily") {
    return "day"
  }

  if (tab === "Weekly") {
    return "week"
  }

  return "all"
}

export default function TopTracksScreen() {
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)
  const theme = useThemeColors()
  const [activeTab, setActiveTab] = useState<TopTracksTab>("Realtime")
  const period = tabToPeriod(activeTab)
  const { data: currentTracksData, isLoading, isFetching, refetch } =
    useTopTracksByPeriod(period, TOP_TRACKS_LIMIT)

  const currentTracks = currentTracksData ?? []

  async function refresh() {
    await startIndexing(false)
    await refetch()
  }

  function playAll() {
    if (currentTracks.length === 0) {
      return
    }

    playTrack(currentTracks[0], currentTracks)
  }

  function shuffle() {
    if (currentTracks.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * currentTracks.length)
    playTrack(currentTracks[randomIndex], currentTracks)
  }

  return (
    <View className="flex-1 bg-background">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TopTracksTab)}
        className="gap-1.5 px-4 py-4"
      >
        <Tabs.List className="w-full flex-row px-1">
          <Tabs.Indicator className="bg-surface text-surface-foreground" />
          {TOP_TRACKS_TABS.map((tab) => (
            <Tabs.Trigger key={tab} value={tab} className="flex-1 py-2">
              <Tabs.Label className="text-lg">{tab}</Tabs.Label>
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs>

      {currentTracks.length === 0 ? (
        <Animated.View
          key={`empty-${activeTab}`}
          entering={screenEnterTransition()}
          exiting={screenExitTransition()}
          className="px-4"
        >
          <EmptyState
            icon={
              <LocalMusicNoteSolidIcon
                fill="none"
                width={48}
                height={48}
                color={theme.muted}
              />
            }
            title="No top tracks yet"
            message="Play some music to see your most played tracks here!"
            className="mt-12"
          />
        </Animated.View>
      ) : (
        <Animated.View
          key={`tracks-${activeTab}`}
          entering={screenEnterTransition()}
          exiting={screenExitTransition()}
          className="flex-1"
        >
          <TrackList
            data={currentTracks}
            showNumbers
            contentContainerStyle={{
              paddingBottom: 200,
              paddingHorizontal: 16,
            }}
            onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
            onScrollBeginDrag={handleScrollStart}
            onMomentumScrollEnd={handleScrollStop}
            onScrollEndDrag={handleScrollStop}
            refreshControl={
              <RefreshControl
                refreshing={isIndexing || isLoading || isFetching}
                onRefresh={refresh}
                tintColor={theme.accent}
              />
            }
            listHeader={
              <Animated.View
                key={`actions-${activeTab}`}
                entering={screenEnterTransition()}
              >
                <PlaybackActionsRow
                  onPlay={playAll}
                  onShuffle={shuffle}
                  className="px-0 py-4"
                />
              </Animated.View>
            }
          />
        </Animated.View>
      )}
    </View>
  )
}
