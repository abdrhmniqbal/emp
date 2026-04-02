import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { View } from "react-native"
import { CastButton } from "react-native-google-cast"

import { useComingSoonToast } from "@/components/blocks/player/use-coming-soon-toast"
import LocalMoreHorizontalCircleSolidIcon from "@/components/icons/local/more-horizontal-circle-solid"

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
      <View className="absolute left-0 z-20 p-1">
        <CastButton style={{ width: 24, height: 24, tintColor: "white" }} />
      </View>

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
