/**
 * Purpose: Renders indexed-track player quick actions and handles navigation to albums, artists, and playlist workflows.
 * Caller: Player route.
 * Dependencies: HeroUI Native sheet components, router navigation, player queue selector, playlist form draft store, playlist picker flow, artist hydration, and reusable artist picker sheet.
 * Main Functions: PlayerActionSheet()
 * Side Effects: Navigates to artist/album routes, opens playlist picker workflows, and preloads queue tracks into playlist creation.
 */

import type { Track } from "@/modules/player/player.types"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { BottomSheet, PressableFeedback, Toast, useToast } from "heroui-native"
import { useMemo, useState } from "react"
import { Text } from "react-native"
import { useTranslation } from "react-i18next"
import { useQueries } from "@tanstack/react-query"

import { ArtistPickerSheet } from "@/components/blocks/artist-picker-sheet"
import { buildArtistPickerItems } from "@/components/blocks/artist-picker.utils"
import { PlaylistPickerSheet } from "@/components/blocks/playlist-picker-sheet"
import { resolveAlbumTransitionId } from "@/modules/artists/artist-transition"
import { getArtistByName } from "@/modules/library/library.repository"
import { usePlayerQueue } from "@/modules/player/player-selectors"
import { usePlaylistPickerSelection } from "@/modules/playlist/playlist-picker-selection.hook"
import { setPlaylistFormDraft } from "@/modules/playlist/playlist-form-draft.store"

interface ArtistPickerSourceArtist {
  name: string
  artwork: string | null
  trackCount: number
}

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
  const queue = usePlayerQueue()
  const canUseLibraryActions = Boolean(track && track.isExternal !== true)
  const [isPlaylistPickerOpen, setIsPlaylistPickerOpen] = useState(false)
  const [isArtistSelectionOpen, setIsArtistSelectionOpen] = useState(false)
  const normalizedArtistNames = useMemo(
    () =>
      canUseLibraryActions
        ? Array.from(
            new Set(
              artistNames
                .map((name) => name.trim())
                .filter((name) => name.length > 0)
            )
          )
        : [],
    [artistNames, canUseLibraryActions]
  )

  const resolvedArtistQueries = useQueries({
    queries: normalizedArtistNames.map((name) => ({
      queryKey: ["artists", "name", name.toLowerCase()] as const,
      enabled: canUseLibraryActions && name.length > 0,
      queryFn: async () => await getArtistByName(name),
    })),
  })

  const resolvedArtists = useMemo<ArtistPickerSourceArtist[]>(
    () =>
      resolvedArtistQueries
        .map((query, index) => {
          const name = normalizedArtistNames[index]
          if (!name) {
            return null
          }

          return {
            name,
            artwork: query.data?.artwork || null,
            trackCount: query.data?.trackCount || 0,
          }
        })
        .filter((artist): artist is ArtistPickerSourceArtist => Boolean(artist)),
    [normalizedArtistNames, resolvedArtistQueries]
  )

  const artistPickerSource = useMemo(() => {
    const artistsByName = new Map(
      resolvedArtists.map((artist) => [artist.name.trim().toLowerCase(), artist])
    )

    const buildArtist = (name: string) => {
      const matchedArtist = artistsByName.get(name.trim().toLowerCase())

      return {
        name,
        artwork: matchedArtist?.artwork || null,
        trackCount: matchedArtist?.trackCount || 0,
      }
    }

    return {
      artist: artistNames[0] ? buildArtist(artistNames[0]) : null,
      featuredArtists: artistNames.slice(1).map((name) => ({
        artist: buildArtist(name),
      })),
    }
  }, [artistNames, resolvedArtists])

  const artistPickerItems = useMemo(
    () =>
      buildArtistPickerItems(
        artistPickerSource,
        artistNames,
        (count) => t("library.count.track", { count })
      ),
    [artistNames, artistPickerSource, t]
  )

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
    setIsPlaylistPickerOpen(false)
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

  const handleSaveQueueToPlaylist = () => {
    const queueTrackIds = Array.from(
      new Set(
        (queue.length > 0 ? queue : [track])
          .filter((item): item is Track => Boolean(item) && !item.isExternal)
          .map((item) => item.id)
      )
    )

    onOpenChange(false)
    setIsPlaylistPickerOpen(false)
    setIsArtistSelectionOpen(false)
    setPlaylistFormDraft(queueTrackIds, "queue")
    onNavigate?.()
    router.dismissTo("/(main)/(library)/playlist/form")
  }

  const { isSelecting, handleSelectPlaylist } = usePlaylistPickerSelection({
    trackId: canUseLibraryActions ? track?.id : undefined,
    onSelectionApplied: () => {
      setIsPlaylistPickerOpen(false)
    },
    showPlaylistToast,
  })

  if (!track || !canUseLibraryActions) {
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
            <PressableFeedback
              className="h-14 flex-row items-center justify-between active:opacity-50"
              onPress={handleSaveQueueToPlaylist}
            >
              <Text className="text-base font-medium text-foreground">
                {t("playlist.saveQueueToPlaylist")}
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

      <ArtistPickerSheet
        isOpen={isArtistSelectionOpen}
        onOpenChange={setIsArtistSelectionOpen}
        title={t("player.selectArtistTitle")}
        items={artistPickerItems}
        onSelectValue={(value) => {
          handleOpenArtist(value)
        }}
      />
    </>
  )
}
