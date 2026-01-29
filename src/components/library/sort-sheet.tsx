import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";

export interface SortOption<T extends string> {
    field: T;
    label: string;
}

interface SortSheetProps<T extends string> {
    visible: boolean;
    onClose: () => void;
    options: SortOption<T>[];
    currentField: T;
    currentOrder: 'asc' | 'desc';
    onSelect: (field: T, order?: 'asc' | 'desc') => void;
    title?: string;
}

export function SortSheet<T extends string>({
    visible,
    onClose,
    options,
    currentField,
    currentOrder,
    onSelect,
    title = "Sort By"
}: SortSheetProps<T>) {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];
    const translateY = useSharedValue(0);

    const closeSheet = useCallback(() => {
        translateY.value = 0;
        onClose();
    }, [onClose, translateY]);

    const dragGesture = Gesture.Pan()
        .onStart(() => {
            // Optional: Haptic feedback here
        })
        .onUpdate((event) => {
            if (event.translationY > 0) {
                translateY.value = event.translationY;
            }
        })
        .onEnd((event) => {
            if (event.translationY > 100 || event.velocityY > 500) {
                translateY.value = withTiming(600, { duration: 200 }, () => {
                    runOnJS(closeSheet)();
                });
            } else {
                translateY.value = withTiming(0, { duration: 200 });
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const handleSelect = (field: T) => {
        if (currentField === field) {
            // Toggle order
            const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
            onSelect(field, newOrder);
        } else {
            // New field, default to asc
            onSelect(field, 'asc');
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={closeSheet}
        >
            <View style={{ flex: 1 }}>
                <Animated.View
                    entering={FadeIn}
                    exiting={FadeOut}
                    className="absolute inset-0 bg-black/50"
                >
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={closeSheet}
                    />
                </Animated.View>

                <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: -20 }}>
                    <GestureDetector gesture={dragGesture}>
                        <Animated.View
                            entering={SlideInDown.duration(300)}
                            exiting={SlideOutDown.duration(250)}
                            style={[animatedStyle]}
                        >
                            <View className="bg-surface-secondary rounded-t-3xl p-6 pb-20">
                                <View className="h-6 -mt-4 mb-2 items-center justify-center">
                                    <View className="w-12 h-1.5 bg-divider rounded-full" />
                                </View>

                                <Text className="text-xl font-bold text-foreground mb-4">{title}</Text>
                                <View className="gap-1">
                                    {options.map((option) => (
                                        <TouchableOpacity
                                            key={option.field}
                                            className="flex-row items-center justify-between py-4"
                                            onPress={() => handleSelect(option.field)}
                                        >
                                            <Text className={`text-xl ${currentField === option.field ? 'text-accent font-bold' : 'text-foreground font-medium'}`}>
                                                {option.label}
                                            </Text>

                                            {currentField === option.field && (
                                                <View className=" p-2 rounded-full">
                                                    <Ionicons
                                                        name={currentOrder === 'asc' ? "arrow-up" : "arrow-down"}
                                                        size={24}
                                                        color={theme.accent}
                                                    />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </Animated.View>
                    </GestureDetector>
                </View>
            </View>
        </Modal>
    );
}

