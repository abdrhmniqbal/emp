import type { Track } from "@/modules/player/player.store"
import {
  LegendList,
  type LegendListRef,
  type LegendListRenderItemProps,
} from "@legendapp/list"
import * as React from "react"
import { useCallback, useRef, useState } from "react"

import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type RefreshControlProps,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native"
import { LEGEND_LIST_ROW_CONFIG } from "@/components/blocks/legend-list-config"
import { TrackActionSheet } from "@/components/blocks/track-action-sheet"
import { useResetScrollOnKey } from "@/components/blocks/use-reset-scroll-on-key"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import { MemoizedTrackListItem } from "@/components/patterns/track-list-item"
import { EmptyState } from "@/components/ui/empty-state"
import { useCurrentTrackId } from "@/modules/player/player-selectors"
import { playTrack } from "@/modules/player/player.service"
import { useThemeColors } from "@/modules/ui/theme"

interface TrackListProps {
  data: Track[]
  onTrackPress?: (track: Track) => void
  showNumbers?: boolean
  hideCover?: boolean
  hideArtist?: boolean
  getNumber?: (track: Track, index: number) => number | string
  scrollEnabled?: boolean
  listHeader?: React.ReactElement | null
  listFooter?: React.ReactElement | null
  contentContainerStyle?: StyleProp<ViewStyle>
  showsVerticalScrollIndicator?: boolean
  scrollEventThrottle?: number
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollBeginDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  refreshControl?: React.ReactElement<RefreshControlProps> | null
  resetScrollKey?: string
  renderItemPrefix?: (
    track: Track,
    index: number,
    data: Track[]
  ) => React.ReactNode
}

export const TrackList: React.FC<TrackListProps> = ({
  data,
  onTrackPress,
  showNumbers = false,
  hideCover = false,
  hideArtist = false,
  getNumber,
  scrollEnabled = true,
  listHeader = null,
  listFooter = null,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  scrollEventThrottle = 16,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollEnd,
  refreshControl,
  resetScrollKey,
  renderItemPrefix,
}) => {
  const theme = useThemeColors()
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const listRef = useRef<LegendListRef | null>(null)
  const isCompactNumberedList = hideCover && showNumbers
  const currentTrackId = useCurrentTrackId()
  const estimatedItemSize = isCompactNumberedList ? 56 : 84
  const listContentContainerStyle = StyleSheet.flatten([
    { gap: isCompactNumberedList ? 0 : 8 },
    contentContainerStyle,
  ])

  useResetScrollOnKey(listRef, resetScrollKey)

  const handleTrackPress = useCallback((track: Track) => {
    if (onTrackPress) {
      onTrackPress(track)
      return
    }

    playTrack(track, data)
  }, [data, onTrackPress])

  const showActionMenu = useCallback((track: Track) => {
    setSelectedTrack(track)
    setIsSheetOpen(true)
  }, [])

  const renderTrackItem = useCallback(
    ({ item, index }: LegendListRenderItemProps<Track>) => (
      <MemoizedTrackListItem
        track={item}
        index={index}
        data={data}
        currentTrackId={currentTrackId}
        mutedColor={theme.muted}
        showNumbers={showNumbers}
        hideCover={hideCover}
        hideArtist={hideArtist}
        getNumber={getNumber}
        onTrackPress={handleTrackPress}
        onTrackLongPress={showActionMenu}
        renderItemPrefix={renderItemPrefix}
      />
    ),
    [
      currentTrackId,
      data,
      getNumber,
      handleTrackPress,
      hideArtist,
      hideCover,
      renderItemPrefix,
      showActionMenu,
      showNumbers,
      theme.muted,
    ]
  )
  const handleSheetClose = useCallback(() => {
    setIsSheetOpen(false)
  }, [])

  return (
    <View style={{ flex: 1 }}>
      <LegendList
        ref={listRef}
        maintainVisibleContentPosition={false}
        dataVersion={resetScrollKey}
        data={data}
        renderItem={renderTrackItem}
        keyExtractor={(item) => item.id}
        style={{ flex: 1, minHeight: 1 }}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={
          <EmptyState
            icon={
              <LocalMusicNoteSolidIcon
                fill="none"
                width={48}
                height={48}
                color={theme.muted}
              />
            }
            title="No Tracks"
            message="Tracks you add to your library will appear here."
          />
        }
        contentContainerStyle={listContentContainerStyle}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={scrollEventThrottle}
        refreshControl={refreshControl || undefined}
        {...LEGEND_LIST_ROW_CONFIG}
        estimatedItemSize={estimatedItemSize}
      />
      <TrackActionSheet
        track={selectedTrack}
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
        tracks={data}
      />
    </View>
  )
}
