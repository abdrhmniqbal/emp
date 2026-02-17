import React from "react";
import { View, Image } from "react-native";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { Track } from "@/modules/player/player.store";
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid";
import { useThemeColors } from "@/hooks/use-theme-colors";

interface AlbumArtViewProps {
  currentTrack: Track;
}

export const AlbumArtView: React.FC<AlbumArtViewProps> = ({ currentTrack }) => {
  const theme = useThemeColors();
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      layout={Layout.duration(300)}
      className="items-center justify-center flex-1 my-8"
    >
      <View className="absolute w-full aspect-square blur-2xl rounded-full scale-0.9" />
      <View className="w-full aspect-square rounded-3xl overflow-hidden shadow-2xl elevation-10">
        {currentTrack.image ? (
          <Image
            source={{ uri: currentTrack.image }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full bg-surface items-center justify-center">
            <LocalMusicNoteSolidIcon
              fill="none"
              width={120}
              height={120}
              color={theme.muted}
            />
          </View>
        )}
      </View>
    </Animated.View>
  );
};
