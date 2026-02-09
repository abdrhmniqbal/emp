import { useEffect, useState } from 'react';
import { startIndexing } from '@/modules/indexer';
import { fetchGenreAlbums, mapAlbumsToGridData } from '@/modules/genres/genres.utils';
import type { GenreAlbumInfo } from '@/modules/genres/genres.api';

export function useGenreAlbumsScreen(genreName: string) {
  const [albums, setAlbums] = useState<GenreAlbumInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function load() {
      setIsLoading(true);

      try {
        const loadedAlbums = await fetchGenreAlbums(genreName);
        if (isActive) {
          setAlbums(loadedAlbums);
        }
      } catch {
        if (isActive) {
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
      const loadedAlbums = await fetchGenreAlbums(genreName);
      setAlbums(loadedAlbums);
    } catch {
      setAlbums([]);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    albumData: mapAlbumsToGridData(albums),
    isLoading,
    refresh,
  };
}
