/**
 * Purpose: Renders the settings hub with grouped routes for app preferences and system options.
 * Caller: Settings root route.
 * Dependencies: Expo Router, settings route definitions, settings row pattern.
 * Main Functions: SettingsScreen()
 * Side Effects: Navigates to settings detail routes.
 */

import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { ScrollView, View } from "react-native"

import { SettingsRow } from "@/components/patterns/settings-row"
import { SETTINGS_CATEGORY_ROUTES } from "@/modules/settings/settings.routes"

export default function SettingsScreen() {
  const router = useRouter()

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      <View className="gap-5 px-4 py-4">
        <View className="overflow-hidden rounded-[28px] border border-border/60 bg-background">
          {SETTINGS_CATEGORY_ROUTES.map((route, index) => (
            <SettingsRow
              key={route.name}
              title={route.title}
              description={route.description}
              onPress={() => router.push(`/settings/${route.name}`)}
              className={index > 0 ? "border-t border-border/60" : undefined}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  )
}
