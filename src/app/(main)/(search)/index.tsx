import { useRouter } from "expo-router"
import { Input, PressableFeedback } from "heroui-native"
import * as React from "react"

import { ScrollView, View } from "react-native"
import LocalSearchIcon from "@/components/icons/local/search"
import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/modules/ui/ui.store"
import { useThemeColors } from "@/modules/ui/theme"

export default function SearchScreen() {
  const theme = useThemeColors()
  const router = useRouter()

  function handleSearchPress() {
    router.push("/search")
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 20, paddingBottom: 200 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
      onScrollBeginDrag={handleScrollStart}
      onMomentumScrollEnd={handleScrollStop}
      onScrollEndDrag={handleScrollStop}
      scrollEventThrottle={16}
    >
      <View className="relative mb-6">
        <View className="absolute top-1/2 left-4 z-10 -translate-y-1/2">
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
    </ScrollView>
  )
}
