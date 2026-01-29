import React, { useState, useLayoutEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";
import { playTrack, $tracks, Track } from "@/store/player-store";
import { SearchResults } from "@/components/search/search-results";
import { RecentSearches, RecentSearchItem } from "@/components/search/recent-searches";
import { useStore } from "@nanostores/react";

export default function SearchInteractionScreen() {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];
    const navigation = useNavigation();
    const router = useRouter();
    const { query: initialQuery } = useLocalSearchParams<{ query?: string }>();
    const tracks = useStore($tracks);

    const [searchQuery, setSearchQuery] = useState(initialQuery || "");
    const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);

    const isSearching = searchQuery.trim().length > 0;

    const handleSearchChange = useCallback((text: string) => {
        setSearchQuery(text);
    }, []);

    const handleCancel = useCallback(() => {
        router.back();
    }, [router]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            title: 'Search',
            headerTitle: () => (
                <View className="flex-1 mr-2">
                    <View className="bg-default/50 rounded-xl flex-row items-center px-3 h-10 border border-default/50">
                        <Ionicons name="search-outline" size={18} color={theme.muted} />
                        <TextInput
                            autoFocus
                            placeholder="Artists, songs, lyrics..."
                            placeholderTextColor={theme.muted}
                            value={searchQuery}
                            onChangeText={handleSearchChange}
                            className="flex-1 text-[16px] text-foreground font-medium"
                            selectionColor={theme.accent}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <Pressable onPress={() => setSearchQuery("")} className="p-1">
                                <Ionicons name="close-circle" size={18} color={theme.muted} />
                            </Pressable>
                        )}
                    </View>
                </View>
            ),
            headerBackVisible: false,
            headerLeft: () => null,
            headerRight: () => (
                <Pressable onPress={handleCancel} className="mr-1 active:opacity-50">
                    <Text className="text-[17px] font-semibold text-muted">Cancel</Text>
                </Pressable>
            ),
            headerStyle: {
                backgroundColor: theme.background,
            },
            headerShadowVisible: false,
        });
    }, [navigation, theme, searchQuery, handleSearchChange, handleCancel]);

    const handleClearRecentSearches = useCallback(() => {
        setRecentSearches([]);
    }, []);

    const handleRecentItemPress = useCallback((item: RecentSearchItem) => {
        setSearchQuery(item.title);
    }, []);

    const handleRemoveRecentItem = useCallback((id: string) => {
        setRecentSearches(prev => prev.filter(item => item.id !== id));
    }, []);

    const handleSongPress = useCallback((track: Track) => {
        const newRecentItem: RecentSearchItem = {
            id: track.id,
            title: track.title,
            subtitle: track.artist || "Unknown Artist",
            type: 'song',
        };
        setRecentSearches(prev => {
            const filtered = prev.filter(item => item.id !== track.id);
            return [newRecentItem, ...filtered].slice(0, 10);
        });
        playTrack(track);
    }, []);

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 160 }}
                keyboardShouldPersistTaps="handled"
            >
                {isSearching ? (
                    <SearchResults
                        tracks={tracks}
                        query={searchQuery}
                    />
                ) : (
                    <RecentSearches
                        searches={recentSearches}
                        onClear={handleClearRecentSearches}
                        onItemPress={handleRecentItemPress}
                        onRemoveItem={handleRemoveRecentItem}
                    />
                )}
            </ScrollView>
        </View>
    );
}
