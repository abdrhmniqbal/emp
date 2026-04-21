import { useRouter } from "expo-router"

import LocalSettingsIcon from "@/components/icons/local/settings"
import { BackButton } from "@/components/patterns/back-button"
import { StackHeaderActions } from "@/components/patterns/stack-header-actions"
import { Stack } from "@/layouts/stack"
import {
  getDefaultNativeStackOptions,
  getDrillDownScreenOptions,
  getLargeTitleRootScreenOptions,
  HIDDEN_STACK_SCREEN_OPTIONS,
} from "@/modules/navigation/stack"
import { useThemeColors } from "@/modules/ui/theme"

export default function HomeLayout() {
  const theme = useThemeColors()
  const router = useRouter()

  return (
    <Stack screenOptions={getDefaultNativeStackOptions(theme)}>
      <Stack.Screen
        name="index"
        options={getLargeTitleRootScreenOptions({
          title: "Home",
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
        name="recently-played"
        options={getDrillDownScreenOptions("Recently Played", () => (
          <BackButton className="-ml-2" />
        ))}
      />
      <Stack.Screen
        name="top-tracks"
        options={getDrillDownScreenOptions("Top Tracks", () => (
          <BackButton className="-ml-2" />
        ))}
      />
      <Stack.Screen name="album" options={HIDDEN_STACK_SCREEN_OPTIONS} />
      <Stack.Screen name="artist" options={HIDDEN_STACK_SCREEN_OPTIONS} />
      <Stack.Screen name="playlist" options={HIDDEN_STACK_SCREEN_OPTIONS} />
      <Stack.Screen name="search" options={HIDDEN_STACK_SCREEN_OPTIONS} />
    </Stack>
  )
}
