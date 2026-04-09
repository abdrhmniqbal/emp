import { Stack, useRouter } from "expo-router"

import LocalSettingsIcon from "@/components/icons/local/settings"
import { StackHeaderActions } from "@/components/patterns/stack-header-actions"
import {
  getDefaultNativeStackOptions,
  getLargeTitleRootScreenOptions,
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
    </Stack>
  )
}
