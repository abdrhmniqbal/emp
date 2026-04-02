import { logError, logInfo } from "@/modules/logging/logging.service"
import { loadTracks } from "@/modules/player/player-library.service"

export async function loadInitialDatabaseState() {
  try {
    logInfo("Database startup loading cached tracks")
    await loadTracks()
    logInfo("Database startup cached tracks loaded")
  } catch (error) {
    logError("Database startup failed to load cached tracks", error)
    throw error
  }
}
