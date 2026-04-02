import * as MediaLibrary from "expo-media-library"
import { AppState, type AppStateStatus } from "react-native"

import { runAutoScan } from "@/modules/bootstrap/bootstrap.runtime"

export function shouldTriggerAutoScanOnMediaLibraryEvent(
  event: MediaLibrary.MediaLibraryAssetsChangeEvent
) {
  return (
    event.hasIncrementalChanges === false ||
    (event.deletedAssets?.length ?? 0) > 0
  )
}

export function registerBootstrapListeners() {
  let previousState: AppStateStatus = AppState.currentState

  const appStateSubscription = AppState.addEventListener("change", (nextState) => {
    const isReturningToForeground =
      (previousState === "background" || previousState === "inactive") &&
      nextState === "active"
    previousState = nextState

    if (!isReturningToForeground) {
      return
    }

    void runAutoScan()
  })

  const mediaLibrarySubscription = MediaLibrary.addListener((event) => {
    void runAutoScan({
      bypassThrottle: shouldTriggerAutoScanOnMediaLibraryEvent(event),
    })
  })

  return () => {
    appStateSubscription.remove()
    mediaLibrarySubscription.remove()
  }
}
