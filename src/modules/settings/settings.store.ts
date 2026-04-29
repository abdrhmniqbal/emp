/**
 * Purpose: Stores local settings defaults and the app-wide settings state.
 * Caller: Settings screens, localization, settings persistence modules, bootstrap preload, and services reading preferences.
 * Dependencies: Zustand, settings type definitions.
 * Main Functions: useSettingsStore, getSettingsState(), updateSettingsState(), default config getters.
 * Side Effects: Mutates in-memory Zustand settings state.
 */

import { create } from "zustand"

import type {
  AudioPlaybackConfig,
  CrossfadeConfig,
  FolderFilterConfig,
  LanguageCode,
  LoggingConfig,
  SplitMultipleValueConfig,
  TrackDurationFilterConfig,
} from "./settings.types"

const DEFAULT_LANGUAGE_CODE: LanguageCode = "en"
const DEFAULT_AUTO_SCAN_ENABLED = true
const DEFAULT_INDEXER_NOTIFICATIONS_ENABLED = true
const DEFAULT_CROSSFADE_CONFIG: CrossfadeConfig = {
  isEnabled: false,
  durationSeconds: 5,
}
const DEFAULT_AUDIO_PLAYBACK_CONFIG: AudioPlaybackConfig = {
  fadePlayPauseStop: true,
  fadeOnSeek: false,
  resumeAfterCall: true,
  resumeOnStart: false,
  resumeOnReopen: false,
  shortAudioFocusChange: false,
  pauseInCall: true,
  resumeOnFocusGain: true,
  duckVolume: true,
  permanentAudioFocusChange: true,
}
const DEFAULT_FOLDER_FILTER_CONFIG: FolderFilterConfig = {
  whitelist: [],
  blacklist: [],
}
const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  level: "minimal",
}
const DEFAULT_TRACK_DURATION_FILTER: TrackDurationFilterConfig = {
  mode: "off",
  customMinimumSeconds: 180,
}

const DEFAULT_SPLIT_MULTIPLE_VALUE_CONFIG: SplitMultipleValueConfig = {
  artistSplitSymbols: [";", "/", "&", ",", "ft.", "feat."],
  unsplitArtists: [],
  artistSplitMode: "split",
  genreSplitSymbols: [";", "/", "&", ","],
}

interface SettingsState {
  languageCode: LanguageCode
  autoScanEnabled: boolean
  indexerNotificationsEnabled: boolean
  crossfadeConfig: CrossfadeConfig
  audioPlaybackConfig: AudioPlaybackConfig
  folderFilterConfig: FolderFilterConfig
  loggingConfig: LoggingConfig
  trackDurationFilterConfig: TrackDurationFilterConfig
  splitMultipleValueConfig: SplitMultipleValueConfig
}

export const useSettingsStore = create<SettingsState>(() => ({
  languageCode: DEFAULT_LANGUAGE_CODE,
  autoScanEnabled: DEFAULT_AUTO_SCAN_ENABLED,
  indexerNotificationsEnabled: DEFAULT_INDEXER_NOTIFICATIONS_ENABLED,
  crossfadeConfig: DEFAULT_CROSSFADE_CONFIG,
  audioPlaybackConfig: DEFAULT_AUDIO_PLAYBACK_CONFIG,
  folderFilterConfig: DEFAULT_FOLDER_FILTER_CONFIG,
  loggingConfig: DEFAULT_LOGGING_CONFIG,
  trackDurationFilterConfig: DEFAULT_TRACK_DURATION_FILTER,
  splitMultipleValueConfig: DEFAULT_SPLIT_MULTIPLE_VALUE_CONFIG,
}))

export function getDefaultLanguageCode() {
  return DEFAULT_LANGUAGE_CODE
}

export function getDefaultAutoScanEnabled() {
  return DEFAULT_AUTO_SCAN_ENABLED
}

export function getDefaultLoggingConfig() {
  return DEFAULT_LOGGING_CONFIG
}

export function getDefaultIndexerNotificationsEnabled() {
  return DEFAULT_INDEXER_NOTIFICATIONS_ENABLED
}

export function getDefaultCrossfadeConfig() {
  return DEFAULT_CROSSFADE_CONFIG
}

export function getDefaultAudioPlaybackConfig() {
  return DEFAULT_AUDIO_PLAYBACK_CONFIG
}

export function getDefaultFolderFilterConfig() {
  return DEFAULT_FOLDER_FILTER_CONFIG
}

export function getDefaultTrackDurationFilterConfig() {
  return DEFAULT_TRACK_DURATION_FILTER
}

export function getSettingsState() {
  return useSettingsStore.getState()
}

export function updateSettingsState(updates: Partial<SettingsState>) {
  useSettingsStore.setState(updates)
}

export function getDefaultSplitMultipleValueConfig() {
  return DEFAULT_SPLIT_MULTIPLE_VALUE_CONFIG
}
