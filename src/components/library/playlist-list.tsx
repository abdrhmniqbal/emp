import React, { useCallback } from "react";
import { View } from "react-native";
import { LegendList, LegendListRenderItemProps } from "@legendapp/list";
import { Ionicons } from "@expo/vector-icons";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemAction } from "@/components/item";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { EmptyState } from "@/components/empty-state";

export interface Playlist {
    id: string;
    title: string;
    songCount: number;
    image?: string;
}

interface PlaylistListProps {
    data: Playlist[];
    onPlaylistPress?: (playlist: Playlist) => void;
    onCreatePlaylist?: () => void;
}

const GRID_ITEMS = [1, 2, 3, 4] as const;

export const PlaylistList: React.FC<PlaylistListProps> = ({
    data,
    onPlaylistPress,
    onCreatePlaylist
}) => {
    const theme = useThemeColors();

    const handlePress = useCallback((playlist: Playlist) => {
        onPlaylistPress?.(playlist);
    }, [onPlaylistPress]);

    const handleCreate = useCallback(() => {
        onCreatePlaylist?.();
    }, [onCreatePlaylist]);

    const formatSongCount = (count: number) =>
        `${count} ${count === 1 ? 'song' : 'songs'}`;

    const renderItem = useCallback(({ item }: LegendListRenderItemProps<Playlist>) => (
        <Item
            onPress={() => handlePress(item)}
        >
            <ItemImage className="bg-default items-center justify-center overflow-hidden p-1">
                {item.image ? (
                    <View className="w-full h-full rounded-lg overflow-hidden">
                        <View className="w-full h-full bg-default" />
                    </View>
                ) : (
                    <View className="flex-row flex-wrap w-full h-full">
                        {GRID_ITEMS.map((i) => (
                            <View key={i} className="w-1/2 h-1/2 p-px">
                                <View className="w-full h-full bg-muted/20 rounded-sm items-center justify-center">
                                    <Ionicons name="musical-note" size={10} color={theme.muted} style={{ opacity: 0.5 }} />
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ItemImage>
            <ItemContent>
                <ItemTitle>{item.title}</ItemTitle>
                <ItemDescription>{formatSongCount(item.songCount)}</ItemDescription>
            </ItemContent>
            <ItemAction>
                <Ionicons name="chevron-forward" size={24} color={theme.muted} />
            </ItemAction>
        </Item>
    ), [handlePress, theme.muted]);

    // Combine create button and playlists into a single list
    const listData = [
        { id: 'create', isCreateButton: true },
        ...data
    ];

    const renderListItem = useCallback(({ item }: LegendListRenderItemProps<any>) => {
        if (item.isCreateButton) {
            return (
                <Item onPress={handleCreate}>
                    <ItemImage className="bg-default items-center justify-center">
                        <Ionicons name="add" size={32} color={theme.foreground} />
                    </ItemImage>
                    <ItemContent>
                        <ItemTitle>New Playlist</ItemTitle>
                    </ItemContent>
                </Item>
            );
        }
        return renderItem({ item } as LegendListRenderItemProps<Playlist>);
    }, [handleCreate, renderItem, theme.foreground]);

    if (data.length === 0) {
        return (
            <LegendList
                data={[{ id: 'create', isCreateButton: true }]}
                renderItem={renderListItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ gap: 8 }}
                recycleItems={true}
                ListEmptyComponent={
                    <EmptyState icon="list" title="No Playlists" message="Create your first playlist to organize your music." />
                }
                estimatedItemSize={72}
                drawDistance={500}
                initialContainerPoolRatio={1}
                style={{ flex: 1 }}
            />
        );
    }

    return (
        <LegendList
            data={listData}
            renderItem={renderListItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 8 }}
            recycleItems={true}
            waitForInitialLayout={false}
            maintainVisibleContentPosition
            estimatedItemSize={72}
            drawDistance={500}
            initialContainerPoolRatio={1}
            style={{ flex: 1 }}
        />
    );
};
