/**
 * Purpose: Hosts the player route, expanded view state, and route-level action sheets.
 * Caller: Expo Router player route.
 * Dependencies: Player selectors, UI store, split settings parser, and player action sheet components.
 * Main Functions: PlayerRoute()
 * Side Effects: Navigates to artist route and toggles player sheets.
 */

import { Redirect, useLocalSearchParams } from "expo-router"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { useEffect, useMemo, useState } from "react"

import { FullPlayerContent } from "@/components/blocks/player/full-player-content"
import { PlayerActionSheet } from "@/components/blocks/player/player-action-sheet"
import { ValueNavigationSheet } from "@/components/blocks/value-navigation-sheet"
import {
  useCurrentTrack,
  useIsPlaying,
} from "@/modules/player/player-selectors"
import { useTrack } from "@/modules/tracks/tracks.queries"
import { splitArtistsValue } from "@/modules/settings/split-multiple-values"
import { useSettingsStore } from "@/modules/settings/settings.store"
import {
  type PlayerExpandedView,
  setPlayerExpandedView,
  useUIStore,
} from "@/modules/ui/ui.store"
import { useTranslation } from "react-i18next"

function isPlayerExpandedView(value: string): value is PlayerExpandedView {
  return value === "artwork" || value === "lyrics" || value === "queue"
}

export default function PlayerRoute() {
  const router = useRouter()
  const { t } = useTranslation()
  const { initialView } = useLocalSearchParams<{ initialView?: string }>()
  const currentTrack = useCurrentTrack()
  const isPlaying = useIsPlaying()
  const splitMultipleValueConfig = useSettingsStore(
    (state) => state.splitMultipleValueConfig
  )
  const playerExpandedView = useUIStore((state) => state.playerExpandedView)
  const { data: fullTrackData } = useTrack(currentTrack?.id ?? "")
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false)
  const [isArtistSelectionOpen, setIsArtistSelectionOpen] = useState(false)

  useEffect(() => {
    if (typeof initialView === "string" && isPlayerExpandedView(initialView)) {
      setPlayerExpandedView(initialView)
    }
  }, [initialView])

  const artistNames = useMemo(() => {
    const relationNames = [
      fullTrackData?.artist?.name?.trim(),
      ...(fullTrackData?.featuredArtists?.map((entry) =>
        entry.artist?.name?.trim()
      ) ?? []),
    ].filter((value): value is string => Boolean(value))

    if (relationNames.length > 0) {
      return relationNames.filter(
        (value, index, all) =>
          all.findIndex(
            (entry) => entry.toLowerCase() === value.toLowerCase()
          ) === index
      )
    }

    if (!currentTrack?.artist) {
      return []
    }

    return splitArtistsValue(currentTrack.artist, splitMultipleValueConfig)
  }, [
    currentTrack?.artist,
    fullTrackData?.artist?.name,
    fullTrackData?.featuredArtists,
    splitMultipleValueConfig,
  ])

  if (!currentTrack) {
    return <Redirect href="/(main)/(home)" />
  }

  const dismissPlayer = () => {
    setPlayerExpandedView("artwork")
    setIsActionSheetOpen(false)
    setIsArtistSelectionOpen(false)
    router.back()
  }

  const handleNavigateAway = () => {
    setPlayerExpandedView("artwork")
    setIsActionSheetOpen(false)
    setIsArtistSelectionOpen(false)
  }

  const navigateToArtist = (artistName: string) => {
    const normalizedArtistName = artistName.trim()
    if (!normalizedArtistName) {
      return
    }

    handleNavigateAway()
    router.replace({
      pathname: "/artist/[name]",
      params: { name: normalizedArtistName },
    })
  }

  const handleArtistPress = () => {
    if (artistNames.length <= 1) {
      navigateToArtist(artistNames[0] || currentTrack.artist || "")
      return
    }

    setIsArtistSelectionOpen(true)
  }

  return (
    <>
      <FullPlayerContent
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        playerExpandedView={playerExpandedView}
        onClose={dismissPlayer}
        onOpenMore={() => setIsActionSheetOpen(true)}
        onPressArtist={handleArtistPress}
      />

      <PlayerActionSheet
        visible={isActionSheetOpen}
        onOpenChange={setIsActionSheetOpen}
        track={currentTrack}
        artistNames={artistNames}
        onNavigate={handleNavigateAway}
      />

      <ValueNavigationSheet
        isOpen={isArtistSelectionOpen}
        onOpenChange={setIsArtistSelectionOpen}
        title={t("player.selectArtistTitle")}
        values={artistNames}
        onSelectValue={(value) => {
          navigateToArtist(value)
        }}
      />
    </>
  )
}
