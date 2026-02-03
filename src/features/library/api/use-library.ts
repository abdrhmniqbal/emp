import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/db/client";
import { tracks, artists, albums, genres, playHistory } from "@/db/schema";
import { eq, desc, asc, like, and, sql } from "drizzle-orm";
import { useDebouncedValue } from "@tanstack/react-pacer/debouncer";

const TRACKS_KEY = "tracks";
const ARTISTS_KEY = "artists";
const ALBUMS_KEY = "albums";
const GENRES_KEY = "genres";

export type TrackFilter = {
  artistId?: string;
  albumId?: string;
  genreId?: string;
  isFavorite?: boolean;
  searchQuery?: string;
  sortBy?: "title" | "artist" | "album" | "dateAdded" | "playCount" | "rating";
  sortOrder?: "asc" | "desc";
};

export function useTracks(filters?: TrackFilter) {
  return useQuery({
    queryKey: [TRACKS_KEY, filters],
    queryFn: async () => {
      const results = await db.query.tracks.findMany({
        where: and(
          eq(tracks.isDeleted, 0),
          filters?.artistId ? eq(tracks.artistId, filters.artistId) : undefined,
          filters?.albumId ? eq(tracks.albumId, filters.albumId) : undefined,
          filters?.isFavorite ? eq(tracks.isFavorite, 1) : undefined,
          filters?.searchQuery ? like(tracks.title, `%${filters.searchQuery}%`) : undefined
        ),
        with: {
          artist: true,
          album: true,
          genres: {
            with: {
              genre: true,
            },
          },
        },
      });

      const sortField = filters?.sortBy || "title";
      const sortOrder = filters?.sortOrder || "asc";
      const multiplier = sortOrder === "asc" ? 1 : -1;

      return results.sort((a, b) => {
        let aVal: string | number | null = null;
        let bVal: string | number | null = null;

        switch (sortField) {
          case "title":
            aVal = a.title.toLowerCase();
            bVal = b.title.toLowerCase();
            break;
          case "artist":
            aVal = a.artist?.name?.toLowerCase() || "";
            bVal = b.artist?.name?.toLowerCase() || "";
            break;
          case "album":
            aVal = a.album?.title?.toLowerCase() || "";
            bVal = b.album?.title?.toLowerCase() || "";
            break;
          case "dateAdded":
            aVal = a.dateAdded || 0;
            bVal = b.dateAdded || 0;
            break;
          case "playCount":
            aVal = a.playCount || 0;
            bVal = b.playCount || 0;
            break;
          case "rating":
            aVal = a.rating || 0;
            bVal = b.rating || 0;
            break;
        }

        if (aVal === null || bVal === null) return 0;
        if (aVal < bVal) return -1 * multiplier;
        if (aVal > bVal) return 1 * multiplier;
        return 0;
      });
    },
  });
}

export function useTrack(id: string) {
  return useQuery({
    queryKey: [TRACKS_KEY, id],
    queryFn: async () => {
      return db.query.tracks.findFirst({
        where: eq(tracks.id, id),
        with: {
          artist: true,
          album: {
            with: {
              artist: true,
            },
          },
          genres: {
            with: {
              genre: true,
            },
          },
        },
      });
    },
  });
}

export function useToggleFavoriteTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      trackId,
      isFavorite,
    }: {
      trackId: string;
      isFavorite: boolean;
    }) => {
      await db
        .update(tracks)
        .set({ isFavorite: isFavorite ? 1 : 0 })
        .where(eq(tracks.id, trackId));

      return { trackId, isFavorite };
    },
    onMutate: async ({ trackId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: [TRACKS_KEY, trackId] });
      const previousTrack = queryClient.getQueryData([TRACKS_KEY, trackId]);

      queryClient.setQueryData([TRACKS_KEY, trackId], (old: any) => ({
        ...old,
        isFavorite,
      }));

      return { previousTrack };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        [TRACKS_KEY, variables.trackId],
        context?.previousTrack
      );
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: [TRACKS_KEY, variables.trackId] });
      queryClient.invalidateQueries({ queryKey: [TRACKS_KEY] });
    },
  });
}

export function useIncrementPlayCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trackId: string) => {
      const now = Date.now();

      await db
        .update(tracks)
        .set({
          playCount: sql`${tracks.playCount} + 1`,
          lastPlayedAt: now,
        })
        .where(eq(tracks.id, trackId));

      await db.insert(playHistory).values({
        id: `${trackId}-${now}`,
        trackId,
        playedAt: now,
      });

      return trackId;
    },
    onSuccess: (trackId) => {
      queryClient.invalidateQueries({ queryKey: [TRACKS_KEY, trackId] });
    },
  });
}

