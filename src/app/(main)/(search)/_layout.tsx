import { useRouter } from "expo-router"

import LocalSettingsIcon from "@/components/icons/local/settings"
import { StackHeaderActions } from "@/components/patterns/stack-header-actions"
import { Stack } from "@/layouts/stack"
import {
  getDefaultNativeStackOptions,
  getHiddenBoundaryZoomTransitionOptions,
  getHiddenArtistZoomTransitionOptions,
  getLargeTitleRootScreenOptions,
  HIDDEN_STACK_SCREEN_OPTIONS,
} from "@/modules/navigation/stack"
import { useThemeColors } from "@/modules/ui/theme"

export default function SearchLayout() {
  const theme = useThemeColors()
  const router = useRouter()

  return (
    <Stack screenOptions={getDefaultNativeStackOptions(theme)}>
      <Stack.Screen
        name="index"
        options={getLargeTitleRootScreenOptions({
          title: "Search",
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
