import { useLocalSearchParams, useRouter } from "expo-router"
import { Button } from "heroui-native"
import * as React from "react"
import { useMemo, useState } from "react"
import { Text, View } from "react-native"
import Transition from "react-native-screen-transitions"
import Animated from "react-native-reanimated"

import { DeletePlaylistDialog } from "@/components/blocks/delete-playlist-dialog"
import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { PlaylistActionsSheet } from "@/components/blocks/playlist-actions-sheet"
import { TrackList } from "@/components/blocks/track-list"
import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import LocalMoreHorizontalCircleSolidIcon from "@/components/icons/local/more-horizontal-circle-solid"
import LocalPlaylistSolidIcon from "@/components/icons/local/playlist-solid"
import { BackButton } from "@/components/patterns/back-button"
import { PlaylistArtwork } from "@/components/patterns/playlist-artwork"
import { EmptyState } from "@/components/ui/empty-state"
import { screenEnterTransition } from "@/constants/animations"
import {
  DETAIL_HEADER_BOTTOM_SPACING,
  SCREEN_SECTION_TOP_SPACING,
} from "@/constants/layout"
import { Stack } from "@/layouts/stack"
import { resolvePlaylistTransitionId } from "@/modules/artists/artist-transition"
import { useToggleFavorite } from "@/modules/favorites/favorites.mutations"
import {
  useIsFavorite,
} from "@/modules/favorites/favorites.queries"
import { logWarn } from "@/modules/logging/logging.service"
import { playTrack } from "@/modules/player/player.service"
import { useDeletePlaylist } from "@/modules/playlist/playlist.mutations"
import { usePlaylist } from "@/modules/playlist/playlist.queries"
import { formatDuration } from "@/modules/playlist/playlist.utils"
import {
  buildPlaylistImages,
  buildPlaylistTracks,
  getPlaylistDuration,
} from "@/modules/playlist/playlist.utils"
import { useThemeColors } from "@/modules/ui/theme"
import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/modules/ui/ui.store"
import { mergeText } from "@/utils/merge-text"

const HEADER_COLLAPSE_THRESHOLD = 120

