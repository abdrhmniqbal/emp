// Indexer feature exports
export { scanMediaLibrary } from './indexer.api';
export type { ScanProgress } from './indexer.utils';
export { extractMetadata, saveArtworkToCache } from './metadata.api';
export type { IndexerScanProgress } from './indexer.types';
export { 
  $indexerState, 
  startIndexing, 
  stopIndexing, 
  pauseIndexing, 
  resumeIndexing,
  type IndexerState 
} from './indexer.store';
