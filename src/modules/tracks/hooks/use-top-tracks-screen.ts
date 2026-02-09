import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { startIndexing } from '@/modules/indexer';
import { playTrack } from '@/modules/player/player.store';
import type { Track } from '@/modules/player/player.types';
import { getTopTracks, type TopTracksPeriod } from '@/modules/tracks/tracks.api';

export const TOP_TRACKS_TABS = ['Realtime', 'Daily', 'Weekly'] as const;
export type TopTracksTab = (typeof TOP_TRACKS_TABS)[number];

const TOP_TRACKS_LIMIT = 10;

function tabToPeriod(tab: TopTracksTab): TopTracksPeriod {
  if (tab === 'Daily') {
    return 'day';
  }

  if (tab === 'Weekly') {
    return 'week';
  }

  return 'all';
}

export function useTopTracksScreen() {
  const [activeTab, setActiveTab] = useState<TopTracksTab>('Realtime');
  const [currentTracks, setCurrentTracks] = useState<Track[]>([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    let isActive = true;

    async function load() {
      const tracks = await getTopTracks(tabToPeriod(activeTab), TOP_TRACKS_LIMIT);
      if (isActive) {
        setCurrentTracks(tracks);
      }
    }

    void load();

    return () => {
      isActive = false;
    };
  }, [activeTab, isFocused]);

  async function refresh() {
    startIndexing(true);
    const tracks = await getTopTracks(tabToPeriod(activeTab), TOP_TRACKS_LIMIT);
    setCurrentTracks(tracks);
  }

  function playAll() {
    if (currentTracks.length === 0) {
      return;
    }

    playTrack(currentTracks[0], currentTracks);
  }

  function shuffle() {
    if (currentTracks.length === 0) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * currentTracks.length);
    playTrack(currentTracks[randomIndex], currentTracks);
  }

  return {
    activeTab,
    setActiveTab,
    currentTracks,
    refresh,
    playAll,
    shuffle,
  };
}
