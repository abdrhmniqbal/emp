import * as React from "react"
import { useStore } from "@nanostores/react"
import { PressableFeedback } from "heroui-native"
import { View } from "react-native"
import { cn } from "tailwind-variants"

import { $showPlayerQueue } from "@/hooks/scroll-bars.store"
import { useThemeColors } from "@/hooks/use-theme-colors"
import LocalMicIcon from "@/components/icons/local/mic"
import LocalQueueIcon from "@/components/icons/local/queue"
import { useComingSoonToast } from "@/components/blocks/player/use-coming-soon-toast"

export const PlayerFooter: React.FC = () => {
  const showQueue = useStore($showPlayerQueue)
  const theme = useThemeColors()
  const { showComingSoon } = useComingSoonToast()

  return (
    <View className="flex-row items-center justify-between">
      <PressableFeedback
        onPress={() => showComingSoon("Lyrics")}
        className="opacity-60"
      >
        <LocalMicIcon fill="none" width={24} height={24} color="white" />
      </PressableFeedback>
      <PressableFeedback
        onPress={() => $showPlayerQueue.set(!showQueue)}
        className={cn(!showQueue && "opacity-60")}
      >
        <LocalQueueIcon
          fill="none"
          width={24}
          height={24}
          color={showQueue ? theme.accent : "white"}
        />
      </PressableFeedback>
    </View>
  )
}
