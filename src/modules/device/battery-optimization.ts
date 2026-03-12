import { NativeModules, Platform } from "react-native"

interface BatteryOptimizationNativeModule {
  isIgnoringBatteryOptimizations: (packageName?: string) => Promise<boolean>
  requestIgnoreBatteryOptimizations: (
    packageName?: string
  ) => Promise<
    "already_ignored" | "dialog_opened" | "settings_opened" | "unsupported"
  >
  openBatteryOptimizationSettings: () => Promise<"settings_opened">
}

const batteryOptimizationModule = NativeModules.BatteryOptimization as
  | BatteryOptimizationNativeModule
  | undefined

export async function isIgnoringBatteryOptimizations(
  packageName?: string
): Promise<boolean> {
  if (Platform.OS !== "android") {
    return true
  }

  if (!batteryOptimizationModule?.isIgnoringBatteryOptimizations) {
    return false
  }

  try {
    return await batteryOptimizationModule.isIgnoringBatteryOptimizations(
      packageName
    )
  } catch {
    return false
  }
}

export async function requestIgnoreBatteryOptimizations(
  packageName?: string
): Promise<
  "already_ignored" | "dialog_opened" | "settings_opened" | "unsupported"
> {
  if (Platform.OS !== "android") {
    return "unsupported"
  }

  if (!batteryOptimizationModule?.requestIgnoreBatteryOptimizations) {
    return "unsupported"
  }

  try {
    return await batteryOptimizationModule.requestIgnoreBatteryOptimizations(
      packageName
    )
  } catch {
    return "unsupported"
  }
}

export async function openBatteryOptimizationSettings(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return false
  }

  if (!batteryOptimizationModule?.openBatteryOptimizationSettings) {
    return false
  }

  try {
    const result =
      await batteryOptimizationModule.openBatteryOptimizationSettings()
    return result === "settings_opened"
  } catch {
    return false
  }
}
