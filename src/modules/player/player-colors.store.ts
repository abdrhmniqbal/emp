import { getColors } from "react-native-image-colors"
import { create } from "zustand"

export interface ColorPalette {
  bg: string
  primary: string
  secondary: string
}

const DEFAULT_COLORS: ColorPalette = {
  bg: "#1a1a1a",
  primary: "#cccccc",
  secondary: "#000000",
}

const colorCache = new Map<string, ColorPalette>()

interface PlayerColorsState {
  currentImageUri: string | null
  currentColors: ColorPalette
  isLoadingColors: boolean
}

export const usePlayerColorsStore = create<PlayerColorsState>(() => ({
  currentImageUri: null,
  currentColors: DEFAULT_COLORS,
  isLoadingColors: false,
}))

export const $currentImageUri = {
  get: () => usePlayerColorsStore.getState().currentImageUri,
  set: (value: string | null) =>
    usePlayerColorsStore.setState({ currentImageUri: value }),
}

export const $currentColors = {
  get: () => usePlayerColorsStore.getState().currentColors,
  set: (value: ColorPalette) =>
    usePlayerColorsStore.setState({ currentColors: value }),
}

export const $isLoadingColors = {
  get: () => usePlayerColorsStore.getState().isLoadingColors,
  set: (value: boolean) =>
    usePlayerColorsStore.setState({ isLoadingColors: value }),
}

export async function getTrackColors(imageUri: string): Promise<ColorPalette> {
  if (colorCache.has(imageUri)) {
    return colorCache.get(imageUri)!
  }

  try {
    const result = await getColors(imageUri, {
      fallback: DEFAULT_COLORS.bg,
      cache: true,
      key: imageUri,
    })

    let colors: ColorPalette

    if (result.platform === "android") {
      colors = {
        bg: (result as any).average || DEFAULT_COLORS.bg,
        primary: (result as any).dominant || DEFAULT_COLORS.primary,
        secondary: (result as any).darkVibrant || DEFAULT_COLORS.secondary,
      }
    } else {
      colors = {
        bg: (result as any).background || DEFAULT_COLORS.bg,
        primary: (result as any).primary || DEFAULT_COLORS.primary,
        secondary: (result as any).detail || DEFAULT_COLORS.secondary,
      }
    }

    colorCache.set(imageUri, colors)
    return colors
  } catch {
    return DEFAULT_COLORS
  }
}

export async function updateColorsForImage(imageUri: string | undefined) {
  if (!imageUri) {
    $currentColors.set(DEFAULT_COLORS)
    $currentImageUri.set(null)
    return
  }

  if (imageUri === $currentImageUri.get()) {
    return
  }

  $isLoadingColors.set(true)
  $currentImageUri.set(imageUri)

  const colors = await getTrackColors(imageUri)
  $currentColors.set(colors)
  $isLoadingColors.set(false)
}

export function getCachedColors(imageUri: string): ColorPalette | null {
  return colorCache.get(imageUri) || null
}

export function clearColorCache() {
  colorCache.clear()
}

export const getColorCacheSize = () => colorCache.size
