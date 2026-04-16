import {
  createSettingsConfigFile,
  loadSettingsConfig,
  saveSettingsConfig,
} from "@/modules/settings/settings.repository"
import {
  getDefaultAutoScanEnabled,
  getSettingsState,
  updateSettingsState,
} from "@/modules/settings/settings.store"

const AUTO_SCAN_FILE = createSettingsConfigFile("indexer-auto-scan.json")

let loadPromise: Promise<boolean> | null = null
let hasLoadedConfig = false

function parseEnabled(value: unknown, fallback: boolean): boolean {
  if (!value || typeof value !== "object") {
    return fallback
  }

  const enabled = (value as Record<string, unknown>).enabled
  return typeof enabled === "boolean" ? enabled : fallback
}

export async function ensureAutoScanConfigLoaded(): Promise<boolean> {
  if (hasLoadedConfig) {
    return getSettingsState().autoScanEnabled
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = (async () => {
    const config = await loadSettingsConfig(
      AUTO_SCAN_FILE,
      { enabled: getDefaultAutoScanEnabled() },
      (parsed) => ({
        enabled: parseEnabled(parsed, getDefaultAutoScanEnabled()),
      })
    )

    updateSettingsState({ autoScanEnabled: config.enabled })
    hasLoadedConfig = true
    return config.enabled
  })()

  const result = await loadPromise
  loadPromise = null
  return result
}

export async function setAutoScanEnabled(enabled: boolean): Promise<boolean> {
  await ensureAutoScanConfigLoaded()
  updateSettingsState({ autoScanEnabled: enabled })
  hasLoadedConfig = true
  await saveSettingsConfig(AUTO_SCAN_FILE, { enabled })
  return enabled
}
