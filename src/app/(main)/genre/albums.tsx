import { View, ScrollView, Pressable, RefreshControl, Text } from "react-native";
import { useState, useCallback, useEffect } from "react";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/empty-state";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { Ionicons } from "@expo/vector-icons";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/store/ui-store";
import { useStore } from "@nanostores/react";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { startIndexing, $indexerState } from "@/features/indexer";
import { getAlbumsByGenre, AlbumInfo } from "@/db/operations";
import { AlbumGrid, Album } from "@/components/library/album-grid";

export default function GenreAlbumsScreen() {
    const { name } = useLocalSearchParams<{ name: string }>();
    const navigation = useNavigation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const indexerState = useStore($indexerState);
    const theme = useThemeColors();

    const genreName = decodeURIComponent(name || "");

    const [albums, setAlbums] = useState<AlbumInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const loadAlbums = useCallback(async () => {
        setIsLoading(true);
        try {
            const albumList = await getAlbumsByGenre(genreName);
            setAlbums(albumList);
        } catch (e) {
            setAlbums([]);
        } finally {
            setIsLoading(false);
        }
    }, [genreName]);

    useEffect(() => {
        loadAlbums();
    }, [loadAlbums]);

    const handleRefresh = useCallback(async () => {
        startIndexing(true);
        await loadAlbums();
    }, [loadAlbums]);

    const handleAlbumPress = (album: Album) => {
        router.push(`/album/${encodeURIComponent(album.title)}`);
    };

    // Transform AlbumInfo to Album format
    const albumData: Album[] = [...albums]
        .sort((a, b) => (b.year || 0) - (a.year || 0))
        .map((album, index) => ({
            id: `${album.name}-${index}`,
            title: album.name,
            artist: album.artist || "Unknown Artist",
            albumArtist: album.artist,
            image: album.image,
            trackCount: album.trackCount,
            year: album.year || 0,
            dateAdded: 0,
        }));

    return (
        <View className="flex-1 bg-background">
            <View
                className="absolute top-0 left-0 right-0 z-50 flex-row items-center justify-between px-4 bg-background"
                style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
            >
                <Pressable
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full items-center justify-center active:opacity-50"
                >
                    <Ionicons name="chevron-back" size={24} color={theme.foreground} />
                </Pressable>

                <Text
                    className="text-lg font-bold text-foreground flex-1 text-center mx-2"
                    numberOfLines={1}
                >
                    {genreName} Albums
                </Text>

                <Pressable
                    onPress={() => router.push("/settings")}
                    className="w-10 h-10 rounded-full items-center justify-center active:opacity-50"
                >
                    <Ionicons name="ellipsis-horizontal" size={22} color={theme.foreground} />
                </Pressable>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: insets.top + 60,
                    paddingBottom: 200
                }}
                onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
                onScrollBeginDrag={handleScrollStart}
                onMomentumScrollEnd={handleScrollStop}
                onScrollEndDrag={handleScrollStop}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={indexerState.isIndexing || isLoading}
                        onRefresh={handleRefresh}
                        tintColor={theme.accent}
                    />
                }
            >
                <Animated.View
                    entering={FadeInRight.duration(300)}
                    exiting={FadeOutLeft.duration(300)}
                    className="px-6 py-4"
                >
                    {albumData.length === 0 ? (
                        <EmptyState
                            icon="disc-outline"
                            title="No albums found"
                            message={`No albums available in ${genreName}`}
                            className="mt-12"
                        />
                    ) : (
                        <>
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-lg font-bold text-foreground">
                                    {albumData.length} Albums
                                </Text>
                                <Pressable className="flex-row items-center gap-1 active:opacity-50">
                                    <Text className="text-sm font-medium text-muted">Year</Text>
                                    <Ionicons name="arrow-down" size={14} color={theme.muted} />
                                </Pressable>
                            </View>
                            <AlbumGrid
                                data={albumData}
                                onAlbumPress={handleAlbumPress}
                                scrollEnabled={false}
                            />
                        </>
                    )}
                </Animated.View>
            </ScrollView>
        </View>
    );
}
