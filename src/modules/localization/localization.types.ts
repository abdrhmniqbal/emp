/**
 * Purpose: Defines localization language codes and translation resource typing.
 * Caller: Localization services, settings store, language settings screen.
 * Dependencies: None.
 * Main Functions: LanguageCode, TranslationResources.
 * Side Effects: None.
 */

export type LanguageCode = "en" | "id"

export interface LanguageOption {
  code: LanguageCode
  labelKey: string
  nativeLabelKey: string
}

export type TranslationResources = Record<string, unknown>
