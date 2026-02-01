import { useState, useCallback, useEffect, useMemo } from "react";
import { View, ScrollView, RefreshControl, Image, Pressable, Text } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";
import { $tracks, playTrack, Track } from "@/store/player-store";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/store/ui-store";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemRank } from "@/components/item";
import { EmptyState } from "@/components/empty-state";
import { SectionTitle } from "@/components/section-title";
import { getAlbumsByGenre, AlbumInfo } from "@/db/operations";
import { db } from "@/db/client";
import { genres, trackGenres } from "@/db/schema";
import { eq } from "drizzle-orm";
import { useStore } from "@nanostores/react";
import { startIndexing, $indexerState } from "@/features/indexer";

const CHUNK_SIZE = 5;
const PREVIEW_LIMIT = 25;

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
};

export default function GenreDetailsScreen() {
    const { name } = useLocalSearchParams<{ name: string }>();
    const navigation = useNavigation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const allTracks = useStore($tracks);
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === "dark" ? "dark" : "light"];
    const indexerState = useStore($indexerState);

    const genreName = decodeURIComponent(name || "");

    const [genreTrackIds, setGenreTrackIds] = useState<Set<string>>(new Set());
    const [albums, setAlbums] = useState<AlbumInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadGenreData = useCallback(async () => {
        setIsLoading(true);
        try {
            const genreRecord = await db.query.genres.findFirst({
                where: eq(genres.name, genreName),
            });

            if (genreRecord) {
                const trackGenreLinks = await db.query.trackGenres.findMany({
                    where: eq(trackGenres.genreId, genreRecord.id),
                });
                setGenreTrackIds(new Set(trackGenreLinks.map(tg => tg.trackId)));
            } else {
                setGenreTrackIds(new Set());
            }

            const albumList = await getAlbumsByGenre(genreName);
            setAlbums(albumList);
        } catch (e) {
            console.warn('Failed to load genre data:', e);
            setGenreTrackIds(new Set());
        } finally {
            setIsLoading(false);
        }
    }, [genreName]);

    useEffect(() => {
        loadGenreData();
    }, [loadGenreData]);

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const allTopSongs = useMemo(() => {
        if (genreTrackIds.size === 0) return [];
        
        return allTracks
            .filter(t => genreTrackIds.has(t.id) && !t.isDeleted)
            .sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    }, [allTracks, genreTrackIds]);

    const topSongs = allTopSongs.slice(0, PREVIEW_LIMIT);

    const onRefresh = useCallback(async () => {
        startIndexing(true);
        await loadGenreData();
    }, [loadGenreData]);

    const topSongsChunks = chunkArray(topSongs, CHUNK_SIZE);

    const renderTopSongsChunk = (chunk: Track[], chunkIndex: number) => (
        <View key={`chunk-${chunkIndex}`} className="w-75">
            {chunk.map((music, index) => (
                <Item
                    key={`${music.id}-${chunkIndex}-${index}`}
                    onPress={() => playTrack(music)}
                >
                    <ItemImage icon="musical-note" image={music.image} />
                    <ItemRank>{chunkIndex * CHUNK_SIZE + index + 1}</ItemRank>
                    <ItemContent>
                        <ItemTitle>{music.title}</ItemTitle>
                        <ItemDescription>{music.artist || "Unknown Artist"}</ItemDescription>
                    </ItemContent>
                </Item>
            ))}
        </View>
    );

    const renderAlbumItem = (album: AlbumInfo, index: number) => (
        <Pressable
            key={`${album.name}-${index}`}
            onPress={() => router.push(`/album/${encodeURIComponent(album.name)}`)}
            className="mr-4 active:opacity-70"
        >
            <View className="w-36 h-36 rounded-lg overflow-hidden bg-surface-secondary mb-2">
                {album.image ? (
                    <Image
                        source={{ uri: album.image }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="w-full h-full items-center justify-center">
                        <Ionicons name="disc" size={48} color={theme.muted} />
                    </View>
                )}
            </View>
            <Text className="text-sm font-bold text-foreground w-36" numberOfLines={1}>
                {album.name}
            </Text>
            <Text className="text-xs text-muted w-36" numberOfLines={1}>
                {album.artist || "Unknown Artist"} · {album.trackCount} songs
            </Text>
        </Pressable>
    );

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
                    {genreName}
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
                        onRefresh={onRefresh} 
                        tintColor={theme.accent} 
                    />
                }
            >
                <SectionTitle 
                    title="Top Songs" 
                    className="px-4"
                    onViewMore={() => router.push(`/genre/top-songs?name=${encodeURIComponent(genreName)}`)}
                />

                {topSongs.length > 0 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 24 }}
                        className="mb-8"
                    >
                        {topSongsChunks.map(renderTopSongsChunk)}
                    </ScrollView>
                ) : (
                    <EmptyState
                        icon="musical-notes-outline"
                        title="No top songs"
                        message={`Play some ${genreName} music to see top songs!`}
                        className="mb-8 py-8"
                    />
                )}

                <SectionTitle 
                    title="Recommended Albums" 
                    className="px-4"
                    onViewMore={() => router.push(`/genre/albums?name=${encodeURIComponent(genreName)}`)}
                />

                {albums.length > 0 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                        className="mb-8"
                    >
                        {albums
                            .sort((a, b) => (b.year || 0) - (a.year || 0))
                            .slice(0, 8)
                            .map(renderAlbumItem)}
                    </ScrollView>
                ) : (
                    <EmptyState
                        icon="disc-outline"
                        title="No albums found"
                        message={`No albums available in ${genreName}`}
                        className="mb-8 py-8"
                    />
                )}
            </ScrollView>
        </View>
    );
}
