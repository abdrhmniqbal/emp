import { queryClient } from "@/lib/tanstack-query"
import { invalidateIndexerQueries } from "@/modules/indexer/indexer.keys"
import { logInfo } from "@/modules/logging/logging.service"
import { loadTracks } from "@/modules/player/player-library.service"

export async function refreshIndexedMediaState() {
  logInfo("Refreshing indexed media state")
  await loadTracks()
  await invalidateIndexerQueries(queryClient)
  logInfo("Indexed media state refreshed")
}
