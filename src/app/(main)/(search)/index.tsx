import React from "react";
import {
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "heroui-native";
import { useThemeColors } from "@/hooks/use-theme-colors";
import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/hooks/scroll-bars.store";
import { useStore } from "@nanostores/react";
import { $indexerState } from "@/modules/indexer";
import { EmptyState } from "@/components/ui";
import { GenreCard } from "@/components/patterns";
import { useSearchScreen } from "@/modules/search/hooks/use-search-screen";
import type { GenreCategory as Category } from "@/modules/genres/genres.utils";
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid";

export default function SearchScreen() {
  const theme = useThemeColors();
  const router = useRouter();
  const indexerState = useStore($indexerState);
  const { categories, refresh } = useSearchScreen();

  function handleGenrePress(genre: Category) {
    router.push(`./genre/${encodeURIComponent(genre.title)}`);
  }

  function handleSearchPress() {
    router.push("/search-interaction");
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 20, paddingBottom: 200 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
      onScrollBeginDrag={handleScrollStart}
      onMomentumScrollEnd={handleScrollStop}
      onScrollEndDrag={handleScrollStop}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl
          refreshing={indexerState.isIndexing}
          onRefresh={refresh}
          tintColor={theme.accent}
        />
      }
    >
      <View className="relative mb-6">
        <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          <Ionicons name="search-outline" size={20} color={theme.muted} />
        </View>
        <Input
          value=""
          editable={false}
          showSoftInputOnFocus={false}
          placeholder="Search for tracks, artists, albums..."
          className="pl-10"
        />
        <Pressable
          onPress={handleSearchPress}
          className="absolute inset-0 z-20"
          accessibilityRole="button"
          accessibilityLabel="Open search"
        />
      </View>

      <Text className="text-xl font-bold text-foreground mb-4">
        Browse by Genre
      </Text>

      {categories.length > 0 ? (
        <View className="flex-row flex-wrap justify-between gap-y-4">
          {categories.map((genre) => (
            <GenreCard
              key={genre.id}
              title={genre.title}
              color={genre.color}
              pattern={genre.pattern}
              onPress={() => handleGenrePress(genre)}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon={
            <LocalMusicNoteSolidIcon
              fill="none"
              width={48}
              height={48}
              color={theme.muted}
            />
          }
          title="No genres found"
          message="Start playing music to see genres here!"
          className="mt-8"
        />
      )}
    </ScrollView>
  );
}
