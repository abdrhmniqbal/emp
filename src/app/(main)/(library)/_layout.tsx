/**
 * Purpose: Defines the Library stack and nested navigation for albums, artists, genres, and playlists.
 * Caller: Expo Router main tab layout.
 * Dependencies: Stack, route transition helpers, settings header action, theme colors.
 * Main Functions: LibraryLayout()
 * Side Effects: None beyond rendering navigation state.
 */

import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"

import LocalSettingsIcon from "@/components/icons/local/settings"
import { BackButton } from "@/components/patterns/back-button"
import { StackHeaderActions } from "@/components/patterns/stack-header-actions"
import { Stack } from "@/layouts/stack"
import {
  getDefaultNativeStackOptions,
  getDrillDownScreenOptions,
  getHiddenArtistScreenOptions,
  getHiddenBoundaryScreenOptions,
  getHiddenPlaylistScreenOptions,
  getLargeTitleRootScreenOptions,
} from "@/modules/navigation/stack"
import { useThemeColors } from "@/modules/ui/theme"

export default function LibraryLayout() {
  const theme = useThemeColors()
  const router = useRouter()

  return (
    <Stack screenOptions={getDefaultNativeStackOptions(theme)}>
      <Stack.Screen
        name="index"
        options={getLargeTitleRootScreenOptions({
          title: "Library",
          headerRight: () => (
            <StackHeaderActions
              actions={[
                {
                  key: "settings",
                  onPress: () => router.push("/settings"),
                  icon: (
                    <LocalSettingsIcon
                      fill="none"
                      width={24}
                      height={24}
                      color={theme.foreground}
                    />
                  ),
                },
              ]}
            />
          ),
        })}
      />
      <Stack.Screen
        name="album"
        options={({ route }) => getHiddenBoundaryScreenOptions(route.params)}
      />
      <Stack.Screen
        name="artist"
        options={({ route }) => getHiddenArtistScreenOptions(route.params)}
      />
      <Stack.Screen
        name="genre/[name]"
        options={getDrillDownScreenOptions("Genre", () => (
          <BackButton className="-ml-2" />
        ))}
      />
      <Stack.Screen
        name="genre/albums"
        options={getDrillDownScreenOptions("Recommended Albums", () => (
          <BackButton className="-ml-2" />
        ))}
      />
      <Stack.Screen
        name="genre/top-tracks"
        options={getDrillDownScreenOptions("Top Tracks", () => (
          <BackButton className="-ml-2" />
        ))}
      />
      <Stack.Screen
        name="playlist"
        options={({ route }) => getHiddenPlaylistScreenOptions(route.params)}
      />
    </Stack>
  )
}
