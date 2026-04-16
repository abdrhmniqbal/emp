import type { LegendListRef } from "@legendapp/list"
import { useMemo, useRef } from "react"

import { useResetScrollOnKey } from "./use-reset-scroll-on-key"

interface LegendListBehaviorProps {
  maintainVisibleContentPosition: false
  dataVersion: string | undefined
}

export function useLegendListBehavior(resetScrollKey?: string) {
  const listRef = useRef<LegendListRef | null>(null)

  useResetScrollOnKey(listRef, resetScrollKey)

  const listBehaviorProps = useMemo<LegendListBehaviorProps>(
    () => ({
      maintainVisibleContentPosition: false,
      dataVersion: resetScrollKey,
    }),
    [resetScrollKey]
  )

  return {
    listRef,
    listBehaviorProps,
  }
}