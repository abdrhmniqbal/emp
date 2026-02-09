import { useEffect, useState } from 'react';
import { startIndexing } from '@/modules/indexer';
import { fetchGenreTopTracks } from '@/modules/genres/genres.utils';
import { playTrack } from '@/modules/player/player.store';
import type { Track } from '@/modules/player/player.types';

export function useGenreTopTracksScreen(genreName: string) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function load() {
      setIsLoading(true);

      try {
        const loadedTracks = await fetchGenreTopTracks(genreName);
        if (isActive) {
          setTracks(loadedTracks);
        }
      } catch {
        if (isActive) {
          setTracks([]);
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
      const loadedTracks = await fetchGenreTopTracks(genreName);
      setTracks(loadedTracks);
    } catch {
      setTracks([]);
    } finally {
      setIsLoading(false);
    }
  }

  function playAll() {
    if (tracks.length === 0) {
      return;
    }

    playTrack(tracks[0], tracks);
  }

  function shuffle() {
    if (tracks.length === 0) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * tracks.length);
    playTrack(tracks[randomIndex], tracks);
  }

  return {
    tracks,
    isLoading,
    refresh,
    playAll,
    shuffle,
  };
}
