import * as SQLite from 'expo-sqlite';
import { Track } from '@/store/player-store';

export const db = SQLite.openDatabaseSync('emp_music.db');

export const initDatabase = () => {
    db.execSync(`
        CREATE TABLE IF NOT EXISTS tracks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            artist TEXT,
            album TEXT,
            duration REAL,
            uri TEXT NOT NULL,
            image TEXT,
            lyrics TEXT,
            file_hash TEXT,
            scan_time INTEGER DEFAULT 0,
            is_deleted INTEGER DEFAULT 0
        );
        
        CREATE INDEX IF NOT EXISTS idx_tracks_file_hash ON tracks(file_hash);
        CREATE INDEX IF NOT EXISTS idx_tracks_is_deleted ON tracks(is_deleted);
        
        CREATE TABLE IF NOT EXISTS history (
            id TEXT PRIMARY KEY,
            track_id TEXT,
            timestamp INTEGER,
            FOREIGN KEY(track_id) REFERENCES tracks(id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp);
    `);

    runMigrations();
};

const runMigrations = () => {
    const tableInfo: any[] = db.getAllSync('PRAGMA table_info(tracks)');
    const columns = new Set(tableInfo.map(col => col.name));

    if (!columns.has('lyrics')) {
        db.execSync('ALTER TABLE tracks ADD COLUMN lyrics TEXT');
    }
    if (!columns.has('album')) {
        db.execSync('ALTER TABLE tracks ADD COLUMN album TEXT');
    }
    if (!columns.has('scan_time')) {
        db.execSync('ALTER TABLE tracks ADD COLUMN scan_time INTEGER DEFAULT 0');
    }
    if (!columns.has('file_hash')) {
        db.execSync('ALTER TABLE tracks ADD COLUMN file_hash TEXT');
    }
    if (!columns.has('is_deleted')) {
        db.execSync('ALTER TABLE tracks ADD COLUMN is_deleted INTEGER DEFAULT 0');
    }
};

export const addToHistory = (trackId: string) => {
    const timestamp = Date.now();
    db.runSync(
        'INSERT OR REPLACE INTO history (id, track_id, timestamp) VALUES (?, ?, ?)',
        [`${trackId}-${timestamp}`, trackId, timestamp]
    );
    db.runSync(`
        DELETE FROM history 
        WHERE id NOT IN (
            SELECT id FROM history ORDER BY timestamp DESC LIMIT 50
        )
    `);
};

export const getHistory = (): Track[] => {
    const rows = db.getAllSync(`
        SELECT t.* 
        FROM history h 
        JOIN tracks t ON h.track_id = t.id 
        WHERE t.is_deleted = 0
        ORDER BY h.timestamp DESC
    `) as any[];

    return rows.map(mapRowToTrack);
};

const mapRowToTrack = (row: any): Track => ({
    id: row.id,
    title: row.title,
    artist: row.artist || undefined,
    album: row.album || undefined,
    duration: row.duration,
    uri: row.uri,
    image: row.image || undefined,
    lyrics: row.lyrics ? JSON.parse(row.lyrics) : undefined,
    fileHash: row.file_hash || undefined,
    scanTime: row.scan_time || 0,
    isDeleted: row.is_deleted === 1,
});

export const getTracksFromDB = (): Track[] => {
    const rows = db.getAllSync('SELECT * FROM tracks WHERE is_deleted = 0') as any[];
    return rows.map(mapRowToTrack);
};

export const getTrackById = (id: string): Track | null => {
    const rows = db.getAllSync('SELECT * FROM tracks WHERE id = ?', [id]) as any[];
    if (rows.length === 0) return null;
    return mapRowToTrack(rows[0]);
};

export const getAllTrackIds = (): string[] => {
    const rows = db.getAllSync('SELECT id FROM tracks') as { id: string }[];
    return rows.map(r => r.id);
};

export const upsertTrack = (track: Track) => {
    db.runSync(
        `INSERT OR REPLACE INTO tracks 
            (id, title, artist, album, duration, uri, image, lyrics, file_hash, scan_time, is_deleted) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            track.id,
            track.title,
            track.artist || null,
            track.album || null,
            track.duration,
            track.uri,
            track.image || null,
            track.lyrics ? JSON.stringify(track.lyrics) : null,
            track.fileHash || null,
            track.scanTime || Date.now(),
            track.isDeleted ? 1 : 0,
        ]
    );
};

export const insertTracksToDB = (tracks: Track[]) => {
    db.withTransactionSync(() => {
        for (const track of tracks) {
            upsertTrack(track);
        }
    });
};

export const markTrackDeleted = (id: string) => {
    db.runSync('UPDATE tracks SET is_deleted = 1 WHERE id = ?', [id]);
};

export const cleanupDeletedTracks = () => {
    db.runSync('DELETE FROM tracks WHERE is_deleted = 1');
};

export const clearTracksDB = () => {
    db.runSync('DELETE FROM tracks');
};

export const clearTrackById = (id: string) => {
    db.runSync('DELETE FROM tracks WHERE id = ?', [id]);
};

export const getTrackCount = (): number => {
    const result = db.getFirstSync('SELECT COUNT(*) as count FROM tracks WHERE is_deleted = 0') as { count: number };
    return result?.count || 0;
};

export const hasExistingLibrary = (): boolean => {
    return getTrackCount() > 0;
};
