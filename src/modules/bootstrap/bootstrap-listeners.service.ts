import * as MediaLibrary from "expo-media-library"
import { AppState, type AppStateStatus } from "react-native"

import { runAutoScan } from "@/modules/bootstrap/bootstrap.runtime"
import { logInfo } from "@/modules/logging/logging.service"

export function shouldTriggerAutoScanOnMediaLibraryEvent(
  event: MediaLibrary.MediaLibraryAssetsChangeEvent
) {
  return (
    event.hasIncrementalChanges === false ||
    (event.deletedAssets?.length ?? 0) > 0
  )
}

export function registerBootstrapListeners() {
  logInfo("Registering bootstrap listeners")
  let previousState: AppStateStatus = AppState.currentState

  const appStateSubscription = AppState.addEventListener("change", (nextState) => {
    const isReturningToForeground =
      (previousState === "background" || previousState === "inactive") &&
      nextState === "active"
    previousState = nextState

    if (!isReturningToForeground) {
      return
    }

    logInfo("App returned to foreground, running auto scan")
    void runAutoScan()
  })

  const mediaLibrarySubscription = MediaLibrary.addListener((event) => {
    const bypassThrottle = shouldTriggerAutoScanOnMediaLibraryEvent(event)
    logInfo("Media library changed, running auto scan", {
      bypassThrottle,
      hasIncrementalChanges: event.hasIncrementalChanges,
      deletedAssetsCount: event.deletedAssets?.length ?? 0,
      insertedAssetsCount: event.insertedAssets?.length ?? 0,
    })
    void runAutoScan({
      bypassThrottle,
    })
  })

  return () => {
    logInfo("Unregistering bootstrap listeners")
    appStateSubscription.remove()
    mediaLibrarySubscription.remove()
  }
}
