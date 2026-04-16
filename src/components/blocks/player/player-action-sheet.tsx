import type { Track } from "@/modules/player/player.types"
import { useRouter } from "expo-router"
import { BottomSheet, PressableFeedback, Toast, useToast } from "heroui-native"
import { useState } from "react"

import { Text } from "react-native"
import { PlaylistPickerSheet } from "@/components/blocks/playlist-picker-sheet"
import { useSelectTrackPlaylist } from "@/modules/playlist/playlist-track-selection.hook"

interface PlayerActionSheetProps {
  visible: boolean
  onOpenChange: (open: boolean) => void
  track: Track | null
  onNavigate?: () => void
}

export function PlayerActionSheet({
  visible,
  onOpenChange,
  track,
  onNavigate,
}: PlayerActionSheetProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { isSelecting, selectTrackPlaylist } = useSelectTrackPlaylist()
  const [isPlaylistPickerOpen, setIsPlaylistPickerOpen] = useState(false)

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

  const handleOpenArtist = () => {
    const artistName = track?.artist?.trim()
    if (!artistName) {
      return
    }

    onOpenChange(false)
    setIsPlaylistPickerOpen(false)
    onNavigate?.()
    router.push({
      pathname: "/artist/[name]",
      params: { name: artistName },
    })
  }

  const handleOpenAlbum = () => {
    const albumName = track?.album?.trim()
    if (!albumName) {
      return
    }

    onOpenChange(false)
    setIsPlaylistPickerOpen(false)
    onNavigate?.()
    router.push({
      pathname: "/album/[name]",
      params: { name: albumName },
    })
  }

  const handleCreatePlaylist = () => {
    setIsPlaylistPickerOpen(false)
    router.push("/playlist/form")
  }

  const handleSelectPlaylist = async ({
    id,
    name,
    hasTrack,
  }: {
    id: string
    name: string
    hasTrack: boolean
  }) => {
    if (!track || isSelecting) {
      return
    }

    const result = await selectTrackPlaylist({
        playlistId: id,
        trackId: track.id,
        hasTrack,
      })

    if (result.status === "busy") {
      return
    }

    if (result.status === "failed") {
      showPlaylistToast(
        hasTrack ? "Failed to remove track" : "Failed to add track"
      )
      return
    }

    setIsPlaylistPickerOpen(false)

    if (result.status === "already-in-playlist") {
        showPlaylistToast("Already in playlist", name)
        return
    }

    if (result.status === "removed") {
      showPlaylistToast("Removed from playlist", name)
      return
    }

    if (result.status === "added") {
      showPlaylistToast("Added to playlist", name)
    }
  }

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
              onPress={handleOpenArtist}
            >
              <Text className="text-base font-medium text-foreground">
                Go to Artist
              </Text>
            </PressableFeedback>
            <PressableFeedback
              className="h-14 flex-row items-center justify-between active:opacity-50"
              onPress={handleOpenAlbum}
            >
              <Text className="text-base font-medium text-foreground">
                Go to Album
              </Text>
            </PressableFeedback>
            <PressableFeedback
              className="h-14 flex-row items-center justify-between active:opacity-50"
              onPress={handleOpenPlaylistPicker}
            >
              <Text className="text-base font-medium text-foreground">
                Add to Playlist
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
    </>
  )
}
