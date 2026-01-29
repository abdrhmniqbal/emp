import React, { useState, useLayoutEffect, useCallback, useMemo } from "react";
import { Text, ScrollView, View, Pressable, RefreshControl } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "heroui-native";
import { AlbumGrid, Album } from "@/components/library/album-grid";
import { ArtistGrid, Artist } from "@/components/library/artist-grid";
import { PlaylistList, Playlist } from "@/components/library/playlist-list";
import { FolderList, Folder } from "@/components/library/folder-list";
import { SongList } from "@/components/library/song-list";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";
import { playTrack, $tracks, Track } from "@/store/player-store";
import { handleScrollStart, handleScrollStop } from "@/store/ui-store";
import { useStore } from "@nanostores/react";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { startIndexing, $indexerState } from "@/utils/media-indexer";

const TABS = ["Songs", "Albums", "Artists", "Playlists", "Folders", "Favorites"] as const;
type TabType = typeof TABS[number];

export default function LibraryScreen() {
    const navigation = useNavigation();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("Songs");
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];
    const indexerState = useStore($indexerState);
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
                    <Pressable className="active:opacity-50" onPress={() => router.push("/settings")}>
                        <Ionicons name="settings-outline" size={24} color={theme.foreground} />
                    </Pressable>
                </View>
            ),
        });
    }, [navigation, theme, router]);

    const onRefresh = useCallback(() => {
        startIndexing(true);
    }, []);

    const albums = useMemo<Album[]>(() => {
        const albumMap = new Map<string, Album>();
        tracks.forEach(track => {
            const albumName = track.album || "Unknown Album";
            if (!albumMap.has(albumName)) {
                albumMap.set(albumName, {
                    id: albumName,
                    title: albumName,
                    artist: track.artist || "Unknown Artist",
                    image: track.image,
                });
            }
        });
        return Array.from(albumMap.values());
    }, [tracks]);

    const artists = useMemo<Artist[]>(() => {
        const artistMap = new Map<string, { name: string; count: number; image?: string }>();
        tracks.forEach(track => {
            const artistName = track.artist || "Unknown Artist";
            const existing = artistMap.get(artistName);
            if (existing) {
                existing.count++;
            } else {
                artistMap.set(artistName, { name: artistName, count: 1, image: track.image });
            }
        });
        return Array.from(artistMap.values()).map(a => ({
            id: a.name,
            name: a.name,
            trackCount: a.count,
            image: a.image,
        }));
    }, [tracks]);

    const playlists = useMemo<Playlist[]>(() => [], []);
    const folders = useMemo<Folder[]>(() => [], []);
    const favorites = useMemo(() => tracks.slice(0, 10), [tracks]);

    const currentData = useMemo(() => {
        switch (activeTab) {
            case "Albums": return albums;
            case "Artists": return artists;
            case "Playlists": return playlists;
            case "Folders": return folders;
            case "Favorites": return favorites;
            default: return tracks;
        }
    }, [activeTab, albums, artists, playlists, folders, favorites, tracks]);

    const handlePlayAll = useCallback(() => {
        const songsToPlay = activeTab === "Favorites" ? favorites : tracks;
        if (songsToPlay.length > 0) {
            playTrack(songsToPlay[0]);
        }
    }, [activeTab, favorites, tracks]);

    const handleShuffle = useCallback(() => {
        const songsToPlay = activeTab === "Favorites" ? favorites : tracks;
        if (songsToPlay.length > 0) {
            const randomIndex = Math.floor(Math.random() * songsToPlay.length);
            playTrack(songsToPlay[randomIndex]);
        }
    }, [activeTab, favorites, tracks]);

    const renderTabContent = useCallback(() => {
        switch (activeTab) {
            case "Albums":
                return <AlbumGrid data={albums} />;
            case "Artists":
                return <ArtistGrid data={artists} />;
            case "Playlists":
                return <PlaylistList data={playlists} />;
            case "Folders":
                return <FolderList data={folders} />;
            case "Favorites":
                return <SongList data={favorites} />;
            default:
                return <SongList data={tracks} />;
        }
    }, [activeTab, albums, artists, playlists, folders, favorites, tracks]);

    const showPlayButtons = activeTab === "Songs" || activeTab === "Favorites";

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentInsetAdjustmentBehavior="automatic"
                onScrollBeginDrag={handleScrollStart}
                onMomentumScrollEnd={handleScrollStop}
                onScrollEndDrag={handleScrollStop}
                refreshControl={
                    <RefreshControl refreshing={indexerState.isIndexing} onRefresh={onRefresh} tintColor={theme.accent} />
                }
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 24 }}
                    className="py-4 grow-0"
                >
                    {TABS.map((tab) => (
                        <Pressable
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            className="active:opacity-50 py-2"
                        >
                            <Text className={`text-2xl font-bold ${activeTab === tab ? 'text-foreground' : 'text-muted'}`}>
                                {tab}
                            </Text>
                            {activeTab === tab && (
                                <View className="h-1 bg-accent rounded-full mt-1" />
                            )}
                        </Pressable>
                    ))}
                </ScrollView>

                <Animated.View
                    key={activeTab}
                    entering={FadeInRight.duration(300)}
                    exiting={FadeOutLeft.duration(300)}
                    className="px-4 py-4"
                >
                    {showPlayButtons && (
                        <View className="flex-row gap-4 mb-6">
                            <Button
                                className="flex-1 h-14 rounded-xl bg-default flex-row items-center justify-center gap-2"
                                onPress={handlePlayAll}
                            >
                                <Ionicons name="play" size={20} color={theme.foreground} />
                                <Text className="text-lg font-bold text-foreground uppercase">Play</Text>
                            </Button>
                            <Button
                                className="flex-1 h-14 rounded-xl bg-default flex-row items-center justify-center gap-2"
                                onPress={handleShuffle}
                            >
                                <Ionicons name="shuffle" size={20} color={theme.foreground} />
                                <Text className="text-lg font-bold text-foreground uppercase">Shuffle</Text>
                            </Button>
                        </View>
                    )}
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-[20px] font-bold text-foreground">{currentData.length} {activeTab}</Text>
                        <Pressable className="flex-row items-center gap-1 active:opacity-50">
                            <Text className="text-[15px] font-medium text-muted">Recently Added</Text>
                            <Ionicons name="chevron-down" size={16} color={theme.muted} />
                        </Pressable>
                    </View>

                    {renderTabContent()}
                </Animated.View>

                <View style={{ height: 160 }} />
            </ScrollView>
        </View>
    );
}
