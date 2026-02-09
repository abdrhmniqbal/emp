import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { startIndexing } from '@/modules/indexer';
import type { Track } from '@/modules/player/player.types';
import { fetchRecentlyPlayedTracks } from '@/modules/history/history.utils';
import { getTopTracks } from '@/modules/tracks/tracks.api';

const RECENTLY_PLAYED_LIMIT = 8;
const TOP_TRACKS_LIMIT = 25;

export function useHomeScreen() {
  const [recentlyPlayedTracks, setRecentlyPlayedTracks] = useState<Track[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    let isActive = true;

    async function load() {
      const [recent, top] = await Promise.all([
        fetchRecentlyPlayedTracks(RECENTLY_PLAYED_LIMIT),
        getTopTracks('all', TOP_TRACKS_LIMIT),
      ]);

      if (!isActive) {
        return;
      }

      setRecentlyPlayedTracks(recent);
      setTopTracks(top);
    }

    void load();

    return () => {
      isActive = false;
    };
  }, [isFocused]);

  async function refresh() {
    startIndexing(true);

    const [recent, top] = await Promise.all([
      fetchRecentlyPlayedTracks(RECENTLY_PLAYED_LIMIT),
      getTopTracks('all', TOP_TRACKS_LIMIT),
    ]);

    setRecentlyPlayedTracks(recent);
    setTopTracks(top);
  }

  return {
    recentlyPlayedTracks,
    topTracks,
    refresh,
  };
}
