// Indexer feature exports
export { scanMediaLibrary } from "./indexer.api"
export {
  $autoScanEnabled,
  ensureAutoScanConfigLoaded,
  setAutoScanEnabled,
} from "./auto-scan"
export {
  $folderFilterConfig,
  clearFolderFilters,
  ensureFolderFilterConfigLoaded,
  getFolderNameFromPath,
  getFolderPathFromUri,
  setAllFolderFiltersMode,
  setFolderFilterMode,
  type FolderFilterConfig,
  type FolderFilterMode,
} from "./folder-filters"
export {
  $indexerState,
  forceReindexLibrary,
  type IndexerState,
  pauseIndexing,
  resumeIndexing,
  startIndexing,
  stopIndexing,
} from "./indexer.store"
export type { IndexerScanProgress } from "./indexer.types"
export type { ScanProgress } from "./indexer.utils"
export { extractMetadata, saveArtworkToCache } from "./metadata.api"
