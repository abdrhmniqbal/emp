import { useCallback, useEffect, useRef, useState } from "react"
import { AppState, type AppStateStatus } from "react-native"
import * as MediaLibrary from "expo-media-library"

import { bootstrapApp } from "@/modules/bootstrap/bootstrap.utils"
import {
  ensureAutoScanConfigLoaded,
  startIndexing,
} from "@/modules/indexer"
import { requestMediaLibraryPermission } from "@/core/storage/media-library.service"

export function useAppBootstrap() {
  const [isInitialized, setIsInitialized] = useState(false)
  const lastAutoScanAtRef = useRef(0)

  const runAutoScan = useCallback(async () => {
    const now = Date.now()
    const MIN_AUTO_SCAN_INTERVAL_MS = 5000
    if (now - lastAutoScanAtRef.current < MIN_AUTO_SCAN_INTERVAL_MS) {
      return
    }

    const isAutoScanEnabled = await ensureAutoScanConfigLoaded()
    if (!isAutoScanEnabled) {
      return
    }

    const { status } = await requestMediaLibraryPermission()
    if (status !== "granted") {
      return
    }

    lastAutoScanAtRef.current = now
    // Auto-scan only checks and processes changed files.
    await startIndexing(false, false)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function initialize() {
      await bootstrapApp()
      if (isMounted) {
        setIsInitialized(true)
      }
    }

    void initialize()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let previousState: AppStateStatus = AppState.currentState

    const subscription = AppState.addEventListener("change", (nextState) => {
      const isReturningToForeground =
        (previousState === "background" || previousState === "inactive") &&
        nextState === "active"
      previousState = nextState

      if (!isReturningToForeground) {
        return
      }

      void runAutoScan()
    })

    return () => {
      subscription.remove()
    }
  }, [runAutoScan])

  useEffect(() => {
    const subscription = MediaLibrary.addListener(() => {
      void runAutoScan()
    })

    return () => {
      subscription.remove()
    }
  }, [runAutoScan])

  return { isInitialized }
}
