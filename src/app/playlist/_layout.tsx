import { Stack } from "expo-router"

import { useThemeColors } from "@/hooks/use-theme-colors"
import { BackButton } from "@/components/patterns"

export default function PlaylistLayout() {
  const theme = useThemeColors()

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.foreground,
        headerShadowVisible: false,
        headerTitleAlign: "center",
        contentStyle: { backgroundColor: theme.background },
        headerBackButtonMenuEnabled: false,
        headerBackVisible: false,
        headerLeft: () => <BackButton className="-ml-2" />,
      }}
    >
      <Stack.Screen name="[id]" options={{ title: "Playlist" }} />
      <Stack.Screen name="form" options={{ title: "Playlist" }} />
    </Stack>
  )
}
