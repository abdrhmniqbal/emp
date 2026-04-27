/**
 * Purpose: Defines settings category links and native stack titles for settings screens.
 * Caller: Settings index route and settings stack layout.
 * Dependencies: Settings route type definitions.
 * Main Functions: SETTINGS_CATEGORY_ROUTES, SETTINGS_SCREEN_TITLE_KEYS.
 * Side Effects: None.
 */

import type { SettingsRouteDefinition } from "./settings.types"

export const SETTINGS_CATEGORY_ROUTES: SettingsRouteDefinition[] = [
  {
    name: "appearance",
    titleKey: "settings.routes.appearance.title",
    descriptionKey: "settings.routes.appearance.description",
  },
  {
    name: "language",
    titleKey: "settings.routes.language.title",
    descriptionKey: "settings.routes.language.description",
  },
  {
    name: "audio",
    titleKey: "settings.routes.audio.title",
    descriptionKey: "settings.routes.audio.description",
  },
  {
    name: "notifications",
    titleKey: "settings.routes.notifications.title",
    descriptionKey: "settings.routes.notifications.description",
  },
  {
    name: "library",
    titleKey: "settings.routes.library.title",
    descriptionKey: "settings.routes.library.description",
  },
  {
    name: "advanced",
    titleKey: "settings.routes.advanced.title",
    descriptionKey: "settings.routes.advanced.description",
  },
  {
    name: "about",
    titleKey: "settings.routes.about.title",
    descriptionKey: "settings.routes.about.description",
  },
]

export const SETTINGS_SCREEN_TITLE_KEYS: Record<string, string> = {
  index: "settings.routes.index.title",
  appearance: "settings.routes.appearance.title",
  language: "settings.routes.language.title",
  audio: "settings.routes.audio.title",
  notifications: "settings.routes.notifications.title",
  library: "settings.routes.library.title",
  advanced: "settings.routes.advanced.title",
  about: "settings.routes.about.title",
  "folder-filters": "settings.routes.folderFilters.title",
  "split-multiple-values": "settings.routes.splitMultipleValues.title",
  "track-duration-filter": "settings.routes.trackDurationFilter.title",
  "log-level": "settings.routes.logLevel.title",
}
