import { useMutation } from "@tanstack/react-query"

import { invalidateQueryKeys } from "@/lib/query-invalidation"
import { queryClient } from "@/lib/tanstack-query"
import { trackKeys } from "@/modules/tracks/tracks.keys"

import { historyKeys } from "./history.keys"
import {
  addTrackToHistory,
  incrementTrackPlayCount,
} from "./history.repository"

export function useAddToHistory() {
  return useMutation(
    {
      mutationFn: async (trackId: string) => {
        await addTrackToHistory(trackId)
        return trackId
      },
      onSuccess: async () => {
        await invalidateQueryKeys(queryClient, [historyKeys.tracks()])
      },
    },
    queryClient
  )
}

export function useIncrementPlayCount() {
  const addToHistory = useAddToHistory()

  return useMutation(
    {
      mutationFn: async (trackId: string) => {
        await incrementTrackPlayCount(trackId)
        await addToHistory.mutateAsync(trackId)
        return trackId
      },
      onSuccess: async () => {
        await invalidateQueryKeys(queryClient, [
          trackKeys.all(),
          historyKeys.tracks(),
        ])
      },
    },
    queryClient
  )
}
