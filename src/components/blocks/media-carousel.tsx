import type { ReactNode } from "react"
import {
  LegendList,
  type LegendListRenderItemProps,
} from "@legendapp/list"
import { ScrollView, type StyleProp, View, type ViewStyle } from "react-native"
import { cn } from "tailwind-variants"

import { EmptyState } from "@/components/ui/empty-state"

interface EmptyStateConfig {
  icon: ReactNode
  title: string
  message: string
}

interface MediaCarouselProps<T> {
  data: T[]
  renderItem: (item: T, index: number) => ReactNode
  keyExtractor: (item: T, index: number) => string
  emptyState?: EmptyStateConfig
  gap?: number
  paddingHorizontal?: number
  virtualizationThreshold?: number
  className?: string
  contentContainerStyle?: StyleProp<ViewStyle>
}

export function MediaCarousel<T>({
  data,
  renderItem,
  keyExtractor,
  emptyState,
  gap = 16,
  paddingHorizontal = 16,
  virtualizationThreshold = 8,
  className,
  contentContainerStyle,
}: MediaCarouselProps<T>) {
  const shouldVirtualize = data.length >= virtualizationThreshold

  if (data.length === 0 && emptyState) {
    return (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        message={emptyState.message}
        className={cn("mb-8 py-8", className)}
      />
    )
  }

  if (shouldVirtualize) {
    return (
      <LegendList
        horizontal
        data={data}
        maintainVisibleContentPosition={false}
        keyExtractor={keyExtractor}
        renderItem={({ item, index }: LegendListRenderItemProps<T>) => (
          <View style={{ marginRight: index === data.length - 1 ? 0 : gap }}>
            {renderItem(item, index)}
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          { paddingHorizontal },
          contentContainerStyle,
        ]}
        className={cn("mb-8", className)}
        estimatedItemSize={220}
      />
    )
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        { paddingHorizontal, gap },
        contentContainerStyle,
      ]}
      className={cn("mb-8", className)}
    >
      {data.map((item, index) => (
        <View key={keyExtractor(item, index)}>{renderItem(item, index)}</View>
      ))}
    </ScrollView>
  )
}
