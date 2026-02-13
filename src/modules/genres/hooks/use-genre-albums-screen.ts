import { useQuery } from "@tanstack/react-query";
import { startIndexing } from "@/modules/indexer";
import {
  fetchGenreAlbums,
  mapAlbumsToGridData,
} from "@/modules/genres/genres.utils";

const GENRE_ALBUMS_QUERY_KEY = "genre-albums";

export function useGenreAlbumsScreen(genreName: string) {
  const normalizedGenreName = genreName.trim();
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [GENRE_ALBUMS_QUERY_KEY, normalizedGenreName],
    queryFn: () => fetchGenreAlbums(normalizedGenreName),
    enabled: normalizedGenreName.length > 0,
  });

  async function refresh() {
    await startIndexing(true);
    await refetch();
  }

  return {
    albumData: mapAlbumsToGridData(data ?? []),
    isLoading: isLoading || isFetching,
    refresh,
  };
}
