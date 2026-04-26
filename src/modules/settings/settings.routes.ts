/**
 * Purpose: Defines settings category links and native stack titles for settings screens.
 * Caller: Settings index route and settings stack layout.
 * Dependencies: Settings route type definitions.
 * Main Functions: SETTINGS_CATEGORY_ROUTES, SETTINGS_SCREEN_TITLES.
 * Side Effects: None.
 */

import type { SettingsRouteDefinition } from "./settings.types"

export const SETTINGS_CATEGORY_ROUTES: SettingsRouteDefinition[] = [
  {
    name: "appearance",
    title: "Appearance",
    description: "Theme and visual preferences.",
  },
  {
    name: "audio",
    title: "Audio",
    description: "Playback transitions and audio behavior.",
  },
  {
    name: "notifications",
    title: "Notifications",
    description: "Notification behavior and alerts.",
  },
  {
    name: "library",
    title: "Library",
    description: "Scanning, filters, and indexing behavior.",
  },
  {
    name: "advanced",
    title: "Advanced",
    description: "System-level and troubleshooting settings.",
  },
  {
    name: "about",
    title: "About",
    description: "App information and build details.",
  },
]

export const SETTINGS_SCREEN_TITLES: Record<string, string> = {
  index: "Settings",
  appearance: "Appearance",
  audio: "Audio",
  notifications: "Notifications",
  library: "Library",
  advanced: "Advanced",
  about: "About",
  "folder-filters": "Folder Filters",
  "track-duration-filter": "Track Duration Filter",
  "log-level": "Log Level",
}
