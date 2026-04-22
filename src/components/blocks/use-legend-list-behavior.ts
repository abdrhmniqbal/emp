/**
 * Purpose: Centralizes LegendList behavior flags for scroll reset and item recycling updates.
 * Caller: Virtualized list blocks (track/album/artist/favorites/folder/playlist).
 * Dependencies: @legendapp/list refs and reset-scroll hook.
 * Main Functions: useLegendListBehavior()
 * Side Effects: Resets list scroll when reset key changes.
 */

import type { LegendListRef } from "@legendapp/list"
import { useMemo, useRef } from "react"

import { useResetScrollOnKey } from "./use-reset-scroll-on-key"

interface LegendListBehaviorProps {
  maintainVisibleContentPosition: false
  dataVersion: string | undefined
}

export function useLegendListBehavior(
  resetScrollKey?: string,
  dataVersionKey?: string
) {
  const listRef = useRef<LegendListRef | null>(null)

  useResetScrollOnKey(listRef, resetScrollKey)

  const dataVersion =
    resetScrollKey && dataVersionKey
      ? `${resetScrollKey}:${dataVersionKey}`
      : resetScrollKey ?? dataVersionKey

  const listBehaviorProps = useMemo<LegendListBehaviorProps>(
    () => ({
      maintainVisibleContentPosition: false,
      dataVersion,
    }),
    [dataVersion]
  )

  return {
    listRef,
    listBehaviorProps,
  }
}