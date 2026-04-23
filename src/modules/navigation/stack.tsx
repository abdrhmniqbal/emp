/**
 * Purpose: Centralizes navigation stack screen options and shared route transition helpers.
 * Caller: Expo Router app layouts and nested detail route stacks.
 * Dependencies: expo-router stack options, react-native-screen-transitions, react-native-reanimated, react-native.
 * Main Functions: getDefaultNativeStackOptions(), getLargeTitleRootScreenOptions(), getCenteredRootScreenOptions(), getDrillDownScreenOptions(), getMediaDetailTransitionOptions(), getModalTaskTransitionOptions(), getHiddenBoundaryScreenOptions(), getHiddenArtistScreenOptions(), getHiddenPlaylistScreenOptions(), getHiddenPlayerScreenOptions()
 * Side Effects: None; builds navigation option objects only.
 */

import type { ReactNode } from "react"
import { Platform, UIManager } from "react-native"
import { interpolate } from "react-native-reanimated"
import Transition, {
  NAVIGATION_MASK_CONTAINER_STYLE_ID,
  NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "react-native-screen-transitions"
import type { NativeStackNavigationOptions } from "react-native-screen-transitions/native-stack"

interface NavigationThemeColors {
  background: string
  foreground: string
}

type ScreenStyleInterpolatorArgs = Parameters<
  NonNullable<NativeStackNavigationOptions["screenStyleInterpolator"]>
>[0]

const isNavigationMaskAvailable =
  Platform.OS === "web" ||
  Boolean(UIManager.getViewManagerConfig?.("RNCMaskedView"))

function getMaskedSheetTransitionOptions(): NativeStackNavigationOptions {
  if (!isNavigationMaskAvailable) {
    return Transition.Presets.SlideFromBottom()
  }

  return {
    enableTransitions: true,
    navigationMaskEnabled: true,
    screenStyleInterpolator: ({ current, progress }: ScreenStyleInterpolatorArgs) => {
      "worklet"

      const height = current.layouts.screen.height
      const sheetHeight = interpolate(progress, [0, 1], [height * 0.6, height])

      return {
        [NAVIGATION_MASK_CONTAINER_STYLE_ID]: {
          style: {
            transform: [{ translateY: height - sheetHeight }],
          },
        },
        [NAVIGATION_MASK_ELEMENT_STYLE_ID]: {
          style: {
            width: "100%",
            height: sheetHeight,
            borderRadius: interpolate(progress, [0, 1], [32, 0]),
          },
        },
        backdrop: {
          style: {
            backgroundColor: "transparent",
            opacity: 0,
          },
        },
      }
    },
    transitionSpec: {
      open: Transition.Specs.DefaultSpec,
      close: Transition.Specs.DefaultSpec,
    },
  }
}

function getHeaderSafeSlideRightOptions(): NativeStackNavigationOptions {
  return {
    animation: "slide_from_right",
  }
}

function getHeaderSafeFadeFromBottomOptions(): NativeStackNavigationOptions {
  return {
    animation: "fade_from_bottom",
  }
}

export const HIDDEN_STACK_SCREEN_OPTIONS = {
  headerShown: false,
} as const

type TransitionParams = {
  transitionId?: string
} | undefined

function getTransitionId(params: TransitionParams) {
  return typeof params?.transitionId === "string" && params.transitionId.length > 0
    ? params.transitionId
    : undefined
}

export function getHiddenBoundaryZoomTransitionOptions(boundaryId?: string) {
  if (!boundaryId || !isNavigationMaskAvailable) {
    return {
      ...HIDDEN_STACK_SCREEN_OPTIONS,
      ...Transition.Presets.ZoomIn(),
    }
  }

  return {
    ...HIDDEN_STACK_SCREEN_OPTIONS,
    enableTransitions: true,
    navigationMaskEnabled: false,
    gestureEnabled: true,
    gestureDirection: ["vertical", "horizontal"] as NativeStackNavigationOptions["gestureDirection"],
    gestureDrivesProgress: false,
    screenStyleInterpolator: ({ bounds }: ScreenStyleInterpolatorArgs) => {
      "worklet"

      return bounds({
        id: boundaryId,
        scaleMode: "uniform",
      }).navigation.zoom()
    },
    transitionSpec: {
      open: Transition.Specs.DefaultSpec,
      close: Transition.Specs.DefaultSpec,
    },
  }
}

export function getHiddenArtistZoomTransitionOptions(boundaryId?: string) {
  return getHiddenBoundaryZoomTransitionOptions(boundaryId)
}

export function getHiddenBoundaryScreenOptions(params: TransitionParams) {
  return getHiddenBoundaryZoomTransitionOptions(getTransitionId(params))
}

export function getHiddenArtistScreenOptions(params: TransitionParams) {
  return getHiddenArtistZoomTransitionOptions(getTransitionId(params))
}

export function getHiddenPlaylistScreenOptions(params: TransitionParams) {
  const transitionId = getTransitionId(params)

  return transitionId
    ? getHiddenBoundaryZoomTransitionOptions(transitionId)
    : HIDDEN_STACK_SCREEN_OPTIONS
}

export function getHiddenPlayerScreenOptions(params: TransitionParams) {
  const transitionId = getTransitionId(params)

  return transitionId
    ? getHiddenPlayerZoomTransitionOptions(transitionId)
    : HIDDEN_STACK_SCREEN_OPTIONS
}

export function getHiddenPlayerZoomTransitionOptions(boundaryId?: string) {
  if (!boundaryId || !isNavigationMaskAvailable) {
    return {
      ...HIDDEN_STACK_SCREEN_OPTIONS,
      ...Transition.Presets.ZoomIn(),
    }
  }

  return {
    ...HIDDEN_STACK_SCREEN_OPTIONS,
    enableTransitions: true,
    navigationMaskEnabled: false,
    gestureEnabled: true,
    gestureDirection: ["vertical", "horizontal"] as NativeStackNavigationOptions["gestureDirection"],
    gestureDrivesProgress: false,
    screenStyleInterpolator: ({ bounds }: ScreenStyleInterpolatorArgs) => {
      "worklet"

      return bounds({
        id: boundaryId,
        scaleMode: "uniform",
      }).navigation.zoom()
    },
    transitionSpec: {
      open: Transition.Specs.DefaultSpec,
      close: Transition.Specs.DefaultSpec,
    },
  }
}

export const ROOT_MODAL_SCREEN_OPTIONS = {
  headerShown: false,
  ...getMaskedSheetTransitionOptions(),
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
    ...getHeaderSafeFadeFromBottomOptions(),
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
    animation: "slide_from_bottom" as const,
  }
}
