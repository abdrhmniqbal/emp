import { useStore } from "@nanostores/react"
import { Tabs } from "heroui-native"
import { RefreshControl, View } from "react-native"
import Animated from "react-native-reanimated"

import {
  screenEnterTransition,
  screenExitTransition,
} from "@/constants/animations"
import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/hooks/scroll-bars.store"
import { useThemeColors } from "@/hooks/use-theme-colors"
import { $indexerState } from "@/modules/indexer"
import {
  TOP_TRACKS_TABS,
  useTopTracksScreen,
  type TopTracksTab,
} from "@/modules/tracks/hooks/use-top-tracks-screen"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import { LibrarySkeleton } from "@/components/blocks/library-skeleton"
import { PlaybackActionsRow } from "@/components/blocks"
import { TrackList } from "@/components/blocks/track-list"
import { EmptyState } from "@/components/ui"

export default function TopTracksScreen() {
  const indexerState = useStore($indexerState)
  const theme = useThemeColors()
  const {
    activeTab,
    setActiveTab,
    currentTracks,
    isLoading,
    refresh,
    playAll,
    shuffle,
  } = useTopTracksScreen()

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

      {isLoading ? (
        <Animated.View
          key={`loading-${activeTab}`}
          entering={screenEnterTransition()}
          exiting={screenExitTransition()}
          className="px-4 pt-2"
        >
          <LibrarySkeleton type="tracks" itemCount={9} />
        </Animated.View>
      ) : currentTracks.length === 0 ? (
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
            contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: 16 }}
            onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
            onScrollBeginDrag={handleScrollStart}
            onMomentumScrollEnd={handleScrollStop}
            onScrollEndDrag={handleScrollStop}
            refreshControl={
              <RefreshControl
                refreshing={indexerState.isIndexing}
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
