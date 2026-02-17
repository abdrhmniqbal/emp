import React from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableFeedback } from "heroui-native";
import LocalSlidersVerticalIcon from "@/components/icons/local/sliders-vertical";
import LocalLiveStreamingIcon from "@/components/icons/local/live-streaming";
import LocalMoreHorizontalCircleSolidIcon from "@/components/icons/local/more-horizontal-circle-solid";

interface PlayerHeaderProps {
  onClose: () => void;
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({ onClose }) => (
  <View className="flex-row items-center justify-between mt-2 h-10 relative">
    <PressableFeedback>
      <LocalSlidersVerticalIcon
        fill="none"
        width={24}
        height={24}
        color="white"
      />
    </PressableFeedback>

    <PressableFeedback
      onPress={onClose}
      className="absolute left-0 right-0 items-center justify-center -top-4 bottom-0 z-0 p-4"
    >
      <View className="w-12 h-1.5 bg-white/40 rounded-full" />
    </PressableFeedback>

    <View className="flex-row gap-8 z-10">
      <PressableFeedback>
        <LocalLiveStreamingIcon
          fill="none"
          width={24}
          height={24}
          color="white"
        />
      </PressableFeedback>
      <PressableFeedback>
        <LocalMoreHorizontalCircleSolidIcon
          fill="none"
          width={24}
          height={24}
          color="white"
        />
      </PressableFeedback>
    </View>
  </View>
);
