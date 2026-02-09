import { useEffect, useState } from 'react';
import { startIndexing } from '@/modules/indexer';
import type { Track } from '@/modules/player/player.types';
import { fetchGenreDetails, getPreviewAlbums } from '@/modules/genres/genres.utils';
import type { GenreAlbumInfo } from '@/modules/genres/genres.api';

export function useGenreDetailsScreen(genreName: string) {
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<GenreAlbumInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function load() {
      setIsLoading(true);

      try {
        const data = await fetchGenreDetails(genreName);
        if (!isActive) {
          return;
        }

        setTopTracks(data.topTracks);
        setAlbums(data.albums);
      } catch {
        if (isActive) {
          setTopTracks([]);
          setAlbums([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isActive = false;
    };
  }, [genreName]);

  async function refresh() {
    startIndexing(true);
    setIsLoading(true);

    try {
      const data = await fetchGenreDetails(genreName);
      setTopTracks(data.topTracks);
      setAlbums(data.albums);
    } catch {
      setTopTracks([]);
      setAlbums([]);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    topTracks,
    albums,
    previewAlbums: getPreviewAlbums(albums),
    isLoading,
    refresh,
  };
}
