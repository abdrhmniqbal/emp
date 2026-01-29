import { atom } from 'nanostores';
import * as MediaLibrary from 'expo-media-library';
import { createAudioPlayer, AudioPlayer, AudioStatus } from 'expo-audio';
import { MediaControl, PlaybackState, Command } from 'expo-media-control';
import { initDatabase, getTracksFromDB, insertTracksToDB, addToHistory, clearTracksDB } from '@/utils/database';
import { getAudioMetadata } from '@missingcore/audio-metadata';
import { showProgress, updateProgress, hideProgress } from './ui-store';

export interface LyricLine {
    time: number;
    text: string;
}

export interface Track {
    id: string;
    title: string;
    artist?: string;
    album?: string;
    duration: number; // in seconds
    uri: string;
    image?: string;
    lyrics?: LyricLine[];
    scan_time?: number;
}

export const $tracks = atom<Track[]>([]);
export const $currentTrack = atom<Track | null>(null);
export const $isPlaying = atom(false);
export const $currentTime = atom(0);
export const $duration = atom(0);

let player: AudioPlayer | null = null;
let currentTrackIndex = -1;

// Initialize DB on module load
initDatabase();

export const setupPlayer = async () => {
    // MediaControl initialization is handled when playing a track
    // but we can pre-enable it here.
    try {
        await MediaControl.enableMediaControls({
            capabilities: [
                Command.PLAY,
                Command.PAUSE,
                Command.NEXT_TRACK,
                Command.PREVIOUS_TRACK,
                Command.SEEK,
            ],
            notification: {
                icon: 'notification_icon',
                showWhenClosed: true,
            }
        });

        // Add remote listeners
        MediaControl.addListener((event) => {
            switch (event.command) {
                case Command.PLAY:
                    resumeTrack();
                    break;
                case Command.PAUSE:
                    pauseTrack();
                    break;
                case Command.NEXT_TRACK:
                    playNext();
                    break;
                case Command.PREVIOUS_TRACK:
                    playPrevious();
                    break;
                case Command.SEEK:
                    if (event.data?.position !== undefined) {
                        seekTo(event.data.position);
                    }
                    break;
            }
        });
    } catch (e) {
        console.error("Failed to setup MediaControl", e);
    }
};

export const loadTracks = async (force = false) => {
    if (!force) {
        const cachedTracks = getTracksFromDB();
        if (cachedTracks && cachedTracks.length > 0) {
            $tracks.set(cachedTracks);
            return;
        }
    } else {
        clearTracksDB();
    }

    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) return;

    const media = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        first: 500,
    });

    if (media.assets.length === 0) return;

    showProgress("Scanning media library...");
    let completed = 0;
    const total = media.assets.length;
    const existingTracks = getTracksFromDB();
    const existingTracksMap = new Map(existingTracks.map(t => [t.id, t]));

    const loadedTracks: Track[] = await Promise.all(media.assets.map(async (asset) => {
        const existing = existingTracksMap.get(asset.id);
        const lastScanTime = existing?.scan_time || 0;

        // asset.modificationTime is in ms for Expo MediaLibrary
        const isModified = asset.modificationTime > lastScanTime;

        let track: Track;

        if (existing && !isModified && !force) {
            track = existing;
        } else {
            let metadata: any = {};
            try {
                const wantedTags = ['artist', 'artwork', 'name', 'album'] as const;
                const result = await getAudioMetadata(asset.uri, wantedTags);
                metadata = result.metadata || {};
            } catch (e) {
                console.warn("Failed to get metadata for", asset.uri, e);
            }

            const imageUri = metadata?.artwork;
            const trackTitle = metadata?.name || asset.filename?.replace(/\.[^/.]+$/, "") || "Untitled Song";
            const trackArtist = metadata?.artist || "Unknown Artist";
            const trackAlbum = metadata?.album || "Unknown Album";

            track = {
                id: asset.id,
                title: trackTitle,
                artist: trackArtist,
                album: trackAlbum,
                duration: asset.duration,
                uri: asset.uri,
                image: imageUri,
                scan_time: Date.now(),
                lyrics: existing?.lyrics || [
                    { time: 0, text: "🎶 Start of the song" },
                ]
            };
        }

        completed++;
        updateProgress((completed / total) * 100, `Processing ${completed}/${total}: ${asset.filename || 'Unknown'}`);

        return track;
    }));

    hideProgress();
    insertTracksToDB(loadedTracks);
    $tracks.set(loadedTracks);
};

const setupPlayerListeners = () => {
    if (!player) return;

    player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
        $currentTime.set(status.currentTime);
        $duration.set(status.duration);
        $isPlaying.set(status.playing);

        // Update MediaControl state
        MediaControl.updatePlaybackState(
            status.playing ? PlaybackState.PLAYING : PlaybackState.PAUSED,
            status.currentTime
        );

        if (status.didJustFinish) {
            playNext();
        }
    });
};

export const playTrack = async (track: Track) => {
    if (!player) {
        player = createAudioPlayer(track.uri);
        setupPlayerListeners();
    } else {
        player.replace(track.uri);
    }

    $currentTrack.set(track);
    currentTrackIndex = $tracks.get().findIndex(t => t.id === track.id);
    addToHistory(track.id);

    // Start playback first to ensure MediaSession is active
    player.play();
    $isPlaying.set(true);

    // Sync metadata to system controls
    try {
        await MediaControl.updateMetadata({
            title: track.title,
            artist: track.artist,
            album: track.album || "Unknown Album",
            duration: track.duration,
            artwork: track.image ? { uri: track.image } : undefined,
        });

        // Update state immediately to trigger notification display
        MediaControl.updatePlaybackState(PlaybackState.PLAYING, 0);
    } catch (e) {
        console.warn("Failed to update media control metadata", e);
    }
};

export const pauseTrack = () => {
    if (player) {
        player.pause();
        $isPlaying.set(false);
        MediaControl.updatePlaybackState(PlaybackState.PAUSED, player.currentTime);
    }
};

export const resumeTrack = () => {
    if (player) {
        player.play();
        $isPlaying.set(true);
        MediaControl.updatePlaybackState(PlaybackState.PLAYING, player.currentTime);
    }
};

export const togglePlayback = () => {
    if (!player) return;
    if (player.playing) {
        pauseTrack();
    } else {
        resumeTrack();
    }
};

export const playNext = () => {
    const tracks = $tracks.get();
    if (tracks.length === 0) return;

    let nextIndex = currentTrackIndex + 1;
    if (nextIndex >= tracks.length) nextIndex = 0;

    playTrack(tracks[nextIndex]);
};

export const playPrevious = () => {
    const tracks = $tracks.get();
    if (tracks.length === 0) return;

    let prevIndex = currentTrackIndex - 1;
    if (prevIndex < 0) prevIndex = tracks.length - 1;

    playTrack(tracks[prevIndex]);
};

export const seekTo = (seconds: number) => {
    if (player) {
        player.seekTo(seconds);
        MediaControl.updatePlaybackState(
            player.playing ? PlaybackState.PLAYING : PlaybackState.PAUSED,
            seconds
        );
    }
};

