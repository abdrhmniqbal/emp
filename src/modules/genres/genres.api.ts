import { db } from "@/db/client";
import { tracks } from "@/db/schema";
import type { Track } from "@/modules/player/player.types";
import { asc, desc, eq, sql } from "drizzle-orm";
import { transformDBTrackToTrack } from "@/utils/transformers";

export interface GenreAlbumInfo {
  name: string;
  artist?: string;
  image?: string;
  trackCount: number;
  year?: number;
}

export async function getAllGenres(): Promise<string[]> {
  try {
    const result = await db.query.genres.findMany({
      orderBy: (genres, { asc }) => [asc(genres.name)],
    });

    return result.map((g) => g.name);
  } catch {
    return [];
  }
}

export async function getTopTracksByGenre(genre: string, limit = 25): Promise<Track[]> {
  try {
    const trimmedGenre = genre.trim();

    const matchingGenres = await db.query.genres.findMany({
      where: (g, { sql }) => sql`${g.name} LIKE ${trimmedGenre}`,
      columns: { id: true },
    });

    if (matchingGenres.length === 0) return [];
    const genreIds = matchingGenres.map((g) => g.id);

    const loadedTracks = await db.query.tracks.findMany({
      where: (t, { and, eq }) =>
        and(
          eq(t.isDeleted, 0),
          sql`${t.id} IN (SELECT track_id FROM track_genres WHERE genre_id IN (${sql.join(genreIds.map((id) => sql`${id}`), sql`, `)}))`,
        ),
      with: {
        artist: true,
        album: true,
      },
      orderBy: [desc(tracks.playCount), desc(tracks.lastPlayedAt), asc(tracks.title)],
      limit,
    });

    return loadedTracks.map(transformDBTrackToTrack);
  } catch {
    return [];
  }
}

export async function getAllTracksByGenre(genre: string): Promise<Track[]> {
  try {
    const trimmedGenre = genre.trim();
    const matchingGenres = await db.query.genres.findMany({
      where: (g, { sql }) => sql`${g.name} LIKE ${trimmedGenre}`,
      columns: { id: true },
    });

    if (matchingGenres.length === 0) return [];
    const genreIds = matchingGenres.map((g) => g.id);

    const loadedTracks = await db.query.tracks.findMany({
      where: (t, { and, eq }) =>
        and(
          eq(t.isDeleted, 0),
          sql`${t.id} IN (SELECT track_id FROM track_genres WHERE genre_id IN (${sql.join(genreIds.map((id) => sql`${id}`), sql`, `)}))`,
        ),
      with: {
        artist: true,
        album: true,
      },
      orderBy: [desc(tracks.playCount), desc(tracks.lastPlayedAt), asc(tracks.title)],
    });

    return loadedTracks.map(transformDBTrackToTrack);
  } catch {
    return [];
  }
}

export async function getAlbumsByGenre(genre: string): Promise<GenreAlbumInfo[]> {
  try {
    const trimmedGenre = genre.trim();
    const matchingGenres = await db.query.genres.findMany({
      where: (g, { sql }) => sql`LOWER(${g.name}) LIKE LOWER(${trimmedGenre})`,
      columns: { id: true },
    });

    if (matchingGenres.length === 0) return [];
    const genreIds = matchingGenres.map((g) => g.id);

    const tracksInGenre = await db.query.tracks.findMany({
      where: (t, { and, eq }) =>
        and(
          eq(t.isDeleted, 0),
          sql`${t.id} IN (SELECT track_id FROM track_genres WHERE genre_id IN (${sql.join(genreIds.map((id) => sql`${id}`), sql`, `)}))`,
          sql`${t.albumId} IS NOT NULL`,
        ),
      with: {
        album: true,
        artist: true,
      },
    });

    const albumMap = new Map<string, GenreAlbumInfo>();

    for (const track of tracksInGenre) {
      if (track.albumId && track.album) {
        const albumName = track.album.title || "Unknown Album";
        const key = `${albumName}-${track.album.artistId || ""}`;

        if (!albumMap.has(key)) {
          albumMap.set(key, {
            name: albumName,
            artist: track.artist?.name || undefined,
            image: track.album.artwork || track.artwork || undefined,
            trackCount: 0,
            year: track.album.year || track.year || undefined,
          });
        }

        albumMap.get(key)!.trackCount++;
      }
    }

    return Array.from(albumMap.values()).sort((a, b) => b.trackCount - a.trackCount);
  } catch {
    return [];
  }
}
