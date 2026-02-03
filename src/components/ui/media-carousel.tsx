import React, { ReactNode } from "react";
import { ScrollView, View, StyleProp, ViewStyle } from "react-native";
import { EmptyState } from "@/components/empty-state";

interface EmptyStateConfig {
    icon: string;
    title: string;
    message: string;
}

interface MediaCarouselProps<T> {
    data: T[];
    renderItem: (item: T, index: number) => ReactNode;
    keyExtractor: (item: T, index: number) => string;
    emptyState?: EmptyStateConfig;
    gap?: number;
    paddingHorizontal?: number;
    className?: string;
    contentContainerStyle?: StyleProp<ViewStyle>;
}

export function MediaCarousel<T>({
    data,
    renderItem,
    keyExtractor,
    emptyState,
    gap = 16,
    paddingHorizontal = 16,
    className = "mb-8",
    contentContainerStyle,
}: MediaCarouselProps<T>) {
    if (data.length === 0 && emptyState) {
        return (
            <EmptyState
                icon={emptyState.icon as any}
                title={emptyState.title}
                message={emptyState.message}
                className={`${className} py-8`}
            />
        );
    }

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
                { paddingHorizontal, gap },
                contentContainerStyle,
            ]}
            className={className}
        >
            {data.map((item, index) => (
                <View key={keyExtractor(item, index)}>
                    {renderItem(item, index)}
                </View>
            ))}
        </ScrollView>
    );
}
