import * as React from "react"
import { useEffect, useState } from "react"
import { useStore } from "@nanostores/react"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { BottomSheet } from "heroui-native"
import { StyleSheet, View } from "react-native"

import { $isPlayerExpanded, $showPlayerQueue } from "@/hooks/scroll-bars.store"
import {
  $currentColors,
  updateColorsForImage,
} from "@/modules/player/player-colors.store"
import {
  $currentTime,
  $currentTrack,
  $duration,
  $isPlaying,
} from "@/modules/player/player.store"

import { AlbumArtView } from "./album-art-view"
import { PlaybackControls } from "./playback-controls"
import { PlayerActionSheet } from "./player-action-sheet"
import { PlayerFooter } from "./player-footer"
import { PlayerHeader } from "./player-header"
import { ProgressBar } from "./progress-bar"
import { QueueView } from "./queue-view"
import { TrackInfo } from "./track-info"

const BACKGROUND_DARKEN_OVERLAY = "rgba(0, 0, 0, 0.15)"
const FULL_PLAYER_SNAP_POINTS = ["100%"]

export function FullPlayer() {
  const router = useRouter()
  const isExpanded = useStore($isPlayerExpanded)
  const currentTrack = useStore($currentTrack)
  const isPlaying = useStore($isPlaying)
  const currentTimeVal = useStore($currentTime)
  const durationVal = useStore($duration)
  const showQueue = useStore($showPlayerQueue)
  const colors = useStore($currentColors)
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false)

  useEffect(() => {
    updateColorsForImage(currentTrack?.image)
  }, [currentTrack?.image])

  const closePlayer = () => {
    $isPlayerExpanded.set(false)
    $showPlayerQueue.set(false)
    setIsActionSheetOpen(false)
  }

  const handleArtistPress = () => {
    const artistName = currentTrack?.artist?.trim()
    if (!artistName) {
      return
    }

    closePlayer()
    router.push({
      pathname: "/(main)/(library)/artist/[name]",
      params: { name: artistName },
    })
  }

  if (!currentTrack) return null

  return (
    <>
      <BottomSheet
        isOpen={isExpanded}
        onOpenChange={(open) => !open && closePlayer()}
      >
        <BottomSheet.Portal disableFullWindowOverlay>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            index={0}
            snapPoints={FULL_PLAYER_SNAP_POINTS}
            enableDynamicSizing={false}
            topInset={0}
            bottomInset={0}
            backgroundClassName="bg-transparent"
            backgroundStyle={{ borderRadius: 0 }}
            contentContainerClassName="h-full p-0"
            handleComponent={() => null}
            handleHeight={0}
          >
            <View className="relative flex-1">
              <LinearGradient
                colors={[colors.bg, colors.secondary, "#09090B"]}
                locations={[0, 0.6, 1]}
                style={StyleSheet.absoluteFillObject}
              />
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: BACKGROUND_DARKEN_OVERLAY },
                ]}
              />

              <View className="flex-1 justify-between px-6 pt-12 pb-8">
                <PlayerHeader
                  onClose={closePlayer}
                  onOpenMore={() => setIsActionSheetOpen(true)}
                />

                {showQueue ? (
                  <QueueView currentTrack={currentTrack} />
                ) : (
                  <AlbumArtView currentTrack={currentTrack} />
                )}

                <TrackInfo
                  track={currentTrack}
                  compact={showQueue}
                  onPressArtist={handleArtistPress}
                />

                <ProgressBar
                  currentTime={currentTimeVal}
                  duration={durationVal}
                  compact={showQueue}
                />

                <PlaybackControls isPlaying={isPlaying} compact={showQueue} />

                <PlayerFooter />
              </View>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <PlayerActionSheet
        visible={isActionSheetOpen}
        onOpenChange={setIsActionSheetOpen}
        track={currentTrack}
        onNavigate={closePlayer}
      />
    </>
  )
}
