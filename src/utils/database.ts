import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('emp_music.db');

export const initDatabase = () => {
    db.execSync(`
    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      title TEXT,
      artist TEXT,
      album TEXT,
      duration REAL,
      uri TEXT,
      image TEXT,
      lyrics TEXT,
      scan_time INTEGER
    );
    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      track_id TEXT,
      timestamp INTEGER,
      FOREIGN KEY(track_id) REFERENCES tracks(id)
    );
  `);

    // Migration: Add lyrics column if not exists
    const tableInfo: any[] = db.getAllSync('PRAGMA table_info(tracks)');
    const hasLyrics = tableInfo.some(column => column.name === 'lyrics');
    if (!hasLyrics) {
        db.execSync('ALTER TABLE tracks ADD COLUMN lyrics TEXT');
    }

    const hasAlbum = tableInfo.some(column => column.name === 'album');
    if (!hasAlbum) {
        db.execSync('ALTER TABLE tracks ADD COLUMN album TEXT');
    }

    const hasScanTime = tableInfo.some(column => column.name === 'scan_time');
    if (!hasScanTime) {
        db.execSync('ALTER TABLE tracks ADD COLUMN scan_time INTEGER DEFAULT 0');
    }
};

export const addToHistory = (trackId: string) => {
    const timestamp = Date.now();
    db.runSync(
        'INSERT OR REPLACE INTO history (id, track_id, timestamp) VALUES (?, ?, ?)',
        [`${trackId}-${timestamp}`, trackId, timestamp]
    );
    // Keep only last 50 entries
    db.runSync(`
        DELETE FROM history 
        WHERE id NOT IN (
            SELECT id FROM history ORDER BY timestamp DESC LIMIT 50
        )
    `);
};

export const getHistory = (): any[] => {
    return db.getAllSync(`
        SELECT t.*, h.timestamp 
        FROM history h 
        JOIN tracks t ON h.track_id = t.id 
        ORDER BY h.timestamp DESC
    `);
};

export const getTracksFromDB = (): any[] => {
    const tracks = db.getAllSync('SELECT * FROM tracks');
    return tracks.map((t: any) => ({
        ...t,
        lyrics: t.lyrics ? JSON.parse(t.lyrics) : undefined
    }));
};

export const insertTracksToDB = (tracks: any[]) => {
    db.withTransactionSync(() => {
        // Clear old tracks to ensure sync? Or maybe we want to upsert.
        // For now, let's just clear and re-insert to keep it simple and ensure we match library state
        // but the user asked not to index each time.
        // So we should probably ONLY insert if we are doing a full rescan.
        // However, the "not indexing each time" implies we load from DB first.

        // We will use INSERT OR REPLACE
        for (const track of tracks) {
            db.runSync(
                'INSERT OR REPLACE INTO tracks (id, title, artist, album, duration, uri, image, lyrics, scan_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    track.id,
                    track.title,
                    track.artist,
                    track.album,
                    track.duration,
                    track.uri,
                    track.image,
                    track.lyrics ? JSON.stringify(track.lyrics) : null,
                    track.scan_time || Date.now()
                ]
            );
        }
    });
};

export const clearTracksDB = () => {
    db.runSync('DELETE FROM tracks');
}

export const clearTrackById = (id: string) => {
    db.runSync('DELETE FROM tracks WHERE id = ?', [id]);
}
