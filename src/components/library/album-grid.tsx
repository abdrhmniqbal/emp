import React, { useCallback } from "react";
import { View, ScrollView, Dimensions } from "react-native";
import { LegendList, LegendListRenderItemProps } from "@legendapp/list";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription } from "@/components/item";
import { EmptyState } from "@/components/empty-state";

export interface Album {
    id: string;
    title: string;
    artist: string;
    albumArtist?: string;
    image?: string;
    trackCount: number;
    year: number;
    dateAdded: number;
}

interface AlbumGridProps {
    data: Album[];
    onAlbumPress?: (album: Album) => void;
    horizontal?: boolean;
    containerClassName?: string;
}

const GAP = 16;
const NUM_COLUMNS = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;
// Calculate item width: (screen width - horizontal padding - gaps between items) / number of columns
const HORIZONTAL_PADDING = 32; // 16px on each side
const ITEM_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING - (GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

export const AlbumGrid: React.FC<AlbumGridProps> = ({ data, onAlbumPress, horizontal, containerClassName = "" }) => {
    const handlePress = useCallback((album: Album) => {
        onAlbumPress?.(album);
    }, [onAlbumPress]);

    const renderItem = useCallback(({ item }: LegendListRenderItemProps<Album>) => (
        <Item
            variant="grid"
            style={{ width: ITEM_WIDTH }}
            onPress={() => handlePress(item)}
        >
            <ItemImage icon="disc" image={item.image} className="w-full aspect-square rounded-md" />
            <ItemContent className="mt-1">
                <ItemTitle className="text-sm normal-case" numberOfLines={1}>{item.title}</ItemTitle>
                <ItemDescription numberOfLines={1}>
                    {item.albumArtist || item.artist}{item.trackCount ? ` • ${item.trackCount} tracks` : ""}
                </ItemDescription>
            </ItemContent>
        </Item>
    ), [handlePress]);

    if (data.length === 0) {
        return <EmptyState icon="disc" title="No Albums" message="Albums you add to your library will appear here." />;
    }

    if (horizontal) {
        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 16 }}
                className={containerClassName}
            >
                {data.map((album) => (
                    <View key={album.id} className="w-36">
                        <Item
                            variant="grid"
                            onPress={() => handlePress(album)}
                        >
                            <ItemImage icon="disc" image={album.image} className="w-full aspect-square rounded-md" />
                            <ItemContent className="mt-1">
                                <ItemTitle className="text-sm normal-case" numberOfLines={1}>{album.title}</ItemTitle>
                                <ItemDescription numberOfLines={1}>
                                    {album.albumArtist || album.artist}{album.trackCount ? ` • ${album.trackCount} tracks` : ""}
                                </ItemDescription>
                            </ItemContent>
                        </Item>
                    </View>
                ))}
            </ScrollView>
        );
    }

    return (
        <LegendList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={{ gap: GAP }}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            style={{ flex: 1 }}
            className={containerClassName}
            recycleItems={true}
            waitForInitialLayout={false}
            maintainVisibleContentPosition
            estimatedItemSize={200}
            drawDistance={400}
            initialContainerPoolRatio={1}
        />
    );
};
