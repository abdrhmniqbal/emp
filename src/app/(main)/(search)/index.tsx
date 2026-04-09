import type { Track } from "@/modules/player/player.store"
import type { DBTrack } from "@/types/database"
import { useRouter } from "expo-router"

import { Input, PressableFeedback } from "heroui-native"
import * as React from "react"
import { ScrollView, View } from "react-native"
import { ContentSection } from "@/components/blocks/content-section"
import { MediaCarousel } from "@/components/blocks/media-carousel"
import LocalClockSolidIcon from "@/components/icons/local/clock-solid"
import LocalSearchIcon from "@/components/icons/local/search"
import { TrackRow } from "@/components/patterns/track-row"
import { ScaleLoader } from "@/components/ui/scale-loader"
import { useCurrentTrackId } from "@/modules/player/player-selectors"
import { playTrack } from "@/modules/player/player.service"
import { useTracks } from "@/modules/tracks/tracks.queries"
import { useThemeColors } from "@/modules/ui/theme"
import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/modules/ui/ui.store"
import { transformDBTrackToTrack } from "@/utils/transformers"

const RECENTLY_ADDED_LIMIT = 8

export default function SearchScreen() {
  const theme = useThemeColors()
  const router = useRouter()
  const currentTrackId = useCurrentTrackId()
  const { data: dbTracks = [] } = useTracks({
    sortBy: "dateAdded",
    sortOrder: "desc",
  })

  const recentlyAddedTracks = React.useMemo(() => {
    return (dbTracks as DBTrack[])
      .map(transformDBTrackToTrack)
      .slice(0, RECENTLY_ADDED_LIMIT)
  }, [dbTracks])

  const renderRecentlyAddedItem = React.useCallback(
    (item: Track) => (
      <TrackRow
        track={item}
        variant="grid"
        onPress={() => playTrack(item, recentlyAddedTracks)}
        titleClassName={currentTrackId === item.id ? "text-accent" : undefined}
        imageOverlay={
          currentTrackId === item.id ? <ScaleLoader size={16} /> : undefined
        }
      />
    ),
    [currentTrackId, recentlyAddedTracks]
  )

  function handleSearchPress() {
    router.push("/search")
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 200 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
      onScrollBeginDrag={handleScrollStart}
      onMomentumScrollEnd={handleScrollStop}
      onScrollEndDrag={handleScrollStop}
      scrollEventThrottle={16}
    >
      <View className="relative my-6 px-3">
        <View className="absolute top-1/2 left-7 z-10 -translate-y-1/2">
          <LocalSearchIcon
            fill="none"
            width={24}
            height={24}
            color={theme.muted}
          />
        </View>
        <Input
          value=""
          editable={false}
          showSoftInputOnFocus={false}
          placeholder="Search for tracks, artists, albums..."
          className="pl-12"
        />
        <PressableFeedback
          onPress={handleSearchPress}
          className="absolute inset-0 z-20"
          accessibilityRole="button"
          accessibilityLabel="Open search"
        />
      </View>

      <ContentSection
        title="Recently Added"
        data={recentlyAddedTracks}
        emptyState={{
          icon: (
            <LocalClockSolidIcon
              fill="none"
              width={48}
              height={48}
              color={theme.muted}
            />
          ),
          title: "No recently added",
          message: "New tracks added to your library will appear here.",
        }}
        renderContent={(data) => (
          <MediaCarousel
            data={data}
            renderItem={renderRecentlyAddedItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            gap={10}
          />
        )}
      />
    </ScrollView>
  )
}
