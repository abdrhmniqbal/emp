import React, { useCallback } from "react";
import { View } from "react-native";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription } from "@/components/item";

export interface Album {
    id: string;
    title: string;
    artist: string;
    image?: string;
}

interface AlbumGridProps {
    data: Album[];
    onAlbumPress?: (album: Album) => void;
}

export const AlbumGrid: React.FC<AlbumGridProps> = ({ data, onAlbumPress }) => {
    const handlePress = useCallback((album: Album) => {
        onAlbumPress?.(album);
    }, [onAlbumPress]);

    return (
        <View className="flex-row flex-wrap gap-4">
            {data.map((album) => (
                <Item
                    key={album.id}
                    variant="grid"
                    className="w-[30%] grow"
                    onPress={() => handlePress(album)}
                >
                    <ItemImage icon="disc" image={album.image} className="w-full aspect-square rounded-md" />
                    <ItemContent className="mt-1">
                        <ItemTitle className="text-sm normal-case" numberOfLines={1}>{album.title}</ItemTitle>
                        <ItemDescription>{album.artist}</ItemDescription>
                    </ItemContent>
                </Item>
            ))}
        </View>
    );
};
