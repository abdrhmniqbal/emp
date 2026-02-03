import React, { useCallback } from "react";
import { Dimensions } from "react-native";
import { LegendList, LegendListRenderItemProps } from "@legendapp/list";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription } from "@/components/item";
import { EmptyState } from "@/components/empty-state";

export interface Artist {
    id: string;
    name: string;
    trackCount: number;
    image?: string;
    dateAdded: number;
}

interface ArtistGridProps {
    data: Artist[];
    onArtistPress?: (artist: Artist) => void;
}

const GAP = 16;
const NUM_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get('window').width;
// Calculate item width: (screen width - horizontal padding - gaps between items) / number of columns
const HORIZONTAL_PADDING = 32; // 16px on each side
const ITEM_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING - (GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

export const ArtistGrid: React.FC<ArtistGridProps> = ({ data, onArtistPress }) => {
    const handlePress = useCallback((artist: Artist) => {
        onArtistPress?.(artist);
    }, [onArtistPress]);

    const formatTrackCount = (count: number) =>
        `${count} ${count === 1 ? 'track' : 'tracks'}`;

    const renderItem = useCallback(({ item }: LegendListRenderItemProps<Artist>) => (
        <Item
            variant="grid"
            style={{ width: ITEM_WIDTH }}
            onPress={() => handlePress(item)}
        >
            <ItemImage icon="person" image={item.image} className="w-full aspect-square rounded-full bg-default" />
            <ItemContent className="mt-1 items-center">
                <ItemTitle className="text-sm text-center normal-case" numberOfLines={1}>{item.name}</ItemTitle>
                <ItemDescription className="text-center">{formatTrackCount(item.trackCount)}</ItemDescription>
            </ItemContent>
        </Item>
    ), [handlePress]);

    if (data.length === 0) {
        return <EmptyState icon="people" title="No Artists" message="Artists from your music library will appear here." />;
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
            recycleItems={true}
            waitForInitialLayout={false}
            maintainVisibleContentPosition
            estimatedItemSize={150}
            drawDistance={400}
            initialContainerPoolRatio={1}
        />
    );
};