export default function PlaylistDetailsScreen() {
  const router = useRouter()
  const theme = useThemeColors()
  const { id, transitionId } = useLocalSearchParams<{
    id: string
    transitionId?: string
  }>()
  const playlistId = useMemo(
    () => (Array.isArray(id) ? (id[0] ?? "") : (id ?? "")),
    [id]
  )

  React.useEffect(() => {
    if (!playlistId.trim()) {
      logWarn("Playlist details route missing id param", {
        route: "/playlist/[id]",
      })
    }
  }, [playlistId])
  const [showHeaderTitle, setShowHeaderTitle] = useState(false)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { data: playlist, isLoading } = usePlaylist(playlistId)
  const { data: isFavoriteData = false } = useIsFavorite("playlist", playlistId)
  const toggleFavoriteMutation = useToggleFavorite()
  const deletePlaylistMutation = useDeletePlaylist()
  const isFavorite = Boolean(isFavoriteData)
  const tracks = buildPlaylistTracks(playlist)
  const playlistImages = buildPlaylistImages(playlist, tracks)
  const playlistTransitionId = resolvePlaylistTransitionId({
    transitionId,
    id: playlist?.id || playlistId,
    title: playlist?.name,
  })
  const totalDuration = getPlaylistDuration(tracks)
  const playlistMetaText = mergeText([
    `${tracks.length} ${tracks.length === 1 ? "track" : "tracks"}`,
    formatDuration(totalDuration),
  ])

  function handleBack() {
    router.back()
  }

  async function handleDeleteConfirm() {
    const didDelete = await deletePlaylist()
    if (didDelete) {
      setShowDeleteDialog(false)
      router.replace("/(main)")
    }
  }

  function playFromPlaylist(trackId: string) {
    const selectedTrack = tracks.find((track) => track.id === trackId)
    if (selectedTrack) {
      playTrack(selectedTrack, tracks)
    }
  }

  function playAll() {
    if (tracks.length === 0) {
      return
    }

    playTrack(tracks[0], tracks)
  }

  function shuffle() {
    if (tracks.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * tracks.length)
    playTrack(tracks[randomIndex], tracks)
  }

  async function toggleFavorite() {
    if (!playlist) {
      return
    }

    await toggleFavoriteMutation.mutateAsync({
      type: "playlist",
      itemId: playlist.id,
      isCurrentlyFavorite: isFavorite,
      name: playlist.name,
      subtitle: `${playlist.trackCount || 0} tracks`,
      image: playlist.artwork || undefined,
    })
  }

  async function deletePlaylist(): Promise<boolean> {
    if (!playlist) {
      return false
    }

    try {
      await deletePlaylistMutation.mutateAsync(playlist.id)
      return true
    } catch {
      return false
    }
  }

  if (!playlist) {
    if (isLoading) {
      return <View className="flex-1 bg-background" />
    }

    return (
      <EmptyState
        icon={
          <LocalPlaylistSolidIcon
            fill="none"
            width={48}
            height={48}
            color={theme.muted}
          />
        }
        title="Playlist not found"
        message="This playlist may have been removed."
        className="mt-12"
      />
    )
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: showHeaderTitle ? playlist.name : "",
          headerBackVisible: false,
          headerLeft: () => (
            <BackButton className="-ml-2" onPress={handleBack} />
          ),
          headerRight: () => (
            <View className="-mr-2 flex-row gap-4">
              <Button
                onPress={toggleFavorite}
                variant="ghost"
                className="-mr-2"
                isIconOnly
              >
                {isFavorite ? (
                  <LocalFavouriteSolidIcon
                    fill="none"
                    width={24}
                    height={24}
                    color="#ef4444"
                  />
                ) : (
                  <LocalFavouriteIcon
                    fill="none"
                    width={24}
                    height={24}
                    color={theme.foreground}
                  />
                )}
              </Button>
              <Button
                variant="ghost"
                isIconOnly
                onPress={() => setShowActionSheet(true)}
              >
                <LocalMoreHorizontalCircleSolidIcon
                  fill="none"
                  width={24}
                  height={24}
                  color={theme.foreground}
                />
              </Button>
            </View>
          ),
        }}
      />

      <TrackList
        data={tracks}
        showNumbers={false}
        hideCover={false}
        hideArtist={false}
        onTrackPress={(track) => playFromPlaylist(track.id)}
        contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: 16 }}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y
          handleScroll(y)
          const nextShowHeaderTitle = y > HEADER_COLLAPSE_THRESHOLD
          if (nextShowHeaderTitle !== showHeaderTitle) {
            setShowHeaderTitle(nextShowHeaderTitle)
          }
        }}
        onScrollBeginDrag={handleScrollStart}
        onMomentumScrollEnd={handleScrollStop}
        onScrollEndDrag={handleScrollStop}
        listHeader={
          <>
            <View
              style={{
                paddingTop: SCREEN_SECTION_TOP_SPACING,
                paddingBottom: DETAIL_HEADER_BOTTOM_SPACING,
              }}
            >
              <View className="flex-row gap-4">
                <Transition.Boundary.View id={playlistTransitionId}>
                  <View className="h-36 w-36 overflow-hidden rounded-lg bg-surface-secondary">
                    <PlaylistArtwork
                      images={playlistImages}
                      fallback={
                        <LocalPlaylistSolidIcon
                          fill="none"
                          width={48}
                          height={48}
                          color={theme.muted}
                        />
                      }
                      className="bg-surface-secondary"
                    />
                  </View>
                </Transition.Boundary.View>

                <View className="flex-1 justify-center">
                  <Text
                    className="text-xl font-bold text-foreground"
                    numberOfLines={2}
                  >
                    {playlist.name}
                  </Text>
                  {playlist.description ? (
                    <Text
                      className="mt-1 text-base text-muted"
                      numberOfLines={2}
                    >
                      {playlist.description}
                    </Text>
                  ) : null}
                  <Text className="mt-2 text-sm text-muted">
                    {playlistMetaText}
                  </Text>
                </View>
              </View>
            </View>

            <Animated.View entering={screenEnterTransition()}>
              <PlaybackActionsRow onPlay={playAll} onShuffle={shuffle} />
            </Animated.View>
          </>
        }
      />

      <PlaylistActionsSheet
        visible={showActionSheet}
        onOpenChange={setShowActionSheet}
        onEdit={() =>
          router.push({
            pathname: "/playlist/form",
            params: { id: playlist.id },
          })
        }
        onDelete={() => setShowDeleteDialog(true)}
      />
      <DeletePlaylistDialog
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        isDeleting={deletePlaylistMutation.isPending}
      />
    </View>
  )
}
