import { create } from "zustand"

export type PlayerExpandedView = "artwork" | "lyrics" | "queue"

interface UIState {
  barsVisible: boolean
  isPlayerExpanded: boolean
  playerExpandedView: PlayerExpandedView
}

export const useUIStore = create<UIState>(() => ({
  barsVisible: true,
  isPlayerExpanded: false,
  playerExpandedView: "artwork",
}))

export const $barsVisible = {
  get: () => useUIStore.getState().barsVisible,
  set: (value: boolean) => useUIStore.setState({ barsVisible: value }),
}

export const $isPlayerExpanded = {
  get: () => useUIStore.getState().isPlayerExpanded,
  set: (value: boolean) => useUIStore.setState({ isPlayerExpanded: value }),
}

export const $playerExpandedView = {
  get: () => useUIStore.getState().playerExpandedView,
  set: (value: PlayerExpandedView) =>
    useUIStore.setState({ playerExpandedView: value }),
}

let lastScrollY = 0
let showTimeout: NodeJS.Timeout | null = null

export function handleScroll(currentY: number) {
  if (showTimeout) {
    clearTimeout(showTimeout)
    showTimeout = null
  }

  const isScrollingDown = currentY > lastScrollY && currentY > 50
  const isScrollingUp = currentY < lastScrollY

  if (isScrollingDown) {
    $barsVisible.set(false)
  } else if (isScrollingUp) {
    $barsVisible.set(true)
  }

  lastScrollY = currentY
}

export function handleScrollStart() {
  if (showTimeout) {
    clearTimeout(showTimeout)
    showTimeout = null
  }
}

export function handleScrollStop() {
  if (showTimeout) {
    clearTimeout(showTimeout)
  }
  showTimeout = setTimeout(() => {
    $barsVisible.set(true)
  }, 150)
}
