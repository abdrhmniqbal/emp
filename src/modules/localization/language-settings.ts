/**
 * Purpose: Loads, validates, and persists the selected app language.
 * Caller: Localization provider and language settings route.
 * Dependencies: i18next readiness, settings repository, localization type guards, settings store.
 * Main Functions: ensureLanguageConfigLoaded(), setLanguageCode(), getLanguageOptions().
 * Side Effects: Reads/writes language settings JSON and changes the active i18next language.
 */

import {
  i18n,
  i18nReady,
  DEFAULT_LANGUAGE_CODE,
  isSupportedLanguageCode,
} from "./i18n"
import type { LanguageCode, LanguageOption } from "./localization.types"
import {
  createSettingsConfigFile,
  loadSettingsConfig,
  saveSettingsConfig,
} from "@/modules/settings/settings.repository"
import {
  getDefaultLanguageCode,
  getSettingsState,
  updateSettingsState,
} from "@/modules/settings/settings.store"

interface LanguageConfig {
  languageCode: LanguageCode
}

const LANGUAGE_SETTINGS_FILE = createSettingsConfigFile("language.json")

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: "en",
    labelKey: "settings.language.english",
    nativeLabelKey: "settings.language.englishNative",
  },
  {
    code: "id",
    labelKey: "settings.language.indonesian",
    nativeLabelKey: "settings.language.indonesianNative",
  },
]

let loadPromise: Promise<LanguageCode> | null = null
let hasLoadedConfig = false

function sanitizeConfig(config: unknown): LanguageConfig {
  const source =
    config && typeof config === "object"
      ? (config as Record<string, unknown>)
      : {}

  return {
    languageCode: isSupportedLanguageCode(source.languageCode)
      ? source.languageCode
      : getDefaultLanguageCode(),
  }
}

async function applyLanguage(languageCode: LanguageCode): Promise<void> {
  await i18nReady
  if (i18n.language !== languageCode) {
    await i18n.changeLanguage(languageCode)
  }
}

export function getLanguageOptions(): LanguageOption[] {
  return LANGUAGE_OPTIONS
}

export async function ensureLanguageConfigLoaded(): Promise<LanguageCode> {
  if (hasLoadedConfig) {
    return getSettingsState().languageCode
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = (async () => {
    const config = await loadSettingsConfig(
      LANGUAGE_SETTINGS_FILE,
      { languageCode: DEFAULT_LANGUAGE_CODE },
      sanitizeConfig
    )
    updateSettingsState({ languageCode: config.languageCode })
    await applyLanguage(config.languageCode)
    hasLoadedConfig = true
    return config.languageCode
  })()

  const result = await loadPromise
  loadPromise = null
  return result
}

export async function setLanguageCode(
  languageCode: LanguageCode
): Promise<LanguageCode> {
  const next = isSupportedLanguageCode(languageCode)
    ? languageCode
    : DEFAULT_LANGUAGE_CODE
  updateSettingsState({ languageCode: next })
  hasLoadedConfig = true
  await applyLanguage(next)
  await saveSettingsConfig(LANGUAGE_SETTINGS_FILE, { languageCode: next })
  return next
}
