/**
 * Purpose: Orchestrates indexer runs, progress state, cancellation, queued runs, and incremental UI refresh.
 * Caller: Settings/library refresh controls, bootstrap auto-scan, notification actions.
 * Dependencies: Indexer repository/runtime/progress services, indexed media refresh service, logging service.
 * Main Functions: startIndexing(), forceReindexLibrary(), stopIndexing(), pauseIndexing(), resumeIndexing(), cancelIndexing().
 * Side Effects: Reads media library through repository, writes indexer progress/runtime state, refreshes player/query caches.
 */

import { refreshIndexedMediaState } from "@/modules/indexer/indexer-refresh.service"
import { scanMediaLibrary } from "@/modules/indexer/indexer.repository"
import {
  consumeQueuedIndexerRun,
  finishIndexerRunRuntime,
  isIndexerRunActive,
  isIndexerRunPaused,
  isIndexerRunStale,
  pauseIndexerRunRuntime,
  queueIndexerRun,
  resumeIndexerRunRuntime,
  scheduleIndexerCompletePhaseReset,
  startIndexerRunRuntime,
  stopIndexerRunRuntime,
} from "@/modules/indexer/indexer-runtime"
import {
  beginIndexerProgress,
  completeIndexerProgress,
  failIndexerProgress,
  getIndexerProgressSnapshot,
  hideIndexerProgress,
  pauseIndexerProgress,
  resetIndexerProgress,
  resumeIndexerProgress,
  updateIndexerProgress,
} from "@/modules/indexer/indexer-progress.service"
import { logError, logInfo, logWarn } from "@/modules/logging/logging.service"

const INCREMENTAL_REFRESH_INTERVAL_MS = 1500

export async function startIndexing(
  forceFullScan = false,
  showProgress = true
) {
  if (isIndexerRunActive()) {
    queueIndexerRun(forceFullScan, showProgress)
    logInfo("Indexer run queued while another run is active", {
      forceFullScan,
      showProgress,
    })
    return
  }

  const { controller, runToken: currentRunToken } = startIndexerRunRuntime()

  beginIndexerProgress(showProgress)
  logInfo("Indexer started", { forceFullScan, showProgress })
  let lastIncrementalRefreshAt = 0

  try {
    await scanMediaLibrary(
      (progress) => {
        if (isIndexerRunStale(controller, currentRunToken)) {
          return
        }

        updateIndexerProgress(progress)
      },
      forceFullScan,
      controller.signal,
      async () => {
        if (isIndexerRunStale(controller, currentRunToken)) {
          return
        }

        const now = Date.now()
        if (now - lastIncrementalRefreshAt < INCREMENTAL_REFRESH_INTERVAL_MS) {
          return
        }

        lastIncrementalRefreshAt = now
        try {
          await refreshIndexedMediaState()
        } catch (error) {
          logError("Incremental indexed media refresh failed", error)
        }
      }
    )

    if (isIndexerRunStale(controller, currentRunToken)) {
      return
    }

    await refreshIndexedMediaState()

    completeIndexerProgress()
    const progressSnapshot = getIndexerProgressSnapshot()
    logInfo("Indexer completed successfully", {
      forceFullScan,
      processedFiles: progressSnapshot.processedFiles,
      totalFiles: progressSnapshot.totalFiles,
    })

    scheduleIndexerCompletePhaseReset(currentRunToken, () => {
      hideIndexerProgress({ keepNotification: showProgress })
    })
  } catch (error) {
    if (isIndexerRunStale(controller, currentRunToken)) {
      return
    }

    logError("Indexer run failed", error, { forceFullScan, showProgress })
    failIndexerProgress()
  } finally {
    finishIndexerRunRuntime(controller)

    const nextQueuedRun = consumeQueuedIndexerRun(controller, currentRunToken)
    if (!nextQueuedRun) {
      return
    }

    logInfo("Starting queued indexer run", {
      forceFullScan: nextQueuedRun.forceFullScan,
      showProgress: nextQueuedRun.showProgress,
    })
    void startIndexing(nextQueuedRun.forceFullScan, nextQueuedRun.showProgress)
  }
}

export async function forceReindexLibrary(showProgress = true) {
  await startIndexing(true, showProgress)
}

export function stopIndexing() {
  logWarn("Indexer stopped")
  stopIndexerRunRuntime()
  resetIndexerProgress()
  logInfo("Indexer stop handling completed")
}

export function pauseIndexing() {
  const didPause = pauseIndexerRunRuntime()
  if (!didPause) {
    return false
  }

  pauseIndexerProgress()
  logInfo("Indexer paused")
  return true
}

export function resumeIndexing() {
  const didResume = resumeIndexerRunRuntime()
  if (!didResume) {
    return false
  }

  resumeIndexerProgress()
  logInfo("Indexer resumed")
  return true
}

export function cancelIndexing() {
  if (!isIndexerRunActive() && !isIndexerRunPaused()) {
    return false
  }

  stopIndexing()
  logInfo("Indexer canceled")
  return true
}
