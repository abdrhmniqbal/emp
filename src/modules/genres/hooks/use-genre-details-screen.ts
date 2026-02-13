import { useQuery } from "@tanstack/react-query";
import { startIndexing } from "@/modules/indexer";
import {
  fetchGenreDetails,
  getPreviewAlbums,
} from "@/modules/genres/genres.utils";

export function useGenreDetailsScreen(genreName: string) {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["genre-details", genreName],
    queryFn: () => fetchGenreDetails(genreName),
    enabled: genreName.length > 0,
  });

  const topTracks = data?.topTracks ?? [];
  const albums = data?.albums ?? [];

  async function refresh() {
    await startIndexing(true);
    await refetch();
  }

  return {
    topTracks,
    albums,
    previewAlbums: getPreviewAlbums(albums),
    isLoading: isLoading || isFetching,
    refresh,
  };
}
