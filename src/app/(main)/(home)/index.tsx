import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemRank } from "@/components/item";
import { playTrack, $tracks, loadTracks, Track } from "@/store/player-store";
import { useStore } from "@nanostores/react";
import { SectionTitle } from "@/components/section-title";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";
import React, { useState, useLayoutEffect, useCallback, useMemo } from "react";
import { useNavigation, useRouter } from "expo-router";
import { Pressable, View, ScrollView, RefreshControl } from "react-native";
import { handleScrollStart, handleScrollStop } from "@/store/ui-store";
import { Ionicons } from "@expo/vector-icons";

const RECENTLY_PLAYED_LIMIT = 8;
const TOP_SONGS_LIMIT = 25;
const CHUNK_SIZE = 5;

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
};

export default function HomeScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];
    const [refreshing, setRefreshing] = useState(false);
    const tracks = useStore($tracks);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View className="flex-row gap-4 mr-1">
                    <Pressable
                        onPress={() => router.push("/search-interaction")}
                        className="active:opacity-50"
                    >
                        <Ionicons name="search-outline" size={24} color={theme.foreground} />
                    </Pressable>
                    <Pressable onPress={() => router.push("/settings")} className="active:opacity-50">
                        <Ionicons name="settings-outline" size={24} color={theme.foreground} />
                    </Pressable>
                </View>
            ),
        });
    }, [navigation, theme, router]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadTracks(true);
        setRefreshing(false);
    }, []);

    const recentlyPlayedTracks = useMemo(() =>
        tracks.slice(0, RECENTLY_PLAYED_LIMIT),
        [tracks]
    );

    const topSongsChunks = useMemo(() =>
        chunkArray(tracks.slice(0, TOP_SONGS_LIMIT), CHUNK_SIZE),
        [tracks]
    );

    const renderRecentlyPlayedItem = useCallback((item: Track) => (
        <Item
            key={item.id}
            variant="grid"
            onPress={() => playTrack(item)}
        >
            <ItemImage icon="musical-note" image={item.image} />
            <ItemContent>
                <ItemTitle>{item.title}</ItemTitle>
                <ItemDescription>{item.artist || "Unknown Artist"}</ItemDescription>
            </ItemContent>
        </Item>
    ), []);

    const renderTopSongsChunk = useCallback((chunk: Track[], chunkIndex: number) => (
        <View key={`chunk-${chunkIndex}`} className="w-[300px]">
            {chunk.map((music, index) => (
                <Item
                    key={music.id}
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
    ), []);

    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerStyle={{ paddingBottom: 160 }}
            contentInsetAdjustmentBehavior="automatic"
            onScrollBeginDrag={handleScrollStart}
            onMomentumScrollEnd={handleScrollStop}
            onScrollEndDrag={handleScrollStop}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
            }
        >
            <View className="pt-6">
                <SectionTitle
                    title="Recently Played"
                    className="px-4"
                    onViewMore={() => router.push("/(main)/(home)/recently-played")}
                />

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
                    className="mb-8"
                >
                    {recentlyPlayedTracks.map(renderRecentlyPlayedItem)}
                </ScrollView>

                <SectionTitle
                    title="Top Songs"
                    className="px-4"
                    onViewMore={() => router.push("/(main)/(home)/top-songs")}
                />

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 24 }}
                    className="mb-8"
                >
                    {topSongsChunks.map(renderTopSongsChunk)}
                </ScrollView>
            </View>
        </ScrollView>
    );
}
