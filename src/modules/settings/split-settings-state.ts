/**
 * Purpose: Tracks split-settings change prompts and generates short UI summaries.
 * Caller: Split settings screen and library settings route.
 * Dependencies: i18next localization and split settings type definitions.
 * Main Functions: markSplitSettingsReindexPrompt(), consumeSplitSettingsReindexPrompt(), getSplitMultipleValuesSummary().
 * Side Effects: Mutates an in-memory flag used for deferred reindex prompting.
 */

import { i18n } from "@/modules/localization/i18n"
import type { SplitMultipleValueConfig } from "@/modules/settings/split-multiple-values"

let pendingSplitSettingsReindexPrompt = false

export function markSplitSettingsReindexPrompt() {
  pendingSplitSettingsReindexPrompt = true
}

export function consumeSplitSettingsReindexPrompt() {
  const pending = pendingSplitSettingsReindexPrompt
  pendingSplitSettingsReindexPrompt = false
  return pending
}

export function getSplitMultipleValuesSummary(
  config: SplitMultipleValueConfig
) {
  const modeLabel =
    config.artistSplitMode === "original"
      ? i18n.t("settings.library.artistSplitModeOriginal")
      : i18n.t("settings.library.artistSplitModeSplit")

  return i18n.t("settings.library.splitMultipleValuesSummary", {
    mode: modeLabel,
    artistSymbols: config.artistSplitSymbols.join(" "),
    genreSymbols: config.genreSplitSymbols.join(" "),
  })
}
