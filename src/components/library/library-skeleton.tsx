import React from "react";
import { View, Animated, Dimensions } from "react-native";
import { useUniwind } from "uniwind";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 16;

interface LibrarySkeletonProps {
    type: 'songs' | 'albums' | 'artists';
    itemCount?: number;
}

const ShimmerView = ({ className }: { className?: string }) => {
    const shimmerAnim = React.useRef(new Animated.Value(0)).current;
    const { theme } = useUniwind();
    const isDark = theme === 'dark';

    React.useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
    });

    return (
        <View className={`overflow-hidden ${className}`}>
            <Animated.View
                className="absolute inset-0"
                style={{
                    transform: [{ translateX }],
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                }}
            />
        </View>
    );
};

const SongSkeleton = () => (
    <View className="flex-row items-center gap-3 py-2">
        <View className="w-12 h-12 rounded-md bg-default">
            <ShimmerView className="w-full h-full" />
        </View>
        <View className="flex-1 gap-2">
            <View className="h-4 w-3/4 rounded bg-default">
                <ShimmerView className="w-full h-full" />
            </View>
            <View className="h-3 w-1/2 rounded bg-default">
                <ShimmerView className="w-full h-full" />
            </View>
        </View>
        <View className="w-8 h-8 rounded bg-default">
            <ShimmerView className="w-full h-full" />
        </View>
    </View>
);

const AlbumSkeleton = () => {
    const ITEM_WIDTH = (SCREEN_WIDTH - 32 - GAP) / 2;
    return (
        <View style={{ width: ITEM_WIDTH }}>
            <View className="w-full aspect-square rounded-md bg-default">
                <ShimmerView className="w-full h-full" />
            </View>
            <View className="mt-2 h-4 w-full rounded bg-default">
                <ShimmerView className="w-full h-full" />
            </View>
            <View className="mt-1 h-3 w-2/3 rounded bg-default">
                <ShimmerView className="w-full h-full" />
            </View>
        </View>
    );
};

const ArtistSkeleton = () => {
    const ITEM_WIDTH = (SCREEN_WIDTH - 32 - GAP * 2) / 3;
    return (
        <View style={{ width: ITEM_WIDTH }} className="items-center">
            <View className="w-full aspect-square rounded-full bg-default">
                <ShimmerView className="w-full h-full" />
            </View>
            <View className="mt-2 h-4 w-full rounded bg-default">
                <ShimmerView className="w-full h-full" />
            </View>
            <View className="mt-1 h-3 w-2/3 rounded bg-default">
                <ShimmerView className="w-full h-full" />
            </View>
        </View>
    );
};

export const LibrarySkeleton: React.FC<LibrarySkeletonProps> = ({
    type,
    itemCount = 6
}) => {
    const renderSkeleton = () => {
        switch (type) {
            case 'songs':
                return (
                    <View className="px-4" style={{ gap: 8 }}>
                        {Array.from({ length: itemCount }).map((_, i) => (
                            <SongSkeleton key={i} />
                        ))}
                    </View>
                );
            case 'albums':
                return (
                    <View
                        className="px-4 flex-row flex-wrap"
                        style={{ gap: GAP }}
                    >
                        {Array.from({ length: itemCount }).map((_, i) => (
                            <AlbumSkeleton key={i} />
                        ))}
                    </View>
                );
            case 'artists':
                return (
                    <View
                        className="px-4 flex-row flex-wrap"
                        style={{ gap: GAP }}
                    >
                        {Array.from({ length: itemCount }).map((_, i) => (
                            <ArtistSkeleton key={i} />
                        ))}
                    </View>
                );
        }
    };

    return (
        <View className="py-4">
            {renderSkeleton()}
        </View>
    );
};
