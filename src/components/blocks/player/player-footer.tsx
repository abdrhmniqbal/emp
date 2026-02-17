import React from "react";
import { View } from "react-native";
import { $showPlayerQueue } from "@/hooks/scroll-bars.store";
import { useStore } from "@nanostores/react";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { PressableFeedback } from "heroui-native";
import { cn } from "tailwind-variants";
import LocalMusicLyricIcon from "@/components/icons/local/music-lyric";
import LocalRightToLeftListNumberIcon from "@/components/icons/local/right-to-left-list-number";

export const PlayerFooter: React.FC = () => {
  const showQueue = useStore($showPlayerQueue);
  const theme = useThemeColors();

  return (
    <View className="flex-row justify-between items-center">
      <PressableFeedback className="opacity-60">
        <LocalMusicLyricIcon fill="none" width={24} height={24} color="white" />
      </PressableFeedback>
      <PressableFeedback
        onPress={() => $showPlayerQueue.set(!showQueue)}
        className={cn(!showQueue && "opacity-60")}
      >
        <LocalRightToLeftListNumberIcon
          fill="none"
          width={24}
          height={24}
          color={showQueue ? theme.accent : "white"}
        />
      </PressableFeedback>
    </View>
  );
};
