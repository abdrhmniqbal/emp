import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { EmptyState } from "@/components/empty-state";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { Button } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/hooks/scroll-bars.store";
import { useStore } from "@nanostores/react";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { $indexerState } from "@/modules/indexer";
import { TrackList } from "@/components/library/track-list";
import { TOP_TRACKS_TABS, useTopTracksScreen } from "@/modules/tracks/hooks/use-top-tracks-screen";

export default function TopTracksScreen() {
    const indexerState = useStore($indexerState);
    const theme = useThemeColors();
    const { activeTab, setActiveTab, currentTracks, refresh, playAll, shuffle } = useTopTracksScreen();

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row px-4 py-4 gap-6">
                {TOP_TRACKS_TABS.map((tab) => (
                    <Pressable key={tab} onPress={() => setActiveTab(tab)}>
                        <Text
                            className={`text-xl font-bold ${activeTab === tab ? 'text-foreground' : 'text-muted'}`}
                        >
                            {tab}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 200 }}
                onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
                onScrollBeginDrag={handleScrollStart}
                onMomentumScrollEnd={handleScrollStop}
                onScrollEndDrag={handleScrollStop}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl refreshing={indexerState.isIndexing} onRefresh={refresh} tintColor={theme.accent} />
                }
            >
                {currentTracks.length > 0 && (
                    <View className="flex-row px-4 py-4 gap-4">
                        <Button
                            className="flex-1 h-14 rounded-xl bg-default flex-row items-center justify-center gap-2"
                            onPress={playAll}
                        >
                            <Ionicons name="play" size={20} color={theme.foreground} />
                            <Text className="text-lg font-bold text-foreground uppercase">Play</Text>
                        </Button>
                        <Button
                            className="flex-1 h-14 rounded-xl bg-default flex-row items-center justify-center gap-2"
                            onPress={shuffle}
                        >
                            <Ionicons name="shuffle" size={20} color={theme.foreground} />
                            <Text className="text-lg font-bold text-foreground uppercase">Shuffle</Text>
                        </Button>
                    </View>
                )}

                <Animated.View
                    key={activeTab}
                    entering={FadeInRight.duration(300)}
                    exiting={FadeOutLeft.duration(300)}
                    className="px-4"
                >
                    {currentTracks.length === 0 ? (
                        <EmptyState
                            icon="musical-notes-outline"
                            title="No top tracks yet"
                            message="Play some music to see your most played tracks here!"
                            className="mt-12"
                        />
                    ) : (
                        <TrackList data={currentTracks} showNumbers />
                    )}
                </Animated.View>
            </ScrollView>
        </View>
    );
}