export function useArtists(orderByField: 'name' | 'trackCount' | 'dateAdded' = 'name', order: 'asc' | 'desc' = 'asc') {
  return useQuery({
    queryKey: [ARTISTS_KEY, orderByField, order],
    queryFn: async () => {
      const results = await db.query.artists.findMany({
        with: {
          tracks: {
            where: eq(tracks.isDeleted, 0),
            columns: { id: true },
          },
          albums: {
            columns: { artwork: true },
            limit: 1,
          },
        },
      });

      const mapped = results.map((artist) => ({
        id: artist.id,
        name: artist.name,
        sortName: artist.sortName,
        artwork: artist.artwork,
        createdAt: artist.createdAt,
        albumArtwork: artist.albums[0]?.artwork || null,
        trackCount: artist.tracks.length,
      }));

      const multiplier = order === 'asc' ? 1 : -1;
      return mapped.sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;
        switch (orderByField) {
          case 'trackCount':
            aVal = a.trackCount;
            bVal = b.trackCount;
            break;
          case 'dateAdded':
            aVal = a.createdAt;
            bVal = b.createdAt;
            break;
          case 'name':
          default:
            aVal = (a.sortName || a.name).toLowerCase();
            bVal = (b.sortName || b.name).toLowerCase();
        }
        if (aVal < bVal) return -1 * multiplier;
        if (aVal > bVal) return 1 * multiplier;
        return 0;
      });
    },
  });
}

export function useArtist(id: string) {
  return useQuery({
    queryKey: [ARTISTS_KEY, id],
    queryFn: async () => {
      return db.query.artists.findFirst({
        where: eq(artists.id, id),
        with: {
          albums: {
            orderBy: [desc(albums.year)],
          },
          tracks: {
            where: eq(tracks.isDeleted, 0),
            with: {
              album: true,
            },
          },
        },
      });
    },
  });
}

export function useAlbums(orderByField: 'title' | 'artist' | 'year' | 'trackCount' = 'title', order: 'asc' | 'desc' = 'asc') {
  return useQuery({
    queryKey: [ALBUMS_KEY, orderByField, order],
    queryFn: async () => {
      const results = await db.query.albums.findMany({
        with: {
          artist: true,
          tracks: {
            where: eq(tracks.isDeleted, 0),
            columns: { id: true },
          },
        },
      });

      const mapped = results.map((album) => ({
        id: album.id,
        title: album.title,
        artistId: album.artistId,
        year: album.year,
        artwork: album.artwork,
        createdAt: album.createdAt,
        artist: album.artist,
        trackCount: album.tracks.length,
      }));

      const multiplier = order === 'asc' ? 1 : -1;
      return mapped.sort((a, b) => {
        let aVal: string | number | null;
        let bVal: string | number | null;
        switch (orderByField) {
          case 'year':
            aVal = a.year || 0;
            bVal = b.year || 0;
            break;
          case 'trackCount':
            aVal = a.trackCount;
            bVal = b.trackCount;
            break;
          case 'artist':
            aVal = (a.artist?.sortName || a.artist?.name || '').toLowerCase();
            bVal = (b.artist?.sortName || b.artist?.name || '').toLowerCase();
            break;
          case 'title':
          default:
            aVal = a.title.toLowerCase();
            bVal = b.title.toLowerCase();
        }
        if (aVal < bVal) return -1 * multiplier;
        if (aVal > bVal) return 1 * multiplier;
        return 0;
      });
    },
  });
}

export function useAlbum(id: string) {
  return useQuery({
    queryKey: [ALBUMS_KEY, id],
    queryFn: async () => {
      return db.query.albums.findFirst({
        where: eq(albums.id, id),
        with: {
          artist: true,
          tracks: {
            where: eq(tracks.isDeleted, 0),
            orderBy: [
              asc(tracks.discNumber),
              asc(tracks.trackNumber),
              asc(tracks.title),
            ],
            with: {
              artist: true,
            },
          },
        },
      });
    },
  });
}

export function useGenres() {
  return useQuery({
    queryKey: [GENRES_KEY],
    queryFn: async () => {
      return db.query.genres.findMany({
        orderBy: [asc(genres.name)],
      });
    },
  });
}

export function useGenre(id: string) {
  return useQuery({
    queryKey: [GENRES_KEY, id],
    queryFn: async () => {
      return db.query.genres.findFirst({
        where: eq(genres.id, id),
        with: {
          tracks: {
            with: {
              track: {
                with: {
                  artist: true,
                  album: true,
                },
              },
            },
          },
        },
      });
    },
  });
}

export function useSearch(query: string) {
  const [debouncedQuery] = useDebouncedValue(query, {
    wait: 300,
  });

  return useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return { tracks: [], artists: [], albums: [], genres: [] };
      }

      const searchTerm = `%${debouncedQuery}%`;

      const [trackResults, artistResults, albumResults, genreResults] =
        await Promise.all([
          db.query.tracks.findMany({
            where: and(
              like(tracks.title, searchTerm),
              eq(tracks.isDeleted, 0)
            ),
            with: { artist: true, album: true },
            limit: 20,
          }),
          db.query.artists.findMany({
            where: like(artists.name, searchTerm),
            limit: 10,
          }),
          db.query.albums.findMany({
            where: like(albums.title, searchTerm),
            with: { artist: true },
            limit: 10,
          }),
          db.query.genres.findMany({
            where: like(genres.name, searchTerm),
            limit: 10,
          }),
        ]);

      return {
        tracks: trackResults,
        artists: artistResults,
        albums: albumResults,
        genres: genreResults,
      };
    },
    enabled: debouncedQuery.length >= 2,
  });
}

export function useRecentSearches() {
  return useQuery({
    queryKey: ["recent-searches"],
    queryFn: async () => {
      // In a real implementation, you'd store recent searches in a table
      // For now, return empty
      return [] as string[];
    },
  });
}
