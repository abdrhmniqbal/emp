import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { Track, playTrack } from "@/modules/player/player.store";
import { useStore } from "@nanostores/react";
import { $queueInfo, removeFromQueue } from "@/modules/player/queue.store";
import { TrackRow } from "@/components/patterns";
import { cn, PressableFeedback } from "heroui-native";
import LocalCancelIcon from "@/components/icons/local/cancel";

interface QueueItemProps {
  track: Track;
  isCurrentTrack: boolean;
  isPlayedTrack: boolean;
  onPress: () => void;
  onRemove: () => void;
}

export const QueueItem: React.FC<QueueItemProps> = ({
  track,
  isCurrentTrack,
  isPlayedTrack,
  onPress,
  onRemove,
}) => (
  <TrackRow
    track={track}
    onPress={onPress}
    className={cn(
      "px-2 rounded-xl",
      isCurrentTrack ? "bg-white/10" : "active:bg-white/5",
      isPlayedTrack && "opacity-45",
    )}
    imageClassName="h-12 w-12 bg-white/10"
    titleClassName={isCurrentTrack ? "text-white" : "text-white/90"}
    descriptionClassName="text-white/50 text-sm"
    rightAction={
      <View className="flex-row items-center">
        {!isCurrentTrack ? (
          <PressableFeedback
            onPress={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            className="p-2 opacity-60"
          >
            <LocalCancelIcon fill="none" width={24} height={24} color="white" />
          </PressableFeedback>
        ) : null}
      </View>
    }
  />
);

interface QueueViewProps {
  tracks: Track[];
  currentTrack: Track | null;
}

export const QueueView: React.FC<QueueViewProps> = ({ currentTrack }) => {
  const queueInfo = useStore($queueInfo);
  const { queue, upNext, currentIndex } = queueInfo;

  if (!currentTrack || queue.length === 0) return null;

  const handleRemove = async (trackId: string) => {
    await removeFromQueue(trackId);
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      layout={Layout.duration(300)}
      className="flex-1 my-3 -mx-2 overflow-hidden"
    >
      <View className="mb-2 px-2 flex-row justify-between items-center">
        <Text className="text-white/60 text-sm">
          Up Next • {upNext.length} {upNext.length === 1 ? "track" : "tracks"}
        </Text>
      </View>
      <View className="flex-1 h-0">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View className="gap-1">
            {queue.map((track, index) => (
              <QueueItem
                key={track.id}
                track={track}
                isCurrentTrack={track.id === currentTrack.id}
                isPlayedTrack={currentIndex >= 0 && index < currentIndex}
                onPress={() => playTrack(track, queue)}
                onRemove={() => handleRemove(track.id)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </Animated.View>
  );
};
