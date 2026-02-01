import React, { useEffect } from "react";
import { View, Text, Pressable, Dimensions, Image, TextInput, ScrollView } from "react-native";
import { getColors } from "react-native-image-colors";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import { $currentTrack, $isPlaying, playNext, playPrevious, togglePlayback, playTrack, $currentTime, $duration, seekTo, $tracks, Track } from "@/store/player-store";
import { $isPlayerExpanded, $showPlayerQueue } from "@/store/ui-store";
import { useIsFavorite, toggleFavoriteItem } from "@/store/favorites-store";
import { Colors } from "@/constants/colors";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
    useAnimatedProps,
    FadeIn,
    FadeOut,
    Layout,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const SCREEN_HEIGHT = Dimensions.get('window').height;
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export const FullPlayer = () => {
    const isExpanded = useStore($isPlayerExpanded);
    const currentTrack = useStore($currentTrack);
    const isPlaying = useStore($isPlaying);
    const currentTimeVal = useStore($currentTime);
    const durationVal = useStore($duration);
    const tracks = useStore($tracks);
    const showQueue = useStore($showPlayerQueue);

    const isCurrentTrackFavorite = useIsFavorite(currentTrack?.id || "");

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const currentTime = formatTime(currentTimeVal);
    const totalTime = formatTime(durationVal);
    const progressPercent = durationVal > 0 ? (currentTimeVal / durationVal) * 100 : 0;

    const translateY = useSharedValue(SCREEN_HEIGHT);

    const [colors, setColors] = React.useState({ bg: '#1a1a1a', primary: '#cccccc', secondary: '#000000' });

    useEffect(() => {
        if (currentTrack?.image) {
            const fetchColors = async () => {
                try {
                    const result = await getColors(currentTrack.image!, {
                        fallback: '#1a1a1a',
                        cache: true,
                        key: currentTrack.image,
                    });

                    if (result.platform === 'android') {
                        setColors({ bg: result.average || '#1a1a1a', primary: result.dominant || '#cccccc', secondary: result.darkVibrant || '#000000' });
                    } else if (result.platform === 'ios') {
                        setColors({ bg: result.background || '#1a1a1a', primary: result.primary || '#cccccc', secondary: result.detail || '#000000' });
                    }
                } catch (e) {
                }
            };
            fetchColors();
        }
    }, [currentTrack?.image]);

    useEffect(() => {
        if (isExpanded) {
            translateY.value = withTiming(0, { duration: 300 });
        } else {
            translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
        }
    }, [isExpanded]);

    const closePlayer = () => {
        $isPlayerExpanded.set(false);
        $showPlayerQueue.set(false);
    };

    const panGesture = Gesture.Pan()
        .activeOffsetY(20)
        .onUpdate((event) => {
            if (event.translationY > 0) {
                translateY.value = event.translationY;
            }
        })
        .onEnd((event) => {
            if (event.translationY > 100 || event.velocityY > 500) {
                runOnJS(closePlayer)();
            } else {
                translateY.value = withTiming(0, { duration: 200 });
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    const progress = useSharedValue(0);
    const isSeeking = useSharedValue(false);
    const barWidth = useSharedValue(0);
    const pressed = useSharedValue(false);
    const durationSv = useSharedValue(0);

    useEffect(() => {
        durationSv.value = durationVal;
    }, [durationVal]);

    useEffect(() => {
        if (!isSeeking.value && durationVal > 0) {
            progress.value = currentTimeVal / durationVal;
        }
    }, [currentTimeVal, durationVal]);

    const animatedTextProps = useAnimatedProps(() => {
        const seconds = progress.value * durationSv.value;
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const text = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        return {
            text: text,
        } as any;
    });

    const seekGesture = Gesture.Pan()
        .onStart((e) => {
            isSeeking.value = true;
            pressed.value = true;
            if (barWidth.value > 0) {
                progress.value = Math.max(0, Math.min(1, e.x / barWidth.value));
            }
        })
        .onUpdate((e) => {
            if (barWidth.value > 0) {
                progress.value = Math.max(0, Math.min(1, e.x / barWidth.value));
            }
        })
        .onEnd(() => {
            const seekTime = progress.value * durationVal;
            runOnJS(seekTo)(seekTime);
            isSeeking.value = false;
            pressed.value = false;
        });

    const tapGesture = Gesture.Tap()
        .onStart((e) => {
            isSeeking.value = true;
            pressed.value = true;
            if (barWidth.value > 0) {
                progress.value = Math.max(0, Math.min(1, e.x / barWidth.value));
            }
        })
        .onEnd(() => {
            const seekTime = progress.value * durationVal;
            runOnJS(seekTo)(seekTime);
            isSeeking.value = false;
            pressed.value = false;
        });

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
    }));

    const barContainerStyle = useAnimatedStyle(() => ({
        height: withTiming(pressed.value ? 12 : 4, { duration: 200 }),
    }));

    const DisplayTime = () => {
        return (
            <View className="flex-row justify-between mt-2">
                <AnimatedTextInput
                    animatedProps={animatedTextProps}
                    className="text-xs text-white/50 p-0 font-variant-numeric-tabular-nums"
                    editable={false}
                    value={currentTime}
                    style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                />
                <Text className="text-xs text-white/50">{totalTime}</Text>
            </View>
        );
    };

    if (!currentTrack) return null;

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View
                style={[
                    animatedStyle,
                    {
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                        backgroundColor: 'black',
                        zIndex: 1000,
                    }
                ]}
            >
                <View className="flex-1 relative">
                    <LinearGradient
                        colors={[colors.bg, colors.secondary, '#000000']}
                        locations={[0, 0.6, 1]}
                        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                    />

                    <View className="flex-1 px-6 pt-12 pb-12 justify-between">
                        <View className="flex-row items-center justify-between mt-2 h-10 relative">
                            <Pressable className="p-2 active:opacity-50 z-10 w-12">
                                <Ionicons name="options-outline" size={24} color="white" />
                            </Pressable>

                            <Pressable
                                onPress={closePlayer}
                                className="absolute left-0 right-0 items-center justify-center -top-4 bottom-0 z-0 p-4"
                            >
                                <View className="w-12 h-1.5 bg-white/40 rounded-full" />
                            </Pressable>

                            <View className="flex-row gap-4 z-10">
                                <Pressable className="p-2 active:opacity-50">
                                    <Ionicons name="radio-outline" size={24} color="white" />
                                </Pressable>
                                <Pressable className="p-2 active:opacity-50">
                                    <Ionicons name="ellipsis-horizontal" size={24} color="white" />
                                </Pressable>
                            </View>
                        </View>

                        {showQueue ? (
                            // Queue View
                            <Animated.View 
                                entering={FadeIn.duration(200)}
                                exiting={FadeOut.duration(200)}
                                layout={Layout.duration(300)}
                                className="flex-1 my-3 -mx-2 overflow-hidden"
                            >
                                <View className="mb-2 px-2">
                                    <Text className="text-white/60 text-sm">
                                        {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
                                    </Text>
                                </View>
                                <View className="flex-1 h-0">
                                    <ScrollView 
                                        showsVerticalScrollIndicator={false}
                                        contentContainerStyle={{ paddingBottom: 20 }}
                                    >
                                        <View className="gap-1">
                                            {(() => {
                                                if (!currentTrack || tracks.length === 0) return null;
                                                const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
                                                const queueTracks = currentIndex === -1 ? tracks : [...tracks.slice(currentIndex), ...tracks.slice(0, currentIndex)];
                                                
                                                return queueTracks.map((track) => {
                                                    const isCurrentTrack = track.id === currentTrack?.id;
                                                    
                                                    return (
                                                        <Pressable
                                                            key={track.id}
                                                            onPress={() => playTrack(track)}
                                                            className={`flex-row items-center py-3 px-2 rounded-xl ${
                                                                isCurrentTrack ? 'bg-white/10' : 'active:bg-white/5'
                                                            }`}
                                                        >
                                                            <View className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                                                                isCurrentTrack ? 'border-white/60' : 'border-white/20'
                                                            }`}>
                                                                {isCurrentTrack && (
                                                                    <View className="w-2.5 h-2.5 rounded-full bg-white" />
                                                                )}
                                                            </View>

                                                            <View className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 mr-3">
                                                                {track.image ? (
                                                                    <Image
                                                                        source={{ uri: track.image }}
                                                                        className="w-full h-full"
                                                                        resizeMode="cover"
                                                                    />
                                                                ) : (
                                                                    <View className="w-full h-full items-center justify-center">
                                                                        <Ionicons name="musical-note" size={20} color="white" />
                                                                    </View>
                                                                )}
                                                            </View>

                                                            <View className="flex-1 justify-center">
                                                                <Text 
                                                                    className={`font-bold text-base ${
                                                                        isCurrentTrack ? 'text-white' : 'text-white/90'
                                                                    }`}
                                                                    numberOfLines={1}
                                                                >
                                                                    {track.title}
                                                                </Text>
                                                                <Text className="text-white/50 text-sm" numberOfLines={1}>
                                                                    {track.artist || "Unknown Artist"}
                                                                </Text>
                                                            </View>

                                                            <View className="ml-2">
                                                                <Ionicons name="reorder-three" size={24} color="rgba(255,255,255,0.4)" />
                                                            </View>
                                                        </Pressable>
                                                    );
                                                });
                                            })()}
                                        </View>
                                    </ScrollView>
                                </View>
                            </Animated.View>
                        ) : (
                            // Album Art View - Original spacing
                            <Animated.View 
                                entering={FadeIn.duration(200)}
                                exiting={FadeOut.duration(200)}
                                layout={Layout.duration(300)}
                                className="items-center justify-center flex-1 my-8"
                            >
                                <View className="absolute w-full aspect-square bg-purple-500/30 blur-2xl rounded-full scale-0.9" />
                                <View className="w-full aspect-square bg-white rounded-3xl overflow-hidden shadow-2xl elevation-10">
                                    {currentTrack.image ? (
                                        <Image
                                            source={{ uri: currentTrack.image }}
                                            className="w-full h-full"
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View className="w-full h-full bg-slate-800 items-center justify-center">
                                            <Ionicons name="musical-note" size={80} color="white" />
                                        </View>
                                    )}
                                </View>
                            </Animated.View>
                        )}

                        <Animated.View 
                            layout={Layout.duration(300)}
                            className={`flex-row justify-between items-center ${showQueue ? 'mb-3' : 'mb-6'}`}
                        >
                            <View className="flex-1 mr-4">
                                <Text className={`font-bold text-white mb-1 ${showQueue ? 'text-xl' : 'text-2xl'}`} numberOfLines={1}>
                                    {currentTrack.title}
                                </Text>
                                <Text className={`text-white/60 ${showQueue ? 'text-base' : 'text-lg'}`} numberOfLines={1}>
                                    {currentTrack.artist || "Unknown Artist"}
                                </Text>
                            </View>
                            <Pressable
                                className="active:opacity-50"
                                onPress={() => {
                                    if (currentTrack) {
                                        toggleFavoriteItem(
                                            currentTrack.id,
                                            'track',
                                            currentTrack.title,
                                            currentTrack.artist,
                                            currentTrack.image
                                        );
                                    }
                                }}
                            >
                                <Ionicons
                                    name={isCurrentTrackFavorite ? "heart" : "heart-outline"}
                                    size={showQueue ? 24 : 28}
                                    color={isCurrentTrackFavorite ? "#ef4444" : "white"}
                                />
                            </Pressable>
                        </Animated.View>

                        <Animated.View 
                            layout={Layout.duration(300)}
                            className={showQueue ? 'mb-4' : 'mb-6'}
                        >
                            <GestureDetector gesture={Gesture.Simultaneous(seekGesture, tapGesture)}>
                                <View
                                    className={showQueue ? 'py-2' : 'py-4'}
                                    onLayout={(e) => { barWidth.value = e.nativeEvent.layout.width; }}
                                >
                                    <Animated.View
                                        style={barContainerStyle}
                                        className="w-full bg-white/20 rounded-full overflow-hidden"
                                    >
                                        <Animated.View style={[progressStyle, { backgroundColor: "#FFFFFF" }]} className="h-full rounded-full" />
                                    </Animated.View>
                                </View>
                            </GestureDetector>
                            <DisplayTime />
                        </Animated.View>

                        <Animated.View 
                            layout={Layout.duration(300)}
                            className={`flex-row justify-between items-center ${showQueue ? 'mb-6' : 'mb-8'}`}
                        >
                            <Pressable className="active:opacity-50">
                                <Ionicons name="repeat" size={24} color="white" style={{ opacity: 0.7 }} />
                            </Pressable>

                            <View className={`flex-row items-center ${showQueue ? 'gap-6' : 'gap-8'}`}>
                                <Pressable onPress={() => playPrevious()} className="active:opacity-50">
                                    <Ionicons name="play-skip-back" size={showQueue ? 32 : 36} color="white" />
                                </Pressable>

                                <Pressable
                                    className={`items-center justify-center active:scale-95 ${showQueue ? 'w-16 h-16' : 'w-20 h-20'}`}
                                    onPress={() => togglePlayback()}
                                >
                                    <Ionicons
                                        name={isPlaying ? "pause-circle" : "play-circle"}
                                        size={showQueue ? 64 : 80}
                                        color="white"
                                    />
                                </Pressable>

                                <Pressable onPress={() => playNext()} className="active:opacity-50">
                                    <Ionicons name="play-skip-forward" size={showQueue ? 32 : 36} color="white" />
                                </Pressable>
                            </View>

                            <Pressable className="active:opacity-50">
                                <Ionicons name="shuffle" size={24} color="white" style={{ opacity: 0.7 }} />
                            </Pressable>
                        </Animated.View>

                        <View className="flex-row justify-between items-center px-4">
                            <Pressable className="active:opacity-50">
                                <Ionicons name="chatbubble-outline" size={24} color="white" style={{ opacity: 0.7 }} />
                            </Pressable>
                            <Pressable 
                                className="active:opacity-50"
                                onPress={() => $showPlayerQueue.set(!showQueue)}
                            >
                                <Ionicons 
                                    name="list" 
                                    size={24} 
                                    color={showQueue ? Colors.dark.accent : "white"} 
                                    style={{ opacity: showQueue ? 1 : 0.7 }} 
                                />
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Animated.View>
        </GestureDetector>
    );
};
