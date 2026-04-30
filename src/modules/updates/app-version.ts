/**
 * Purpose: Resolves the installed app version and preview-release status.
 * Caller: App update settings, update checker service, and update-related screens.
 * Dependencies: Expo Application and Constants metadata.
 * Main Functions: getCurrentAppVersion(), isPreviewReleaseVersion()
 * Side Effects: None.
 */

import * as Application from "expo-application"
import Constants from "expo-constants"

const PREVIEW_VERSION_PATTERN = /(?:^|[-.])(alpha|beta|rc|preview)(?:$|[-.\d])/i

export function getCurrentAppVersion() {
  return (
    Application.nativeApplicationVersion ||
    Constants.nativeAppVersion ||
    Constants.expoConfig?.version ||
    ""
  )
}

export function isPreviewReleaseVersion(version: string) {
  return PREVIEW_VERSION_PATTERN.test(version)
}
