import {
  getDefaultIndexerNotificationsEnabled,
  getSettingsState,
  updateSettingsState,
} from "@/modules/settings/settings.store"
import {
  createSettingsConfigFile,
  loadSettingsConfig,
  saveSettingsConfig,
} from "@/modules/settings/settings.repository"

interface IndexerNotificationsConfig {
  enabled: boolean
}

const INDEXER_NOTIFICATIONS_FILE = createSettingsConfigFile(
  "indexer-notifications.json"
)

let loadPromise: Promise<boolean> | null = null
let hasLoadedConfig = false

export async function ensureIndexerNotificationsConfigLoaded(): Promise<boolean> {
  if (hasLoadedConfig) {
    return getSettingsState().indexerNotificationsEnabled
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = (async () => {
    const config = await loadSettingsConfig(
      INDEXER_NOTIFICATIONS_FILE,
      { enabled: getDefaultIndexerNotificationsEnabled() },
      (parsed) => ({
        enabled:
          typeof parsed.enabled === "boolean"
            ? parsed.enabled
            : getDefaultIndexerNotificationsEnabled(),
      })
    )

    updateSettingsState({ indexerNotificationsEnabled: config.enabled })
    hasLoadedConfig = true
    return config.enabled
  })()

  const result = await loadPromise
  loadPromise = null
  return result
}

export async function setIndexerNotificationsEnabled(
  enabled: boolean
): Promise<boolean> {
  await ensureIndexerNotificationsConfigLoaded()
  updateSettingsState({ indexerNotificationsEnabled: enabled })
  hasLoadedConfig = true
  await saveSettingsConfig<IndexerNotificationsConfig>(
    INDEXER_NOTIFICATIONS_FILE,
    { enabled }
  )
  return enabled
}
