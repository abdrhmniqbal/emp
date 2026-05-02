/**
 * Purpose: Orchestrates database migration completion and initial DB state loading without component-owned effects.
 * Caller: Database provider.
 * Dependencies: Database startup loader and logging service.
 * Main Functions: syncDatabaseRuntime(), subscribeDatabaseRuntime(), getDatabaseRuntimeSnapshot()
 * Side Effects: Loads cached DB state, emits runtime updates, and calls ready/error callbacks.
 */

import { loadInitialDatabaseState } from "@/modules/bootstrap/database-startup.service"
import { logError, logInfo } from "@/modules/logging/logging.service"

type DatabaseRuntimeStatus =
  | "idle"
  | "waiting-migrations"
  | "loading"
  | "ready"
  | "error"

interface DatabaseRuntimeSnapshot {
  status: DatabaseRuntimeStatus
  error: Error | null
}

interface SyncDatabaseRuntimeOptions {
  success: boolean
  error: Error | undefined
  onReady?: () => void
  onError?: () => void
}

type DatabaseRuntimeListener = () => void

let snapshot: DatabaseRuntimeSnapshot = {
  status: "idle",
  error: null,
}
let activeOnReady: (() => void) | undefined
let activeOnError: (() => void) | undefined
const listeners = new Set<DatabaseRuntimeListener>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function updateSnapshot(nextSnapshot: DatabaseRuntimeSnapshot) {
  snapshot = nextSnapshot
  emitChange()
}

function failDatabaseRuntime(error: Error) {
  if (snapshot.status === "error" && snapshot.error === error) {
    return
  }

  updateSnapshot({
    status: "error",
    error,
  })
  logError("Database provider failed", error)
  activeOnError?.()
}

export function getDatabaseRuntimeSnapshot() {
  return snapshot
}

export function subscribeDatabaseRuntime(listener: DatabaseRuntimeListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function syncDatabaseRuntime({
  success,
  error,
  onReady,
  onError,
}: SyncDatabaseRuntimeOptions) {
  activeOnReady = onReady
  activeOnError = onError

  if (snapshot.status === "idle") {
    updateSnapshot({
      status: "waiting-migrations",
      error: null,
    })
    logInfo("Database provider waiting for migrations")
  }

  if (error) {
    failDatabaseRuntime(error)
    return
  }

  if (!success) {
    return
  }

  if (snapshot.status === "loading" || snapshot.status === "ready") {
    return
  }

  updateSnapshot({
    status: "loading",
    error: null,
  })
  logInfo("Database migrations completed, loading initial database state")

  void loadInitialDatabaseState()
    .then(() => {
      updateSnapshot({
        status: "ready",
        error: null,
      })
      logInfo("Database provider ready")
      activeOnReady?.()
    })
    .catch((loadTracksError) => {
      failDatabaseRuntime(loadTracksError as Error)
    })
}
