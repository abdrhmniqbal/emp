import { View, Text, FlatList, RefreshControl } from "react-native";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemAction } from "@/components/item";
import { playTrack, Track, loadTracks } from "@/store/player-store";
import { Colors } from "@/constants/colors";
import { Button } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { handleScrollStart, handleScrollStop } from "@/store/ui-store";
import { useState, useCallback } from "react";
import { getHistory } from "@/utils/database";
import { useFocusEffect } from "expo-router";
import { useUniwind } from "uniwind";

export default function RecentlyPlayedScreen() {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === "dark" ? "dark" : "light"];
    const [history, setHistory] = useState<Track[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHistory = useCallback(() => {
        const data = getHistory();
        setHistory(data);
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadTracks(true);
        fetchHistory();
        setRefreshing(false);
    }, [fetchHistory]);

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [fetchHistory])
    );

    const handlePlayFirst = useCallback(() => {
        if (history.length > 0) {
            playTrack(history[0]);
        }
    }, [history]);

    const handleShuffle = useCallback(() => {
        if (history.length > 0) {
            const randomIndex = Math.floor(Math.random() * history.length);
            playTrack(history[randomIndex]);
        }
    }, [history]);

    const renderItem = useCallback(({ item }: { item: Track }) => (
        <Item onPress={() => playTrack(item)}>
            <ItemImage icon="musical-note" image={item.image} />
            <ItemContent>
                <ItemTitle>{item.title}</ItemTitle>
                <ItemDescription>{item.artist || "Unknown Artist"}</ItemDescription>
            </ItemContent>
            <ItemAction>
                <Ionicons name="ellipsis-horizontal" size={24} color={theme.muted} />
            </ItemAction>
        </Item>
    ), [theme.muted]);

    const keyExtractor = useCallback((item: Track) => item.id, []);

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row px-4 py-4 gap-4">
                <Button
                    className="flex-1 h-14 rounded-xl bg-default flex-row items-center justify-center gap-2"
                    onPress={handlePlayFirst}
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

            <FlatList
                data={history}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 160 }}
                className="flex-1"
                onScrollBeginDrag={handleScrollStart}
                onMomentumScrollEnd={handleScrollStop}
                onScrollEndDrag={handleScrollStop}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
                }
            />
        </View>
    );
}
