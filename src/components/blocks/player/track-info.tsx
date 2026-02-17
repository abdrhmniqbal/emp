import React from "react";
import { View } from "react-native";
import Animated, { Layout } from "react-native-reanimated";
import { Track } from "@/modules/player/player.store";
import { toggleFavoriteItem } from "@/modules/favorites/favorites.store";
import { useIsFavorite } from "@/modules/favorites/favorites.store";
import { PressableFeedback } from "heroui-native";
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid";
import LocalFavouriteIcon from "@/components/icons/local/favourite";
import { MarqueeText } from "@/components/ui";
import { cn } from "tailwind-variants";

interface TrackInfoProps {
  track: Track;
  compact?: boolean;
}

export const TrackInfo: React.FC<TrackInfoProps> = ({
  track,
  compact = false,
}) => {
  const isFavorite = useIsFavorite(track.id);

  return (
    <Animated.View
      layout={Layout.duration(300)}
      className={`flex-row justify-between items-center ${compact ? "mb-3" : "mb-6"}`}
    >
      <View className="flex-1 mr-4">
        <MarqueeText
          text={track.title}
          className={cn(
            "font-bold text-white mb-1",
            compact ? "text-xl" : "text-2xl",
          )}
        />
        <MarqueeText
          text={track.artist || "Unknown Artist"}
          className={cn("text-white/60", compact ? "text-base" : "text-lg")}
        />
      </View>
      <PressableFeedback
        onPress={() => {
          toggleFavoriteItem(
            track.id,
            "track",
            track.title,
            track.artist,
            track.image,
          );
        }}
      >
        {isFavorite ? (
          <LocalFavouriteSolidIcon
            fill="none"
            width={24}
            height={24}
            color="#ef4444"
          />
        ) : (
          <LocalFavouriteIcon
            fill="none"
            width={24}
            height={24}
            color="white"
          />
        )}
      </PressableFeedback>
    </Animated.View>
  );
};
