/**
 * Purpose: Renders advanced maintenance and device-behavior settings for logs, listening history, and background activity.
 * Caller: Settings advanced route.
 * Dependencies: Expo application metadata, HeroUI Native dialog/toast, react-i18next, battery optimization helpers, logging service, history mutations, settings row pattern.
 * Main Functions: AdvancedSettingsScreen()
 * Side Effects: Opens system settings, shares logs, clears listening history, and launches external background-activity guidance.
 */

import * as Application from "expo-application"
import Constants from "expo-constants"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { Button, Dialog, Toast, useToast } from "heroui-native"
import { useState } from "react"
import { Linking, Platform, ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation()
  const loggingLevel = useSettingsStore((state) => state.loggingConfig.level)
  const resetListeningHistoryMutation = useResetListeningHistory()
  const [isResetHistoryDialogOpen, setIsResetHistoryDialogOpen] =
    useState(false)

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
      result.shared
        ? t("settings.advanced.logsReadyTitle")
        : t("settings.advanced.logsUnableTitle"),
      result.shared
        ? t("settings.advanced.logsReadyDescription")
        : result.reason || t("settings.advanced.tryAgainDescription")
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
        t("settings.advanced.historyResetTitle"),
        t("settings.advanced.historyResetDescription")
      )
    } catch {
      showToast(
        t("settings.advanced.historyResetUnableTitle"),
        t("settings.advanced.tryAgainDescription")
      )
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
          t("settings.advanced.batteryAlreadyDisabledTitle"),
          t("settings.advanced.batteryAlreadyDisabledDescription")
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
      showToast(
        t("settings.advanced.unableToOpenLinkTitle"),
        t("settings.advanced.tryAgainDescription")
      )
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
              title={t("settings.routes.logLevel.title")}
              description={
                loggingLevel === "extra"
                  ? t("settings.advanced.logExtraDescription")
                  : t("settings.advanced.logMinimalDescription")
              }
            />

            <SettingsRow
              onPress={() => {
                void handleShareCrashLogs()
              }}
              title={t("settings.advanced.shareCrashLogs")}
              description={t("settings.advanced.shareCrashLogsDescription")}
              className="border-t border-border/60"
            />
          </View>
          <View className="overflow-hidden rounded-[28px] border border-border/60 bg-background">
            <SettingsRow
              onPress={() => setIsResetHistoryDialogOpen(true)}
              title={t("settings.advanced.resetListeningHistory")}
              description={t(
                "settings.advanced.resetListeningHistoryDescription"
              )}
              isDisabled={isResettingHistory}
              showChevron={false}
            />
          </View>
          <View className="overflow-hidden rounded-[28px] border border-border/60 bg-background">
            <SettingsRow
              onPress={() => {
                void openBatteryOptimizationSettings()
              }}
              title={t("settings.advanced.disableBatteryOptimization")}
              description={
                Platform.OS === "android"
                  ? t("settings.advanced.disableBatteryOptimizationAndroid")
                  : t("settings.advanced.openSystemSettings")
              }
            />

            <SettingsRow
              onPress={() => {
                void openDontKillMyApp()
              }}
              title={t("settings.advanced.dontKillMyApp")}
              description={t("settings.advanced.dontKillMyAppDescription")}
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
              <Dialog.Title>{t("settings.advanced.resetDialogTitle")}</Dialog.Title>
              <Dialog.Description>
                {t("settings.advanced.resetDialogDescription")}
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button
                variant="ghost"
                onPress={() => setIsResetHistoryDialogOpen(false)}
                isDisabled={isResettingHistory}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="danger"
                onPress={() => {
                  void handleConfirmResetHistory()
                }}
                isDisabled={isResettingHistory}
              >
                {t("common.reset")}
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}
