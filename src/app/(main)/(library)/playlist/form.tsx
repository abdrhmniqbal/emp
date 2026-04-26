import { useLocalSearchParams } from "expo-router"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { BottomSheet, Button } from "heroui-native"

import { View } from "react-native"
import { PlaylistForm } from "@/components/blocks/playlist-form/playlist-form"
import { TrackPickerSheetContent } from "@/components/blocks/playlist-form/track-picker-sheet-content"
import LocalTickIcon from "@/components/icons/local/tick"
import { Stack } from "@/layouts/stack"
import { usePlaylistFormEditor } from "@/modules/playlist/playlist-form-editor.hook"
import { usePlaylist } from "@/modules/playlist/playlist.queries"
import { useThemeColors } from "@/modules/ui/theme"

interface PlaylistFormEditorProps {
  playlistId?: string
  initialName: string
  initialDescription: string
  initialSelectedTrackIds: string[]
  isEditMode: boolean
  onSaved: () => void
}

function PlaylistFormEditor({
  playlistId,
  initialName,
  initialDescription,
  initialSelectedTrackIds,
  isEditMode,
  onSaved,
}: PlaylistFormEditorProps) {
  const theme = useThemeColors()
  const {
    name,
    description,
    selectedTracksList,
    isTrackSheetOpen,
    searchInputKey,
    searchQuery,
    filteredTracks,
    draftSelectedTracks,
    isSaving,
    canSave,
    setSearchQuery,
    updateName,
    updateDescription,
    toggleSelectedTrack,
    reorderSelectedTracks,
    openTrackSheet,
    handleTrackSheetOpenChange,
    toggleDraftTrack,
    applyTrackSheetSelection,
    clearDraftTrackSelection,
    save,
  } = usePlaylistFormEditor({
    playlistId,
    initialName,
    initialDescription,
    initialSelectedTrackIds,
    isEditMode,
    onSaved,
  })

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditMode ? "Edit Playlist" : "Create Playlist",
          headerRight: () => (
            <Button
              onPress={save}
              variant="ghost"
              className="-mr-2"
              isIconOnly
              isDisabled={!canSave || isSaving}
            >
              <LocalTickIcon
                fill="none"
                width={24}
                height={24}
                color={canSave || isSaving ? theme.accent : theme.muted}
              />
            </Button>
          ),
        }}
      />

      <PlaylistForm
        name={name}
        description={description}
        selectedTracksList={selectedTracksList}
        setName={updateName}
        setDescription={updateDescription}
        toggleTrack={toggleSelectedTrack}
        reorderSelectedTracks={reorderSelectedTracks}
        openTrackSheet={openTrackSheet}
      />

      <BottomSheet
        isOpen={isTrackSheetOpen}
        onOpenChange={handleTrackSheetOpenChange}
      >
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <TrackPickerSheetContent
            inputKey={searchInputKey}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredTracks={filteredTracks}
            selectedTracks={draftSelectedTracks}
            onToggleTrack={toggleDraftTrack}
            onApply={applyTrackSheetSelection}
            onClearSelection={clearDraftTrackSelection}
          />
        </BottomSheet.Portal>
      </BottomSheet>
    </>
  )
}

export default function PlaylistFormScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const playlistId = typeof id === "string" ? id : undefined
  const isEditMode = Boolean(playlistId?.trim())
  const { data: playlistToEdit, isLoading: isEditPlaylistLoading } =
    usePlaylist(playlistId?.trim() ?? "", isEditMode)

  if (isEditMode && isEditPlaylistLoading) {
    return (
      <View className="flex-1 bg-background pt-4">
        <Stack.Screen
          options={{
            title: "Edit Playlist",
          }}
        />
      </View>
    )
  }

  if (isEditMode && !playlistToEdit) {
    return (
      <View className="flex-1 bg-background">
        <Stack.Screen
          options={{
            title: "Edit Playlist",
          }}
        />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <PlaylistFormEditor
        key={playlistId ?? "create"}
        playlistId={playlistId}
        initialName={playlistToEdit?.name ?? ""}
        initialDescription={playlistToEdit?.description ?? ""}
        initialSelectedTrackIds={
          playlistToEdit?.tracks?.map((playlistTrack) => playlistTrack.trackId) ??
          []
        }
        isEditMode={isEditMode}
        onSaved={() => router.back()}
      />
    </View>
  )
}
