import Constants from "expo-constants"
import { PressableFeedback } from "heroui-native"
import { Linking, Platform, ScrollView, Text, View } from "react-native"

import { useThemeColors } from "@/hooks/use-theme-colors"
import LocalChevronRightIcon from "@/components/icons/local/chevron-right"

export default function AdvancedSettingsScreen() {
  const theme = useThemeColors()

  async function openBatteryOptimizationSettings() {
    const appPackage = Constants.expoConfig?.android?.package

    try {
      if (Platform.OS !== "android") {
        await Linking.openSettings()
        return
      }

      if (appPackage) {
        try {
          await Linking.sendIntent(
            "android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
            [
              {
                key: "android.provider.extra.APP_PACKAGE",
                value: appPackage,
              },
            ]
          )
          return
        } catch {
          // Fall through to settings list.
        }
      }

      await Linking.sendIntent(
        "android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS"
      )
      return
    } catch {
      // Fallback to app settings.
    }

    await Linking.openSettings()
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="py-2">
        <PressableFeedback
          onPress={() => {
            void openBatteryOptimizationSettings()
          }}
          className="flex-row items-center bg-background px-6 py-4 active:opacity-70"
        >
          <View className="flex-1 gap-1">
            <Text className="text-[17px] font-normal text-foreground">
              Disable Battery Optimization
            </Text>
            <Text className="text-[13px] leading-5 text-muted">
              {Platform.OS === "android"
                ? "Prevent background restrictions so indexing and playback stay reliable."
                : "Open system settings."}
            </Text>
          </View>
          <LocalChevronRightIcon
            fill="none"
            width={20}
            height={20}
            color={theme.muted}
          />
        </PressableFeedback>
      </View>
    </ScrollView>
  )
}
