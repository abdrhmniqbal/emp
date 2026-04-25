/**
 * Purpose: Renders advanced maintenance and device-behavior settings for logs and background activity.
 * Caller: Settings advanced route.
 * Dependencies: Expo application metadata, HeroUI Native toast, battery optimization helpers, logging service, settings row pattern.
 * Main Functions: AdvancedSettingsScreen()
 * Side Effects: Opens system settings, shares logs, and launches external background-activity guidance.
 */

import * as Application from "expo-application"
import Constants from "expo-constants"
import { useRouter } from "expo-router"
import { Toast, useToast } from "heroui-native"
import { Linking, Platform, ScrollView, View } from "react-native"

import { SettingsRow } from "@/components/patterns/settings-row"
import {
  isIgnoringBatteryOptimizations,
  openBatteryOptimizationSettings as openNativeBatteryOptimizationSettings,
  requestIgnoreBatteryOptimizations,
} from "@/modules/device/battery-optimization"
import { shareCrashLogs } from "@/modules/logging/logging.service"
import { useSettingsStore } from "@/modules/settings/settings.store"

export default function AdvancedSettingsScreen() {
  const router = useRouter()
  const { toast } = useToast()
  const loggingLevel = useSettingsStore((state) => state.loggingConfig.level)

  const logLevelLabel = loggingLevel === "extra" ? "Extra" : "Minimal"

  async function handleShareCrashLogs() {
    const result = await shareCrashLogs()
    toast.show({
      duration: 2200,
      component: (props) => (
        <Toast {...props} variant="accent" placement="bottom">
          <Toast.Title className="text-sm font-semibold">
            {result.shared ? "Logs ready to share" : "Unable to share logs"}
          </Toast.Title>
          <Toast.Description className="text-xs text-muted">
            {result.shared
              ? "Share sheet opened with the latest captured logs."
              : result.reason || "Try again in a moment."}
          </Toast.Description>
        </Toast>
      ),
    })
  }

  async function openBatteryOptimizationSettings() {
    const appPackage =
      Application.applicationId || Constants.expoConfig?.android?.package
    const BATTERY_SETTINGS_ACTION =
      "android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS"

    try {
      if (Platform.OS !== "android") {
        await Linking.openSettings()
        return
      }

      if (await isIgnoringBatteryOptimizations(appPackage)) {
        toast.show({
          duration: 2200,
          component: (props) => (
            <Toast {...props} variant="accent" placement="bottom">
              <Toast.Title className="text-sm font-semibold">
                Battery optimization already disabled
              </Toast.Title>
              <Toast.Description className="text-xs text-muted">
                No additional action is needed.
              </Toast.Description>
            </Toast>
          ),
        })
        return
      }

      const requestResult = await requestIgnoreBatteryOptimizations(appPackage)
      if (
        requestResult === "dialog_opened" ||
        requestResult === "settings_opened"
      ) {
        return
      }

      if (await openNativeBatteryOptimizationSettings()) {
        return
      }

      try {
        await Linking.sendIntent(BATTERY_SETTINGS_ACTION)
        return
      } catch {
        // Fall through to app settings.
      }
    } catch {
      // Fallback to app settings.
    }

    await Linking.openSettings()
  }

  async function openDontKillMyApp() {
    try {
      await Linking.openURL("https://dontkillmyapp.com")
    } catch {
      toast.show({
        duration: 2200,
        component: (props) => (
          <Toast {...props} variant="accent" placement="bottom">
            <Toast.Title className="text-sm font-semibold">
              Unable to open link
            </Toast.Title>
            <Toast.Description className="text-xs text-muted">
              Please try again in a moment.
            </Toast.Description>
          </Toast>
        ),
      })
    }
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <View className="overflow-hidden rounded-[28px] border border-border/60 bg-background">
          <SettingsRow
            onPress={() => router.push("/settings/log-level")}
            title="Log Level"
            description={
              logLevelLabel === "Extra"
                ? "Extra: capture debug, info, warnings, and errors."
                : "Minimal: capture critical and error logs only."
            }
          />

          <SettingsRow
            onPress={() => {
              void handleShareCrashLogs()
            }}
            title="Share crash logs"
            description="Saves error logs to a local file and opens a share sheet."
            className="border-t border-border/60"
          />
        </View>
        <View className="overflow-hidden rounded-[28px] border border-border/60 bg-background">
          <SettingsRow
            onPress={() => {
              void openBatteryOptimizationSettings()
            }}
            title="Disable Battery Optimization"
            description={
              Platform.OS === "android"
                ? "Prevent background restrictions so indexing and playback stay reliable."
                : "Open system settings."
            }
          />

          <SettingsRow
            onPress={() => {
              void openDontKillMyApp()
            }}
            title="Don't Kill My App!"
            description="Open device-specific battery and background process guidance."
            className="border-t border-border/60"
          />
        </View>
      </View>
    </ScrollView>
  )
}
