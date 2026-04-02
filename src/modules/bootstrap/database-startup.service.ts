import { logInfo } from "@/modules/logging/logging.service"
import { loadTracks } from "@/modules/player/player-library.service"

export async function loadInitialDatabaseState() {
  logInfo("Database migrations completed, loading cached tracks")
  await loadTracks()
  logInfo("Cached tracks loaded")
}
