import { create } from "zustand"

import {
  createIndexerConfigFile,
  loadIndexerConfig,
  saveIndexerConfig,
} from "@/modules/indexer/indexer-config.repository"

interface AutoScanConfig {
  enabled: boolean
}

const AUTO_SCAN_FILE = createIndexerConfigFile("indexer-auto-scan.json")
const DEFAULT_AUTO_SCAN_ENABLED = true

interface AutoScanState {
  autoScanEnabled: boolean
}

export const useAutoScanStore = create<AutoScanState>(() => ({
  autoScanEnabled: DEFAULT_AUTO_SCAN_ENABLED,
}))

function getAutoScanEnabled() {
  return useAutoScanStore.getState().autoScanEnabled
}

function setAutoScanEnabledState(value: boolean) {
  useAutoScanStore.setState({ autoScanEnabled: value })
}

let loadPromise: Promise<boolean> | null = null
let hasLoadedConfig = false

export async function ensureAutoScanConfigLoaded(): Promise<boolean> {
  if (hasLoadedConfig) {
    return getAutoScanEnabled()
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = (async () => {
    const config = await loadIndexerConfig(
      AUTO_SCAN_FILE,
      { enabled: DEFAULT_AUTO_SCAN_ENABLED },
      (parsed) => ({
        enabled:
          typeof parsed.enabled === "boolean"
            ? parsed.enabled
            : DEFAULT_AUTO_SCAN_ENABLED,
      })
    )

    setAutoScanEnabledState(config.enabled)
    hasLoadedConfig = true
    return config.enabled
  })()

  const result = await loadPromise
  loadPromise = null
  return result
}

export async function setAutoScanEnabled(enabled: boolean): Promise<boolean> {
  await ensureAutoScanConfigLoaded()
  setAutoScanEnabledState(enabled)
  hasLoadedConfig = true
  await saveIndexerConfig(AUTO_SCAN_FILE, { enabled })
  return enabled
}
