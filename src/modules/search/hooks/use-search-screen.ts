import { useEffect, useState } from 'react';
import { startIndexing } from '@/modules/indexer';
import { fetchGenres, mapGenresToCategories } from '@/modules/genres/genres.utils';

export function useSearchScreen() {
  const [genreList, setGenreList] = useState<string[]>([]);

  useEffect(() => {
    let isActive = true;

    async function load() {
      try {
        const genres = await fetchGenres();
        if (isActive) {
          setGenreList(genres);
        }
      } catch {
        if (isActive) {
          setGenreList([]);
        }
      }
    }

    void load();

    return () => {
      isActive = false;
    };
  }, []);

  async function refresh() {
    startIndexing(true);

    try {
      const genres = await fetchGenres();
      setGenreList(genres);
    } catch {
      setGenreList([]);
    }
  }

  return {
    categories: mapGenresToCategories(genreList),
    refresh,
  };
}
