/**
 * Purpose: Wraps Expo Router navigation to ignore duplicate rapid pushes/replaces to the same target.
 * Caller: Screens, headers, sheets, mini-player, and shared navigation controls.
 * Dependencies: Expo Router useRouter hook.
 * Main Functions: useGuardedRouter()
 * Side Effects: Mutates a module-level in-memory navigation guard for the current app session.
 */

import { useRouter as useExpoRouter } from "expo-router"
import { useCallback, useMemo } from "react"

const NAVIGATION_GUARD_WINDOW_MS = 900

type ExpoRouter = ReturnType<typeof useExpoRouter>
type PushArgs = Parameters<ExpoRouter["push"]>
type ReplaceArgs = Parameters<ExpoRouter["replace"]>

interface NavigationGuardState {
  key: string
  expiresAt: number
}

let activeNavigationGuard: NavigationGuardState | null = null

function getNavigationTargetKey(method: "push" | "replace", target: unknown) {
  if (typeof target === "string") {
    return `${method}:${target}`
  }

  try {
    return `${method}:${JSON.stringify(target)}`
  } catch {
    return `${method}:${String(target)}`
  }
}

function shouldRunNavigation(method: "push" | "replace", target: unknown) {
  const now = Date.now()
  const key = getNavigationTargetKey(method, target)

  if (
    activeNavigationGuard &&
    activeNavigationGuard.key === key &&
    activeNavigationGuard.expiresAt > now
  ) {
    return false
  }

  activeNavigationGuard = {
    key,
    expiresAt: now + NAVIGATION_GUARD_WINDOW_MS,
  }
  return true
}

export function useGuardedRouter(): ExpoRouter {
  const router = useExpoRouter()

  const push = useCallback<ExpoRouter["push"]>(
    (...args: PushArgs) => {
      if (!shouldRunNavigation("push", args[0])) {
        return
      }

      return router.push(...args)
    },
    [router]
  )

  const replace = useCallback<ExpoRouter["replace"]>(
    (...args: ReplaceArgs) => {
      if (!shouldRunNavigation("replace", args[0])) {
        return
      }

      return router.replace(...args)
    },
    [router]
  )

  return useMemo(
    () => ({
      ...router,
      push,
      replace,
    }),
    [push, replace, router]
  )
}
