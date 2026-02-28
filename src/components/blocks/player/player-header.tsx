import * as React from "react"
import { PressableFeedback } from "heroui-native"
import { View } from "react-native"

import LocalLiveStreamingIcon from "@/components/icons/local/live-streaming"
import LocalMoreHorizontalCircleSolidIcon from "@/components/icons/local/more-horizontal-circle-solid"
import { useComingSoonToast } from "@/components/blocks/player/use-coming-soon-toast"

interface PlayerHeaderProps {
  onClose: () => void
  onOpenMore?: () => void
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
  onClose,
  onOpenMore,
}) => {
  const { showComingSoon } = useComingSoonToast()

  return (
    <View className="relative mt-2 h-10 justify-center">
      <PressableFeedback
        onPress={() => showComingSoon("Cast songs")}
        className="absolute left-0 z-20 p-1"
      >
        <LocalLiveStreamingIcon
          fill="none"
          width={24}
          height={24}
          color="white"
        />
      </PressableFeedback>

      <PressableFeedback
        onPress={onClose}
        className="absolute -top-4 z-10 self-center px-6 py-4"
      >
        <View className="h-1.5 w-12 rounded-full bg-white/40" />
      </PressableFeedback>

      <PressableFeedback
        onPress={() => {
          if (onOpenMore) {
            onOpenMore()
            return
          }
          showComingSoon("Cast features")
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
