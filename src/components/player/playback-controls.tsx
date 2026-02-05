import React from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { Layout } from "react-native-reanimated";
import { useStore } from "@nanostores/react";
import { playNext, playPrevious, togglePlayback, toggleRepeatMode, $repeatMode, RepeatModeType } from "@/store/player-store";

interface PlaybackControlsProps {
    isPlaying: boolean;
    compact?: boolean;
}

const getRepeatIcon = (mode: RepeatModeType) => {
    return mode === 'track' ? 'repeat-once' : 'repeat';
};

const getRepeatColor = (mode: RepeatModeType) => {
    return mode === 'off' ? 'white' : '#22c55e';
};

const getRepeatOpacity = (mode: RepeatModeType) => {
    return mode === 'off' ? 0.7 : 1;
};

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({ isPlaying, compact = false }) => {
    const iconSize = compact ? 32 : 36;
    const playButtonSize = compact ? 64 : 80;
    const containerClass = compact ? 'w-16 h-16' : 'w-20 h-20';
    const gapClass = compact ? 'gap-6' : 'gap-8';
    const repeatMode = useStore($repeatMode);

    return (
        <Animated.View
            layout={Layout.duration(300)}
            className={`flex-row justify-between items-center ${compact ? 'mb-6' : 'mb-8'}`}
        >
            <Pressable onPress={toggleRepeatMode} className="active:opacity-50">
                <Ionicons
                    name={getRepeatIcon(repeatMode) as any}
                    size={24}
                    color={getRepeatColor(repeatMode)}
                    style={{ opacity: getRepeatOpacity(repeatMode) }}
                />
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
