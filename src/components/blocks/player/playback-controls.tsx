import React from "react";
import { View } from "react-native";
import Animated, { Layout } from "react-native-reanimated";
import { useStore } from "@nanostores/react";
import {
  playNext,
  playPrevious,
  togglePlayback,
  toggleRepeatMode,
  $repeatMode,
  RepeatModeType,
} from "@/modules/player/player.store";
import { toggleShuffle, $isShuffled } from "@/modules/player/queue.store";
import { PressableFeedback } from "heroui-native";
import LocalShuffleIcon from "@/components/icons/local/shuffle";
import { useThemeColors } from "@/hooks/use-theme-colors";
import LocalNextSolidIcon from "@/components/icons/local/next-solid";
import LocalPreviousSolidIcon from "@/components/icons/local/previous-solid";
import { cn } from "@/utils/common";
import LocalPlayCircleSolidIcon from "@/components/icons/local/play-circle-solid";
import LocalPauseCircleSolidIcon from "@/components/icons/local/pause-circle-solid";
import LocalRepeatOneIcon from "@/components/icons/local/repeat-one";
import LocalRepeatIcon from "@/components/icons/local/repeat";

interface PlaybackControlsProps {
  isPlaying: boolean;
  compact?: boolean;
}

const getRepeatIcon = (mode: RepeatModeType) => {
  return mode === "track" ? "repeat-once" : "repeat";
};

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  compact = false,
}) => {
  const theme = useThemeColors();
  const iconSize = compact ? 32 : 36;
  const playButtonSize = compact ? 64 : 80;
  const containerClass = compact ? "w-16 h-16" : "w-20 h-20";
  const gapClass = compact ? "gap-6" : "gap-8";
  const repeatMode = useStore($repeatMode);
  const isShuffled = useStore($isShuffled);

  const getRepeatColor = (mode: RepeatModeType) => {
    return mode === "off" ? "white" : theme.accent;
  };

  return (
    <Animated.View
      layout={Layout.duration(300)}
      className={cn(
        "flex-row justify-between items-center",
        compact ? "mb-6" : "mb-8",
      )}
    >
      <PressableFeedback
        onPress={toggleRepeatMode}
        className={cn(repeatMode === "off" && "opacity-60")}
      >
        {getRepeatIcon(repeatMode) === "repeat-once" ? (
          <LocalRepeatOneIcon
            fill="none"
            width={24}
            height={24}
            color={getRepeatColor(repeatMode)}
          />
        ) : (
          <LocalRepeatIcon
            fill="none"
            width={24}
            height={24}
            color={getRepeatColor(repeatMode)}
          />
        )}
      </PressableFeedback>

      <View className={cn("flex-row items-center", gapClass)}>
        <PressableFeedback onPress={playPrevious}>
          <LocalPreviousSolidIcon
            fill="none"
            width={iconSize}
            height={iconSize}
            color="white"
          />
        </PressableFeedback>

        <PressableFeedback
          className={cn("items-center justify-center", containerClass)}
          onPress={togglePlayback}
        >
          {isPlaying ? (
            <LocalPauseCircleSolidIcon
              fill="none"
              width={playButtonSize}
              height={playButtonSize}
              color="white"
            />
          ) : (
            <LocalPlayCircleSolidIcon
              fill="none"
              width={playButtonSize}
              height={playButtonSize}
              color="white"
            />
          )}
        </PressableFeedback>

        <PressableFeedback onPress={playNext}>
          <LocalNextSolidIcon
            fill="none"
            width={iconSize}
            height={iconSize}
            color="white"
          />
        </PressableFeedback>
      </View>

      <PressableFeedback
        onPress={toggleShuffle}
        className={cn(!isShuffled && "opacity-60")}
      >
        <LocalShuffleIcon
          fill="none"
          width={24}
          height={24}
          color={isShuffled ? theme.accent : "white"}
        />
      </PressableFeedback>
    </Animated.View>
  );
};
