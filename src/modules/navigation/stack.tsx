/**
 * Purpose: Centralizes native stack screen options and shared Expo Router transition presets.
 * Caller: Expo Router app layouts and nested detail route stacks.
 * Dependencies: Expo Router native stack options and theme colors.
 * Main Functions: getDefaultNativeStackOptions(), getLargeTitleRootScreenOptions(), getCenteredRootScreenOptions(), getDrillDownScreenOptions(), getMediaDetailTransitionOptions(), getModalTaskTransitionOptions(), getHiddenBoundaryScreenOptions(), getHiddenArtistScreenOptions(), getHiddenPlaylistScreenOptions(), getHiddenPlayerScreenOptions()
 * Side Effects: None.
 */

import type { ReactNode } from "react"

interface NavigationThemeColors {
  background: string
  foreground: string
}

function getHeaderSafeSlideRightOptions() {
  return {
    animation: "slide_from_right" as const,
  }
}

function getHeaderSafeSlideFromBottomOptions() {
  return {
    animation: "slide_from_bottom" as const,
  }
}

export const HIDDEN_STACK_SCREEN_OPTIONS = {
  headerShown: false,
} as const

export function getHiddenBoundaryScreenOptions() {
  return {
    ...HIDDEN_STACK_SCREEN_OPTIONS,
    ...getHeaderSafeSlideRightOptions(),
  }
}

export function getHiddenArtistScreenOptions() {
  return getHiddenBoundaryScreenOptions()
}

export function getHiddenPlaylistScreenOptions() {
  return getHiddenBoundaryScreenOptions()
}

export function getHiddenPlayerScreenOptions() {
  return {
    ...HIDDEN_STACK_SCREEN_OPTIONS,
    presentation: "transparentModal" as const,
    contentStyle: {
      backgroundColor: "transparent",
    },
    ...getHeaderSafeSlideFromBottomOptions(),
  }
}

export const ROOT_MODAL_SCREEN_OPTIONS = {
  headerShown: false,
  presentation: "modal" as const,
  ...getHeaderSafeSlideFromBottomOptions(),
}

export function getDefaultNativeStackOptions(theme: NavigationThemeColors) {
  return {
    headerShown: true,
    headerStyle: {
      backgroundColor: theme.background,
    },
    headerTintColor: theme.foreground,
    headerShadowVisible: false,
    headerTitleAlign: "center" as const,
    contentStyle: {
      backgroundColor: theme.background,
    },
  }
}

export function getLargeTitleRootScreenOptions(options: {
  title: string
  headerRight?: () => ReactNode
  headerLeft?: () => ReactNode
}) {
  return {
    title: options.title,
    headerLargeTitle: true,
    headerTitleAlign: "left" as const,
    headerRight: options.headerRight,
    headerLeft: options.headerLeft,
  }
}

export function getCenteredRootScreenOptions(options: {
  title: string
  headerRight?: () => ReactNode
  headerLeft?: () => ReactNode
}) {
  return {
    title: options.title,
    headerTitleAlign: "center" as const,
    headerRight: options.headerRight,
    headerLeft: options.headerLeft,
  }
}

export function getBackButtonScreenOptions(
  title: string,
  headerLeft: () => ReactNode
) {
  return {
    title,
    headerBackButtonMenuEnabled: false,
    headerBackVisible: false,
    headerLeft,
    headerLeftContainerStyle: {
      paddingRight: 8,
    },
  }
}

export function getDrillDownScreenOptions(
  title: string,
  headerLeft: () => ReactNode
) {
  return {
    ...getBackButtonScreenOptions(title, headerLeft),
    ...getHeaderSafeSlideRightOptions(),
  }
}

export function getMediaDetailTransitionOptions(
  theme: NavigationThemeColors,
  headerLeft: () => ReactNode
) {
  return {
    ...getDefaultNativeStackOptions(theme),
    ...getBackButtonScreenOptions("", headerLeft),
    ...getHeaderSafeSlideRightOptions(),
  }
}

export function getModalTaskTransitionOptions(
  theme: NavigationThemeColors,
  title: string,
  headerLeft: () => ReactNode
) {
  return {
    ...getDefaultNativeStackOptions(theme),
    ...getBackButtonScreenOptions(title, headerLeft),
    presentation: "modal" as const,
    ...getHeaderSafeSlideFromBottomOptions(),
  }
}
