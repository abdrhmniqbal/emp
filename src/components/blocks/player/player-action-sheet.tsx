/**
 * Purpose: Renders player quick actions and handles navigation to albums, artists, and playlists.
 * Caller: Player route.
 * Dependencies: HeroUI Native sheet components, router navigation, playlist picker flow, split settings state, and value navigation sheet.
 * Main Functions: PlayerActionSheet()
 * Side Effects: Navigates to artist/album routes and opens playlist picker workflows.
 */

import type { Track } from "@/modules/player/player.types"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { BottomSheet, PressableFeedback, Toast, useToast } from "heroui-native"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Text } from "react-native"
import { PlaylistPickerSheet } from "@/components/blocks/playlist-picker-sheet"
import { ValueNavigationSheet } from "@/components/blocks/value-navigation-sheet"
import { resolveAlbumTransitionId } from "@/modules/artists/artist-transition"
import { usePlaylistPickerSelection } from "@/modules/playlist/playlist-picker-selection.hook"

interface PlayerActionSheetProps {
  visible: boolean
  onOpenChange: (open: boolean) => void
  track: Track | null
  artistNames: string[]
  onNavigate?: () => void
}

export function PlayerActionSheet({
  visible,
  onOpenChange,
  track,
  artistNames,
  onNavigate,
}: PlayerActionSheetProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { toast } = useToast()
  const [isPlaylistPickerOpen, setIsPlaylistPickerOpen] = useState(false)
  const [isArtistSelectionOpen, setIsArtistSelectionOpen] = useState(false)

  const showPlaylistToast = (title: string, description?: string) => {
    toast.show({
      duration: 1800,
      component: (props) => (
        <Toast {...props} variant="accent" placement="bottom">
          <Toast.Title className="text-sm font-semibold">{title}</Toast.Title>
          {description ? (
            <Toast.Description className="text-xs text-muted">
              {description}
            </Toast.Description>
          ) : null}
        </Toast>
      ),
    })
  }

  const handleOpenPlaylistPicker = () => {
    onOpenChange(false)
    setIsPlaylistPickerOpen(true)
  }

  const handleOpenArtist = (artistName: string) => {
    const normalizedArtistName = artistName.trim()
    if (!normalizedArtistName) {
      return
    }

    onOpenChange(false)
    setIsPlaylistPickerOpen(false)
    setIsArtistSelectionOpen(false)
    onNavigate?.()
    router.dismissTo({
      pathname: "/artist/[name]",
      params: { name: normalizedArtistName },
    })
  }

  const handleOpenArtistChooser = () => {
    const normalized = artistNames
      .map((name) => name.trim())
      .filter((name) => name.length > 0)

    if (normalized.length === 0) {
      return
    }

    if (normalized.length === 1) {
      handleOpenArtist(normalized[0] || "")
      return
    }

    onOpenChange(false)
    setIsArtistSelectionOpen(true)
  }

  const handleOpenAlbum = () => {
    const albumName = track?.album?.trim()
    if (!albumName) {
      return
    }

    onOpenChange(false)
    setIsPlaylistPickerOpen(false)
    onNavigate?.()
    router.dismissTo({
      pathname: "/album/[name]",
      params: {
        name: albumName,
        transitionId: resolveAlbumTransitionId({
          id: track?.albumId,
          title: albumName,
        }),
      },
    })
  }

  const handleCreatePlaylist = () => {
    setIsPlaylistPickerOpen(false)
    router.push("/playlist/form")
  }

  const { isSelecting, handleSelectPlaylist } = usePlaylistPickerSelection({
    trackId: track?.id,
    onSelectionApplied: () => {
      setIsPlaylistPickerOpen(false)
    },
    showPlaylistToast,
  })

  if (!track) {
    return null
  }

  return (
    <>
      <BottomSheet isOpen={visible} onOpenChange={onOpenChange}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            backgroundClassName="bg-surface"
            className="gap-1"
          >
            <PressableFeedback
              className="h-14 flex-row items-center justify-between active:opacity-50"
              onPress={handleOpenArtistChooser}
            >
              <Text className="text-base font-medium text-foreground">
                {t("player.menu.goToArtist")}
              </Text>
            </PressableFeedback>
            <PressableFeedback
              className="h-14 flex-row items-center justify-between active:opacity-50"
              onPress={handleOpenAlbum}
            >
              <Text className="text-base font-medium text-foreground">
                {t("player.menu.goToAlbum")}
              </Text>
            </PressableFeedback>
            <PressableFeedback
              className="h-14 flex-row items-center justify-between active:opacity-50"
              onPress={handleOpenPlaylistPicker}
            >
              <Text className="text-base font-medium text-foreground">
                {t("track.addToPlaylist")}
              </Text>
            </PressableFeedback>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <PlaylistPickerSheet
        isOpen={isPlaylistPickerOpen}
        onOpenChange={setIsPlaylistPickerOpen}
        trackId={track.id}
        isSelecting={isSelecting}
        onCreatePlaylist={handleCreatePlaylist}
        onSelectPlaylist={(playlist) => {
          void handleSelectPlaylist(playlist)
        }}
      />

      <ValueNavigationSheet
        isOpen={isArtistSelectionOpen}
        onOpenChange={setIsArtistSelectionOpen}
        title={t("player.selectArtistTitle")}
        values={artistNames}
        onSelectValue={(value) => {
          handleOpenArtist(value)
        }}
      />
    </>
  )
}
