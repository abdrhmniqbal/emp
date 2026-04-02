import {
  LegendList,
  type LegendListRef,
  type LegendListRenderItemProps,
} from "@legendapp/list"
import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { useCallback, useRef, useState } from "react"
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type RefreshControlProps,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native"

import { TrackActionSheet } from "@/components/blocks/track-action-sheet"
import { LEGEND_LIST_ROW_CONFIG } from "@/components/blocks/legend-list-config"
import LocalMoreHorizontalCircleSolidIcon from "@/components/icons/local/more-horizontal-circle-solid"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import { TrackRow } from "@/components/patterns/track-row"
import { EmptyState } from "@/components/ui/empty-state"
import { ScaleLoader } from "@/components/ui/scale-loader"
import { useThemeColors } from "@/modules/ui/theme"
import { playTrack } from "@/modules/player/player.service"
import { usePlayerStore, type Track } from "@/modules/player/player.store"
import { useResetScrollOnKey } from "@/components/blocks/use-reset-scroll-on-key"

interface TrackListItemProps {
  track: Track
  index: number
  data: Track[]
  currentTrackId?: string
  mutedColor: string
  showNumbers: boolean
  hideCover: boolean
  hideArtist: boolean
  getNumber?: (track: Track, index: number) => number | string
  onTrackPress: (track: Track) => void
  onTrackLongPress: (track: Track) => void
  renderItemPrefix?: (
    track: Track,
    index: number,
    data: Track[]
  ) => React.ReactNode
}

function TrackListItem({
  track,
  index,
  data,
  currentTrackId,
  mutedColor,
  showNumbers,
  hideCover,
  hideArtist,
  getNumber,
  onTrackPress,
  onTrackLongPress,
  renderItemPrefix,
}: TrackListItemProps) {
  const handleActionPress = useCallback(
    (event: { stopPropagation: () => void }) => {
      event.stopPropagation()
      onTrackLongPress(track)
    },
    [onTrackLongPress, track]
  )

  return (
    <>
      {renderItemPrefix?.(track, index, data) || null}
      <TrackRow
        key={`${track.id}-${index}`}
        track={track}
        onPress={() => onTrackPress(track)}
        onLongPress={() => onTrackLongPress(track)}
        rank={
          showNumbers
            ? getNumber
              ? getNumber(track, index)
              : index + 1
            : undefined
        }
        showCover={!hideCover}
        showArtist={!hideArtist}
        titleClassName={currentTrackId === track.id ? "text-accent" : undefined}
        imageOverlay={currentTrackId === track.id ? <ScaleLoader size={16} /> : undefined}
        rightAction={
          <PressableFeedback onPress={handleActionPress} className="p-2">
            <LocalMoreHorizontalCircleSolidIcon
              fill="none"
              width={24}
              height={24}
              color={mutedColor}
            />
          </PressableFeedback>
        }
      />
    </>
  )
}

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
  const currentTrackId = usePlayerStore((state) => state.currentTrack?.id)

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
      <TrackListItem
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
        contentContainerStyle={[
          { gap: isCompactNumberedList ? 0 : 8 },
          contentContainerStyle,
        ]}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={scrollEventThrottle}
        refreshControl={refreshControl || undefined}
        {...LEGEND_LIST_ROW_CONFIG}
      />
      <TrackActionSheet
        track={selectedTrack}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        tracks={data}
      />
    </View>
  )
}
