import { File, Directory, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { getAudioMetadata } from '@missingcore/audio-metadata';
import { atom } from 'nanostores';
import {
    getTracksFromDB,
    upsertTrack,
    markTrackDeleted,
    getAllTrackIds,
    cleanupDeletedTracks
} from './database';
import { $tracks, Track } from '@/store/player-store';

const ARTWORK_DIR_NAME = 'artwork';
const BATCH_SIZE = 10;
const METADATA_TAGS = ['artist', 'artwork', 'name', 'album'] as const;

export interface IndexerState {
    isIndexing: boolean;
    progress: number;
    currentFile: string;
    totalFiles: number;
    processedFiles: number;
    phase: 'idle' | 'scanning' | 'processing' | 'cleanup' | 'complete';
}

export const $indexerState = atom<IndexerState>({
    isIndexing: false,
    progress: 0,
    currentFile: '',
    totalFiles: 0,
    processedFiles: 0,
    phase: 'idle',
});

let indexerAbortController: AbortController | null = null;
let completeTimeout: NodeJS.Timeout | null = null;
let artworkCacheDir: Directory | null = null;

const updateIndexerState = (updates: Partial<IndexerState>) => {
    $indexerState.set({ ...$indexerState.get(), ...updates });
};

const getArtworkCacheDir = (): Directory => {
    if (!artworkCacheDir) {
        artworkCacheDir = new Directory(Paths.cache, ARTWORK_DIR_NAME);
    }
    return artworkCacheDir;
};

const ensureArtworkCacheDir = (): void => {
    const dir = getArtworkCacheDir();
    if (!dir.exists) {
        dir.create();
    }
};

const calculateFileHash = (uri: string, modificationTime: number, size: number): string => {
    return `${uri}-${modificationTime}-${size}`.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 64);
};

const saveArtworkToCache = (
    artworkData: string | undefined,
    trackId: string
): string | undefined => {
    if (!artworkData) return undefined;

    try {
        ensureArtworkCacheDir();
        const safeId = trackId.replace(/[^a-zA-Z0-9]/g, '_');
        const artworkFile = new File(getArtworkCacheDir(), `${safeId}.jpg`);

        if (artworkFile.exists) {
            return artworkFile.uri;
        }

        if (artworkData.startsWith('file://') || artworkData.startsWith('/')) {
            return artworkData;
        }

        let base64Data = artworkData;
        if (artworkData.startsWith('data:')) {
            const parts = artworkData.split(',');
            base64Data = parts[1] || '';
        }

        if (base64Data) {
            artworkFile.write(base64Data, { encoding: 'base64' });
        }

        return artworkFile.uri;
    } catch (e) {
        console.warn('Failed to save artwork:', e);
        return undefined;
    }
};

const processTrack = async (
    asset: MediaLibrary.Asset,
    existingTrack: Track | null,
    forceReindex: boolean
): Promise<Track | null> => {
    try {
        const fileHash = calculateFileHash(
            asset.uri,
            asset.modificationTime,
            asset.duration
        );

        if (existingTrack && !forceReindex && existingTrack.fileHash === fileHash) {
            return existingTrack;
        }

        let metadata: Record<string, any> = {};
        try {
            const result = await getAudioMetadata(asset.uri, METADATA_TAGS);
            metadata = result.metadata || {};
        } catch (e) {
            console.warn('Failed to get metadata for', asset.filename);
        }

        const artworkPath = saveArtworkToCache(metadata.artwork, asset.id);

        const track: Track = {
            id: asset.id,
            title: metadata.name || asset.filename?.replace(/\.[^/.]+$/, '') || 'Untitled',
            artist: metadata.artist || undefined,
            album: metadata.album || undefined,
            duration: asset.duration,
            uri: asset.uri,
            image: artworkPath,
            fileHash,
            scanTime: Date.now(),
            isDeleted: false,
        };

        return track;
    } catch (e) {
        console.error('Error processing track:', asset.filename, e);
        return null;
    }
};

