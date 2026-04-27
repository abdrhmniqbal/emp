import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { View } from "react-native"
import { useTranslation } from "react-i18next"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import { CastButton } from "react-native-google-cast"
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated"
import type { SharedValue } from "react-native-reanimated"

import { useComingSoonToast } from "@/components/blocks/player/use-coming-soon-toast"
import LocalMoreHorizontalCircleSolidIcon from "@/components/icons/local/more-horizontal-circle-solid"

interface PlayerHeaderProps {
  onClose: () => void
  onOpenMore?: () => void
  dragY: SharedValue<number>
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
  onClose,
  onOpenMore,
  dragY,
}) => {
  const { showComingSoon } = useComingSoonToast()
  const { t } = useTranslation()

  const handleStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(dragY.value, [0, 90], [1, 0.72]),
    }
  })

  const handleGesture = Gesture.Race(
    Gesture.Tap().onEnd(() => {
      runOnJS(onClose)()
    }),
    Gesture.Pan()
      .activeOffsetY(4)
      .onUpdate((event) => {
        dragY.value = event.translationY > 0 ? event.translationY : 0
      })
      .onEnd(() => {
        const shouldClose = dragY.value > 72
        dragY.value = withSpring(0, {
          damping: 18,
          stiffness: 230,
        })

        if (shouldClose) {
          runOnJS(onClose)()
        }
      })
  )

  return (
    <View className="relative mt-2 h-10 justify-center">
      <View className="absolute left-0 z-20 p-1">
        <CastButton style={{ width: 24, height: 24, tintColor: "white" }} />
      </View>

      <GestureDetector gesture={handleGesture}>
        <Animated.View
          className="absolute -top-4 z-10 self-center px-6 py-4"
          style={handleStyle}
        >
          <View className="h-1.5 w-12 rounded-full bg-white/40" />
        </Animated.View>
      </GestureDetector>

      <PressableFeedback
        onPress={() => {
          if (onOpenMore) {
            onOpenMore()
            return
          }
          showComingSoon(t("player.castFeatures"))
        }}
        className="absolute right-0 z-20 p-1"
      >
        <LocalMoreHorizontalCircleSolidIcon
          fill="none"
          width={24}
          height={24}
          color="white"
        />
      </PressableFeedback>
    </View>
  )
}
