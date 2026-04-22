import { Redirect, useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"

import { FullPlayerContent } from "@/components/blocks/player/full-player-content"
import { PlayerActionSheet } from "@/components/blocks/player/player-action-sheet"
import { useCurrentTrack, useIsPlaying } from "@/modules/player/player-selectors"
import {
  type PlayerExpandedView,
  setPlayerExpandedView,
  useUIStore,
} from "@/modules/ui/ui.store"

function isPlayerExpandedView(value: string): value is PlayerExpandedView {
  return value === "artwork" || value === "lyrics" || value === "queue"
}

export default function PlayerRoute() {
  const router = useRouter()
  const { initialView } = useLocalSearchParams<{ initialView?: string }>()
  const currentTrack = useCurrentTrack()
  const isPlaying = useIsPlaying()
  const playerExpandedView = useUIStore((state) => state.playerExpandedView)
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false)

  useEffect(() => {
    if (typeof initialView === "string" && isPlayerExpandedView(initialView)) {
      setPlayerExpandedView(initialView)
    }
  }, [initialView])

  if (!currentTrack) {
    return <Redirect href="/(main)/(home)" />
  }

  const dismissPlayer = () => {
    setPlayerExpandedView("artwork")
    setIsActionSheetOpen(false)
    router.back()
  }

  const handleNavigateAway = () => {
    setPlayerExpandedView("artwork")
    setIsActionSheetOpen(false)
  }

  const handleArtistPress = () => {
    const artistName = currentTrack.artist?.trim()
    if (!artistName) {
      return
    }

    handleNavigateAway()
    router.replace({
      pathname: "/artist/[name]",
      params: { name: artistName },
    })
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
        onNavigate={handleNavigateAway}
      />
    </>
  )
}
