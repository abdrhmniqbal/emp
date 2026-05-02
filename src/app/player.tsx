/**
 * Purpose: Hosts the player route, expanded view state, route-level action sheets, and external audio intent playback.
 * Caller: Expo Router player route.
 * Dependencies: Player selectors/service, queue context selector, bootstrap runtime, UI store, shared artist picker, split settings parser, and player action sheet components.
 * Main Functions: PlayerRoute()
 * Side Effects: Navigates to artist route, toggles player sheets, and starts playback for external file-manager audio URIs.
 */

import { Redirect, useLocalSearchParams } from "expo-router"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { useEffect, useMemo, useRef, useState } from "react"

import {
  ArtistPickerSheet,
  type ArtistPickerSheetItem,
} from "@/components/blocks/artist-picker-sheet"
import { buildArtistPickerItems } from "@/components/blocks/artist-picker.utils"
import { FullPlayerContent } from "@/components/blocks/player/full-player-content"
import { PlayerActionSheet } from "@/components/blocks/player/player-action-sheet"
import { waitForBootstrapComplete } from "@/modules/bootstrap/bootstrap.runtime"
import {
  useCurrentTrack,
  useIsPlaying,
  usePlayerQueueContext,
} from "@/modules/player/player-selectors"
import { playExternalFileUri } from "@/modules/player/player.service"
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
  const { initialView, externalUri } = useLocalSearchParams<{
    initialView?: string
    externalUri?: string
  }>()
  const currentTrack = useCurrentTrack()
  const isPlaying = useIsPlaying()
  const queueContext = usePlayerQueueContext()
  const splitMultipleValueConfig = useSettingsStore(
    (state) => state.splitMultipleValueConfig
  )
  const playerExpandedView = useUIStore((state) => state.playerExpandedView)
  const { data: fullTrackData } = useTrack(
    currentTrack?.isExternal ? "" : currentTrack?.id ?? ""
  )
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false)
  const [isArtistSelectionOpen, setIsArtistSelectionOpen] = useState(false)
  const [isHandlingExternalUri, setIsHandlingExternalUri] = useState(false)
  const routerRef = useRef(router)

  const externalUriValue =
    typeof externalUri === "string" && externalUri.length > 0
      ? externalUri
      : null

  useEffect(() => {
    if (typeof initialView === "string" && isPlayerExpandedView(initialView)) {
      setPlayerExpandedView(initialView)
    }
  }, [initialView])

  useEffect(() => {
    routerRef.current = router
  }, [router])

  useEffect(() => {
    if (currentTrack?.isExternal) {
      setIsActionSheetOpen(false)
      setIsArtistSelectionOpen(false)
    }
  }, [currentTrack?.isExternal])

  useEffect(() => {
    if (!externalUriValue) {
      return
    }

    let isCancelled = false
    setIsHandlingExternalUri(true)

    void (async () => {
      try {
        await waitForBootstrapComplete()
        if (isCancelled) {
          return
        }

        const didStartPlayback = await playExternalFileUri(externalUriValue)
        if (!isCancelled) {
          routerRef.current.replace(
            didStartPlayback ? "/player" : "/(main)/(home)"
          )
        }
      } catch {
        if (!isCancelled) {
          routerRef.current.replace("/(main)/(home)")
        }
      } finally {
        if (!isCancelled) {
          setIsHandlingExternalUri(false)
        }
      }
    })()

    return () => {
      isCancelled = true
    }
  }, [externalUriValue])

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

  const artistPickerItems = useMemo<ArtistPickerSheetItem[]>(
    () =>
      buildArtistPickerItems(
        {
          artwork: fullTrackData?.artwork,
          albumArtwork: fullTrackData?.album?.artwork,
          artist: fullTrackData?.artist,
          featuredArtists: fullTrackData?.featuredArtists,
        },
        artistNames,
        (count) => t("library.count.track", { count })
      ),
    [artistNames, fullTrackData, t]
  )

  if (externalUriValue && (isHandlingExternalUri || !currentTrack)) {
    return null
  }

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
    router.dismissTo({
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
        queueContext={queueContext}
        onClose={dismissPlayer}
        onOpenMore={
          currentTrack.isExternal ? undefined : () => setIsActionSheetOpen(true)
        }
        onPressArtist={currentTrack.isExternal ? undefined : handleArtistPress}
      />

      <PlayerActionSheet
        visible={isActionSheetOpen}
        onOpenChange={setIsActionSheetOpen}
        track={currentTrack}
        artistNames={artistNames}
        onNavigate={handleNavigateAway}
      />

      <ArtistPickerSheet
        isOpen={isArtistSelectionOpen}
        onOpenChange={setIsArtistSelectionOpen}
        title={t("player.selectArtistTitle")}
        items={artistPickerItems}
        onSelectValue={(value) => {
          navigateToArtist(value)
        }}
      />
    </>
  )
}
