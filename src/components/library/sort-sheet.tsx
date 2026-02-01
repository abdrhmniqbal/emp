import React, { useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal } from "react-native";
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
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
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

    useEffect(() => {
        if (!visible) {
            translateY.value = 0;
        }
    }, [visible, translateY]);

    const closeSheet = useCallback(() => {
        translateY.value = 0;
        onClose();
    }, [onClose, translateY]);

    const dragGesture = Gesture.Pan()
        .activeOffsetY([-10, 10])
        .failOffsetX([-100, 100])
        .onUpdate((event) => {
            if (event.translationY > 0) {
                translateY.value = event.translationY;
            }
        })
        .onEnd((event) => {
            if (event.translationY > 100 || event.velocityY > 500) {
                translateY.value = withTiming(400, { duration: 200 }, () => {
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
            const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
            onSelect(field, newOrder);
        } else {
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
            <GestureHandlerRootView className="flex-1">
                <View className="flex-1">
                    <Animated.View
                        entering={FadeIn}
                        exiting={FadeOut}
                        className="absolute inset-0 bg-black/50"
                    >
                        <TouchableOpacity
                            className="flex-1"
                            activeOpacity={1}
                            onPress={closeSheet}
                        />
                    </Animated.View>

                    <GestureDetector gesture={dragGesture}>
                        <Animated.View
                            entering={SlideInDown.duration(300)}
                            exiting={SlideOutDown.duration(250)}
                            className="absolute bottom-0 left-0 right-0"
                            style={animatedStyle}
                        >
                            <View className="bg-surface-secondary rounded-t-3xl p-6">
                                <View className="h-8 -mt-4 mb-2 items-center justify-center">
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
                                                <View className="p-2 rounded-full">
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
                                <View className="h-8" />
                            </View>
                        </Animated.View>
                    </GestureDetector>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
}