const processBatch = async (
    assets: MediaLibrary.Asset[],
    existingTracksMap: Map<string, Track>,
    forceReindex: boolean,
    signal: AbortSignal
): Promise<Track[]> => {
    const results: Track[] = [];

    for (const asset of assets) {
        if (signal.aborted) break;

        updateIndexerState({ currentFile: asset.filename || 'Unknown' });

        const existingTrack = existingTracksMap.get(asset.id) || null;
        const track = await processTrack(asset, existingTrack, forceReindex);

        if (track) {
            results.push(track);
            upsertTrack(track);

            const currentTracks = $tracks.get();
            const existingIndex = currentTracks.findIndex(t => t.id === track.id);
            if (existingIndex >= 0) {
                const updated = [...currentTracks];
                updated[existingIndex] = track;
                $tracks.set(updated);
            } else {
                $tracks.set([...currentTracks, track]);
            }
        }

        const state = $indexerState.get();
        const processed = state.processedFiles + 1;
        updateIndexerState({
            processedFiles: processed,
            progress: (processed / state.totalFiles) * 100,
        });
    }

    return results;
};

export const startIndexing = async (forceFullScan = false): Promise<void> => {
    const currentState = $indexerState.get();
    if (currentState.isIndexing) {
        console.log('Indexing already in progress');
        return;
    }

    if (completeTimeout) {
        clearTimeout(completeTimeout);
        completeTimeout = null;
    }

    indexerAbortController = new AbortController();
    const signal = indexerAbortController.signal;

    updateIndexerState({
        isIndexing: true,
        progress: 0,
        processedFiles: 0,
        phase: 'scanning',
        currentFile: '',
        totalFiles: 0,
    });

    try {
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (!permission.granted) {
            throw new Error('Media library permission not granted');
        }

        if (!forceFullScan) {
            const cachedTracks = getTracksFromDB().filter(t => !t.isDeleted);
            if (cachedTracks.length > 0) {
                $tracks.set(cachedTracks);
            }
        }

        let allAssets: MediaLibrary.Asset[] = [];
        let hasMore = true;
        let endCursor: string | undefined;

        while (hasMore && !signal.aborted) {
            const result = await MediaLibrary.getAssetsAsync({
                mediaType: MediaLibrary.MediaType.audio,
                first: 500,
                after: endCursor,
            });

            allAssets = [...allAssets, ...result.assets];
            hasMore = result.hasNextPage;
            endCursor = result.endCursor;
        }

        if (signal.aborted) return;

        updateIndexerState({
            totalFiles: allAssets.length,
            phase: 'processing',
        });

        const existingTracks = getTracksFromDB();
        const existingTracksMap = new Map(existingTracks.map(t => [t.id, t]));
        const currentAssetIds = new Set(allAssets.map(a => a.id));

        for (let i = 0; i < allAssets.length && !signal.aborted; i += BATCH_SIZE) {
            const batch = allAssets.slice(i, i + BATCH_SIZE);
            await processBatch(batch, existingTracksMap, forceFullScan, signal);
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        if (signal.aborted) return;

        updateIndexerState({ phase: 'cleanup' });

        const allDbTrackIds = getAllTrackIds();
        for (const trackId of allDbTrackIds) {
            if (!currentAssetIds.has(trackId)) {
                markTrackDeleted(trackId);
                const currentTracks = $tracks.get();
                $tracks.set(currentTracks.filter(t => t.id !== trackId));
            }
        }

        cleanupDeletedTracks();

        updateIndexerState({
            isIndexing: false,
            phase: 'complete',
            progress: 100,
        });

        completeTimeout = setTimeout(() => {
            updateIndexerState({ phase: 'idle' });
        }, 3000);

    } catch (e) {
        console.error('Indexing error:', e);
        updateIndexerState({
            isIndexing: false,
            phase: 'idle',
        });
    } finally {
        indexerAbortController = null;
    }
};

export const stopIndexing = (): void => {
    if (indexerAbortController) {
        indexerAbortController.abort();
        updateIndexerState({
            isIndexing: false,
            phase: 'idle',
        });
    }
};

export const loadTracksFromCache = (): void => {
    const cachedTracks = getTracksFromDB().filter(t => !t.isDeleted);
    $tracks.set(cachedTracks);
};

export const clearArtworkCache = (): void => {
    try {
        const dir = getArtworkCacheDir();
        if (dir.exists) {
            dir.delete();
        }
        artworkCacheDir = null;
    } catch (e) {
        console.warn('Failed to clear artwork cache:', e);
    }
};
