import { create } from "zustand"

import { DEFAULT_SORT_CONFIG } from "@/modules/library/library-sort.constants"
import type {
  SortConfig,
  SortField,
  SortOrder,
  TabName,
} from "@/modules/library/library-sort.types"

interface LibrarySortState {
  sortConfig: Record<TabName, SortConfig>
}

export const useLibrarySortStore = create<LibrarySortState>(() => ({
  sortConfig: DEFAULT_SORT_CONFIG,
}))

function getSortConfigState() {
  return useLibrarySortStore.getState().sortConfig
}

function setSortConfigState(value: Record<TabName, SortConfig>) {
  useLibrarySortStore.setState({ sortConfig: value })
}

export function setSortConfig(
  tab: TabName,
  field: SortField,
  order?: SortOrder
) {
  const current = getSortConfigState()[tab]
  if (current.field === field && !order) {
    setSortConfigState({
      ...getSortConfigState(),
      [tab]: { field, order: current.order === "asc" ? "desc" : "asc" },
    })
    return
  }

  setSortConfigState({
    ...getSortConfigState(),
    [tab]: { field, order: order || "asc" },
  })
}
