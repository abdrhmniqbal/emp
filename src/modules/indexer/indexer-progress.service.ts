import type { IndexerScanProgress } from "@/modules/indexer/indexer.types"
import { logInfo, logWarn } from "@/modules/logging/logging.service"
import {
  beginIndexerProgressNotification,
  completeIndexerProgressNotification,
  dismissIndexerProgressNotification,
  failIndexerProgressNotification,
  updateIndexerProgressNotification,
} from "@/modules/indexer/indexer-notification.service"

import {
  getDefaultIndexerState,
  getIndexerState,
  updateIndexerState,
} from "./indexer.store"

const VISIBLE_PROGRESS_UPDATE_INTERVAL_MS = 120
const NOTIFICATION_PROGRESS_UPDATE_INTERVAL_MS = 1000

let lastVisibleProgressUpdateAt = 0
let lastNotificationProgressUpdateAt = 0

export function beginIndexerProgress(showProgress: boolean) {
  lastVisibleProgressUpdateAt = 0
  lastNotificationProgressUpdateAt = 0
  logInfo("Indexer progress started", { showProgress })

  if (showProgress) {
    void beginIndexerProgressNotification()
  }

  if (!showProgress) {
    updateIndexerState({
      ...getDefaultIndexerState(),
      showProgress: false,
    })
    logInfo("Indexer progress hidden for this run")
    return
  }

  updateIndexerState({
    ...getDefaultIndexerState(),
    isIndexing: true,
    phase: "scanning",
    showProgress,
  })
}

export function updateIndexerProgress(progress: IndexerScanProgress) {
  const state = getIndexerState()
  if (!state.showProgress) {
    return
  }

  const now = Date.now()
  if (
    progress.phase !== "complete" &&
    progress.current < progress.total &&
    now - lastVisibleProgressUpdateAt < VISIBLE_PROGRESS_UPDATE_INTERVAL_MS
  ) {
    return
  }

  lastVisibleProgressUpdateAt = now

  if (
    progress.phase === "complete" ||
    now - lastNotificationProgressUpdateAt >=
      NOTIFICATION_PROGRESS_UPDATE_INTERVAL_MS
  ) {
    lastNotificationProgressUpdateAt = now
    void updateIndexerProgressNotification(progress)
  }

  updateIndexerState({
    phase: progress.phase === "scanning" ? "scanning" : "processing",
    currentFile: progress.currentFile,
    processedFiles: progress.current,
    totalFiles: progress.total,
    progress: progress.total > 0 ? (progress.current / progress.total) * 100 : 0,
  })
}

export function completeIndexerProgress() {
  if (!getIndexerState().showProgress) {
    logInfo("Indexer progress completed while progress UI hidden")
    void dismissIndexerProgressNotification()
    resetIndexerProgress()
    return
  }

  updateIndexerState({
    phase: "complete",
    progress: 100,
    isIndexing: false,
  })
  const totalFiles = getIndexerState().totalFiles
  void completeIndexerProgressNotification(totalFiles)
  logInfo("Indexer progress completed")
}

export function resetIndexerProgress() {
  void dismissIndexerProgressNotification()
  updateIndexerState({
    ...getDefaultIndexerState(),
  })
}

export function failIndexerProgress() {
  if (!getIndexerState().showProgress) {
    logWarn("Indexer progress failed while progress UI hidden")
    void dismissIndexerProgressNotification()
    resetIndexerProgress()
    return
  }

  updateIndexerState({
    isIndexing: false,
    phase: "idle",
    showProgress: false,
  })
  void failIndexerProgressNotification()
  logWarn("Indexer progress failed")
}

export function hideIndexerProgress() {
  if (!getIndexerState().showProgress) {
    logInfo("Indexer progress hide requested while already hidden")
    void dismissIndexerProgressNotification()
    resetIndexerProgress()
    return
  }

  void dismissIndexerProgressNotification()
  updateIndexerState({ phase: "idle", showProgress: false })
  logInfo("Indexer progress hidden")
}

export function getIndexerProgressSnapshot() {
  const state = getIndexerState()
  return {
    processedFiles: state.processedFiles,
    totalFiles: state.totalFiles,
  }
}
