export type SettingsRouteName =
  | "index"
  | "appearance"
  | "library"
  | "advanced"
  | "about"
  | "folder-filters"
  | "track-duration-filter"
  | "log-level"

export interface SettingsRouteDefinition {
  name: SettingsRouteName
  title: string
  description?: string
}

export type AppLogLevel = "minimal" | "extra"

export interface LoggingConfig {
  level: AppLogLevel
}

export type TrackDurationFilterMode =
  | "off"
  | "min30s"
  | "min60s"
  | "min120s"
  | "custom"

export interface TrackDurationFilterConfig {
  mode: TrackDurationFilterMode
  customMinimumSeconds: number
}
