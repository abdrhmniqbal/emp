import { atom } from "nanostores"
import * as FileSystem from "expo-file-system/legacy"

interface AutoScanConfig {
  enabled: boolean
}

const SETTINGS_DIRECTORY =
  FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? ""
const AUTO_SCAN_FILE = `${SETTINGS_DIRECTORY}indexer-auto-scan.json`
const DEFAULT_AUTO_SCAN_ENABLED = true

export const $autoScanEnabled = atom<boolean>(DEFAULT_AUTO_SCAN_ENABLED)

let loadPromise: Promise<boolean> | null = null
let hasLoadedConfig = false

async function persistAutoScanConfig(config: AutoScanConfig): Promise<void> {
  if (!SETTINGS_DIRECTORY) {
    return
  }

  await FileSystem.writeAsStringAsync(AUTO_SCAN_FILE, JSON.stringify(config), {
    encoding: FileSystem.EncodingType.UTF8,
  })
}

export async function ensureAutoScanConfigLoaded(): Promise<boolean> {
  if (hasLoadedConfig) {
    return $autoScanEnabled.get()
  }

  if (!SETTINGS_DIRECTORY) {
    $autoScanEnabled.set(DEFAULT_AUTO_SCAN_ENABLED)
    hasLoadedConfig = true
    return DEFAULT_AUTO_SCAN_ENABLED
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = (async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(AUTO_SCAN_FILE)
      if (!fileInfo.exists) {
        $autoScanEnabled.set(DEFAULT_AUTO_SCAN_ENABLED)
        return DEFAULT_AUTO_SCAN_ENABLED
      }

      const raw = await FileSystem.readAsStringAsync(AUTO_SCAN_FILE)
      const parsed = JSON.parse(raw) as Partial<AutoScanConfig>
      const enabled =
        typeof parsed.enabled === "boolean"
          ? parsed.enabled
          : DEFAULT_AUTO_SCAN_ENABLED

      $autoScanEnabled.set(enabled)
      hasLoadedConfig = true
      return enabled
    } catch {
      $autoScanEnabled.set(DEFAULT_AUTO_SCAN_ENABLED)
      hasLoadedConfig = true
      return DEFAULT_AUTO_SCAN_ENABLED
    }
  })()

  const result = await loadPromise
  loadPromise = null
  return result
}

export async function setAutoScanEnabled(enabled: boolean): Promise<boolean> {
  await ensureAutoScanConfigLoaded()
  $autoScanEnabled.set(enabled)
  hasLoadedConfig = true
  await persistAutoScanConfig({ enabled })
  return enabled
}
