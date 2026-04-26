/**
 * Purpose: Renders advanced maintenance and device-behavior settings for logs, listening history, and background activity.
 * Caller: Settings advanced route.
 * Dependencies: Expo application metadata, HeroUI Native dialog/toast, battery optimization helpers, logging service, history mutations, settings row pattern.
 * Main Functions: AdvancedSettingsScreen()
 * Side Effects: Opens system settings, shares logs, clears listening history, and launches external background-activity guidance.
 */

import * as Application from "expo-application"
import Constants from "expo-constants"
import { useRouter } from "expo-router"
import { Button, Dialog, Toast, useToast } from "heroui-native"
import { useState } from "react"
import { Linking, Platform, ScrollView, View } from "react-native"

import { SettingsRow } from "@/components/patterns/settings-row"
import {
  isIgnoringBatteryOptimizations,
  openBatteryOptimizationSettings as openNativeBatteryOptimizationSettings,
  requestIgnoreBatteryOptimizations,
} from "@/modules/device/battery-optimization"
import { useResetListeningHistory } from "@/modules/history/history.mutations"
import { shareCrashLogs } from "@/modules/logging/logging.service"
import { useSettingsStore } from "@/modules/settings/settings.store"

export default function AdvancedSettingsScreen() {
  const router = useRouter()
  const { toast } = useToast()
  const loggingLevel = useSettingsStore((state) => state.loggingConfig.level)
  const resetListeningHistoryMutation = useResetListeningHistory()
  const [isResetHistoryDialogOpen, setIsResetHistoryDialogOpen] =
    useState(false)

  const logLevelLabel = loggingLevel === "extra" ? "Extra" : "Minimal"
  const isResettingHistory = resetListeningHistoryMutation.isPending

  function showToast(title: string, description: string) {
    toast.show({
      duration: 2200,
      component: (props) => (
        <Toast {...props} variant="accent" placement="bottom">
          <Toast.Title className="text-sm font-semibold">{title}</Toast.Title>
          <Toast.Description className="text-xs text-muted">
            {description}
          </Toast.Description>
        </Toast>
      ),
    })
  }

  async function handleShareCrashLogs() {
    const result = await shareCrashLogs()
    showToast(
      result.shared ? "Logs ready to share" : "Unable to share logs",
      result.shared
        ? "Share sheet opened with the latest captured logs."
        : result.reason || "Try again in a moment."
    )
  }

  async function handleConfirmResetHistory() {
    if (isResettingHistory) {
      return
    }

    try {
      await resetListeningHistoryMutation.mutateAsync()
      setIsResetHistoryDialogOpen(false)
      showToast(
        "Listening history reset",
        "Recently played and top-track stats have been cleared."
      )
    } catch {
      showToast("Unable to reset history", "Please try again in a moment.")
    }
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
        showToast(
          "Battery optimization already disabled",
          "No additional action is needed."
        )
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
      showToast("Unable to open link", "Please try again in a moment.")
    }
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
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
              onPress={() => setIsResetHistoryDialogOpen(true)}
              title="Reset listening history"
              description="Clear recently played and top-track stats."
              isDisabled={isResettingHistory}
              showChevron={false}
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

      <Dialog
        isOpen={isResetHistoryDialogOpen}
        onOpenChange={setIsResetHistoryDialogOpen}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="gap-4">
            <View className="gap-1.5">
              <Dialog.Title>Reset listening history?</Dialog.Title>
              <Dialog.Description>
                This will clear recently played and reset top-track stats. Your
                music files, playlists, and favorites will stay unchanged.
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button
                variant="ghost"
                onPress={() => setIsResetHistoryDialogOpen(false)}
                isDisabled={isResettingHistory}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onPress={() => {
                  void handleConfirmResetHistory()
                }}
                isDisabled={isResettingHistory}
              >
                Reset
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}
