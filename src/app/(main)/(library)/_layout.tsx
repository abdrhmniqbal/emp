import { useRouter } from "expo-router"

import LocalSettingsIcon from "@/components/icons/local/settings"
import { BackButton } from "@/components/patterns/back-button"
import { StackHeaderActions } from "@/components/patterns/stack-header-actions"
import { Stack } from "@/layouts/stack"
import {
  getDefaultNativeStackOptions,
  getDrillDownScreenOptions,
  getHiddenBoundaryZoomTransitionOptions,
  getHiddenArtistZoomTransitionOptions,
  getLargeTitleRootScreenOptions,
  HIDDEN_STACK_SCREEN_OPTIONS,
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
        options={({ route }) =>
          getHiddenBoundaryZoomTransitionOptions(
            typeof route.params?.transitionId === "string"
              ? route.params.transitionId
              : undefined
          )}
      />
      <Stack.Screen
        name="artist"
        options={({ route }) =>
          getHiddenArtistZoomTransitionOptions(
            typeof route.params?.transitionId === "string"
              ? route.params.transitionId
              : undefined
          )}
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
        options={({ route }) =>
          typeof route.params?.transitionId === "string"
            ? getHiddenBoundaryZoomTransitionOptions(route.params.transitionId)
            : HIDDEN_STACK_SCREEN_OPTIONS
        }
      />
    </Stack>
  )
}
