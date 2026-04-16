import type { Track } from "@/modules/player/player.store"
import { Button, Dialog, Toast, useToast } from "heroui-native"

import { View } from "react-native"
import { useDeleteTrackFromDevice } from "@/modules/tracks/tracks.mutations"

interface DeleteTrackDialogProps {
  track: Track | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: (track: Track) => void
}

export function DeleteTrackDialog({
  track,
  isOpen,
  onOpenChange,
  onDeleted,
}: DeleteTrackDialogProps) {
  const { toast } = useToast()
  const deleteTrackFromDeviceMutation = useDeleteTrackFromDevice()
  const isDeleting = deleteTrackFromDeviceMutation.isPending

  function showToast(title: string, description?: string) {
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

  async function handleConfirmDelete() {
    if (!track || isDeleting) {
      return
    }

    try {
      const result = await deleteTrackFromDeviceMutation.mutateAsync({
        trackId: track.id,
        title: track.title,
      })

      if (result.status === "permission-denied") {
        showToast(
          "Media permission required",
          "Allow media access to delete tracks from your device."
        )
        return
      }

      if (result.status !== "deleted") {
        showToast("Failed to delete track")
        return
      }

      onOpenChange(false)
      onDeleted?.(track)
      showToast("Deleted from device", track.title)
    } catch {
      showToast("Failed to delete track")
    }
  }

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="gap-4">
          <View className="gap-1.5">
            <Dialog.Title>Delete track from device?</Dialog.Title>
            <Dialog.Description>
              {`"${track?.title || "This track"}" will be permanently deleted from your device storage.`}
            </Dialog.Description>
          </View>
          <View className="flex-row justify-end gap-3">
            <Button
              variant="ghost"
              onPress={() => onOpenChange(false)}
              isDisabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onPress={() => {
                void handleConfirmDelete()
              }}
              isDisabled={isDeleting}
            >
              Delete
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
