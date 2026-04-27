/**
 * Purpose: Initializes i18next with app translation resources and locale fallback behavior.
 * Caller: Localization provider and any module that needs translation outside React components.
 * Dependencies: expo-localization, i18next, react-i18next, intl-pluralrules, English and Indonesian JSON resources.
 * Main Functions: i18n, i18nReady, getDeviceLanguageCode(), isSupportedLanguageCode().
 * Side Effects: Initializes the global i18next instance.
 */

import "intl-pluralrules"

import * as Localization from "expo-localization"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import en from "./resources/en.json"
import id from "./resources/id.json"
import type { LanguageCode } from "./localization.types"

export const DEFAULT_LANGUAGE_CODE: LanguageCode = "en"
export const SUPPORTED_LANGUAGE_CODES: LanguageCode[] = ["en", "id"]

export function isSupportedLanguageCode(value: unknown): value is LanguageCode {
  return (
    typeof value === "string" &&
    SUPPORTED_LANGUAGE_CODES.includes(value as LanguageCode)
  )
}

export function getDeviceLanguageCode(): LanguageCode {
  const locale = Localization.getLocales()[0]
  return isSupportedLanguageCode(locale?.languageCode)
    ? locale.languageCode
    : DEFAULT_LANGUAGE_CODE
}

export const i18nReady = i18n.isInitialized
  ? Promise.resolve(i18n)
  : i18n.use(initReactI18next).init({
    compatibilityJSON: "v4",
    fallbackLng: DEFAULT_LANGUAGE_CODE,
    lng: getDeviceLanguageCode(),
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: en,
      },
      id: {
        translation: id,
      },
    },
  })

export { i18n }
