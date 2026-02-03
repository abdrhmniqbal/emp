import React from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { Layout } from "react-native-reanimated";
import { playNext, playPrevious, togglePlayback } from "@/store/player-store";

interface PlaybackControlsProps {
    isPlaying: boolean;
    compact?: boolean;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({ isPlaying, compact = false }) => {
    const iconSize = compact ? 32 : 36;
    const playButtonSize = compact ? 64 : 80;
    const containerClass = compact ? 'w-16 h-16' : 'w-20 h-20';
    const gapClass = compact ? 'gap-6' : 'gap-8';

    return (
        <Animated.View
            layout={Layout.duration(300)}
            className={`flex-row justify-between items-center ${compact ? 'mb-6' : 'mb-8'}`}
        >
            <Pressable className="active:opacity-50">
                <Ionicons name="repeat" size={24} color="white" style={{ opacity: 0.7 }} />
            </Pressable>

            <View className={`flex-row items-center ${gapClass}`}>
                <Pressable onPress={playPrevious} className="active:opacity-50">
                    <Ionicons name="play-skip-back" size={iconSize} color="white" />
                </Pressable>

                <Pressable
                    className={`items-center justify-center active:scale-95 ${containerClass}`}
                    onPress={togglePlayback}
                >
                    <Ionicons
                        name={isPlaying ? "pause-circle" : "play-circle"}
                        size={playButtonSize}
                        color="white"
                    />
                </Pressable>

                <Pressable onPress={playNext} className="active:opacity-50">
                    <Ionicons name="play-skip-forward" size={iconSize} color="white" />
                </Pressable>
            </View>

            <Pressable className="active:opacity-50">
                <Ionicons name="shuffle" size={24} color="white" style={{ opacity: 0.7 }} />
            </Pressable>
        </Animated.View>
    );
};
