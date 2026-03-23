import { Stack, useLocalSearchParams } from "expo-router"
import { RefreshControl, View } from "react-native"
import Animated from "react-native-reanimated"

import { PlaybackActionsRow } from "@/components/blocks"
import { LibrarySkeleton } from "@/components/blocks/library-skeleton"
import { TrackList } from "@/components/blocks/track-list"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import { EmptyState } from "@/components/ui"
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
import { useGenreTopTracksScreen } from "@/modules/genres/hooks/use-genre-top-tracks-screen"
import { useIndexerStore } from "@/modules/indexer/indexer.store"

export default function GenreTopTracksScreen() {
  const { name } = useLocalSearchParams<{ name: string }>()
  const indexerState = useIndexerStore((state) => state.indexerState)
  const theme = useThemeColors()

  const genreName = decodeURIComponent(name || "")
  const { tracks, isLoading, refresh, playAll, shuffle } =
    useGenreTopTracksScreen(genreName)

  if (isLoading && tracks.length === 0) {
    return (
      <View className="flex-1 bg-background px-4 pt-4">
        <Stack.Screen
          options={{
            title: `${genreName} Top Tracks`,
          }}
        />
        <LibrarySkeleton type="tracks" itemCount={8} />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: `${genreName} Top Tracks`,
        }}
      />
      {tracks.length === 0 ? (
        <Animated.View
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
            message={`Play some ${genreName} music to see your most played tracks here!`}
            className="mt-12"
          />
        </Animated.View>
      ) : (
        <TrackList
          data={tracks}
          showNumbers
          contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: 16 }}
          onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
          onScrollBeginDrag={handleScrollStart}
          onMomentumScrollEnd={handleScrollStop}
          onScrollEndDrag={handleScrollStop}
          refreshControl={
            <RefreshControl
              refreshing={indexerState.isIndexing || isLoading}
              onRefresh={refresh}
              tintColor={theme.accent}
            />
          }
          listHeader={
            <PlaybackActionsRow
              onPlay={playAll}
              onShuffle={shuffle}
              className="px-0 py-4"
            />
          }
        />
      )}
    </View>
  )
}
