/**
 * Purpose: Renders artist collections in a responsive grid layout.
 * Caller: Library and search artist surfaces.
 * Dependencies: LegendList, media item primitives, theme colors.
 * Main Functions: ArtistGrid()
 * Side Effects: None.
 */

import {
  LegendList,
  type LegendListRenderItemProps,
} from "@legendapp/list"
import * as React from "react"
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type RefreshControlProps,
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native"

import { LEGEND_LIST_GRID_CONFIG } from "@/components/blocks/legend-list-config"
import { useLegendListBehavior } from "@/components/blocks/use-legend-list-behavior"
import LocalUserSolidIcon from "@/components/icons/local/user-solid"
import { EmptyState } from "@/components/ui/empty-state"
import {
  MediaItem as Item,
  MediaItemContent as ItemContent,
  MediaItemDescription as ItemDescription,
  MediaItemImage as ItemImage,
  MediaItemTitle as ItemTitle,
} from "@/components/ui/media-item"
import { ICON_SIZES } from "@/constants/icon-sizes"
import { useThemeColors } from "@/modules/ui/theme"

export interface Artist {
  id: string
  name: string
  trackCount: number
  image?: string
  dateAdded: number
}

interface ArtistGridProps {
  data: Artist[]
  onArtistPress?: (artist: Artist) => void
  scrollEnabled?: boolean
  contentContainerStyle?: StyleProp<ViewStyle>
  resetScrollKey?: string
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollBeginDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  refreshControl?: React.ReactElement<RefreshControlProps> | null
}

const GAP = 12
const NUM_COLUMNS = 3
const HORIZONTAL_PADDING = 32

export const ArtistGrid: React.FC<ArtistGridProps> = ({
  data,
  onArtistPress,
  scrollEnabled = true,
  contentContainerStyle,
  resetScrollKey,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollEnd,
  refreshControl,
}) => {
  const theme = useThemeColors()
  const { listRef, listBehaviorProps } = useLegendListBehavior(resetScrollKey)
  const { width: windowWidth } = useWindowDimensions()
  const itemWidth =
    (windowWidth - HORIZONTAL_PADDING - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS
  const estimatedArtistItemHeight = itemWidth + 48
  const gridContentContainerStyle = StyleSheet.flatten([
    { paddingBottom: 8 },
    contentContainerStyle,
  ])
  const handlePress = (artist: Artist) => {
    onArtistPress?.(artist)
  }

  const formatTrackCount = (count: number) =>
    `${count} ${count === 1 ? "track" : "tracks"}`

  if (data.length === 0) {
    return (
      <EmptyState
        icon={
          <LocalUserSolidIcon
            fill="none"
            width={ICON_SIZES.emptyState}
            height={ICON_SIZES.emptyState}
            color={theme.muted}
          />
        }
        title="No Artists"
        message="Artists from your music library will appear here."
      />
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <LegendList
        ref={listRef}
        {...listBehaviorProps}
        data={data}
        renderItem={({ item, index }: LegendListRenderItemProps<Artist>) => {
          const column = index % NUM_COLUMNS
          return (
            <Item
              key={item.id}
              variant="grid"
              style={{
                width: itemWidth,
                marginRight: column < NUM_COLUMNS - 1 ? GAP : 0,
                marginBottom: GAP,
              }}
              onPress={() => handlePress(item)}
            >
              <ItemImage
                icon={
                  <LocalUserSolidIcon
                    fill="none"
                    width={ICON_SIZES.gridFallback}
                    height={ICON_SIZES.gridFallback}
                    color={theme.muted}
                  />
                }
                image={item.image}
                className="aspect-square w-full rounded-full bg-default"
              />
              <ItemContent className="mt-1 items-center">
                <ItemTitle
                  className="text-center text-sm normal-case"
                  numberOfLines={1}
                >
                  {item.name}
                </ItemTitle>
                <ItemDescription className="text-center">
                  {formatTrackCount(item.trackCount)}
                </ItemDescription>
              </ItemContent>
            </Item>
          )
        }}
        keyExtractor={(item) => item.id}
        scrollEnabled={scrollEnabled}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={gridContentContainerStyle}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        refreshControl={refreshControl || undefined}
        style={{ flex: 1, minHeight: 1 }}
        {...LEGEND_LIST_GRID_CONFIG}
        estimatedItemSize={estimatedArtistItemHeight}
      />
    </View>
  )
}
