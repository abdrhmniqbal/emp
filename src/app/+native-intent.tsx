/**
 * Purpose: Normalizes external Android intents and custom deep links before Expo Router attempts route matching.
 * Caller: Expo Router native intent bridge during app launch and runtime URL events.
 * Dependencies: URL parsing from runtime globals.
 * Main Functions: redirectSystemPath()
 * Side Effects: Redirects unknown or external file-manager URLs to a stable in-app route.
 */

const FALLBACK_ROUTE = "/(main)/(home)"

const ROUTE_PREFIXES = new Set([
  "",
  "(main)",
  "settings",
  "player",
  "notification",
  "notification.click",
  "album",
  "artist",
  "playlist",
  "genre",
  "search",
])

function decodePathRecursively(value: string) {
  let decodedValue = value

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const nextValue = decodeURIComponent(decodedValue)
    if (nextValue === decodedValue) {
      break
    }
    decodedValue = nextValue
  }

  return decodedValue
}

function isLikelyExternalFileIntent(path: string) {
  const normalizedPath = decodePathRecursively(path).toLowerCase()

  return (
    normalizedPath.startsWith("content://") ||
    normalizedPath.startsWith("file://") ||
    normalizedPath.includes("com.mixplorer") ||
    normalizedPath.includes("/storage/") ||
    normalizedPath.includes(".mp3") ||
    normalizedPath.includes(".flac") ||
    normalizedPath.includes(".opus") ||
    normalizedPath.includes(".m4a") ||
    normalizedPath.includes(".wav")
  )
}

function safeParsePath(path: string) {
  try {
    return new URL(path, "startune-music://app")
  } catch {
    return null
  }
}

export function redirectSystemPath({
  path,
}: {
  path: string
  initial: boolean
}) {
  const parsedUrl = safeParsePath(path)
  if (!parsedUrl) {
    return FALLBACK_ROUTE
  }

  const decodedPathname = decodePathRecursively(parsedUrl.pathname)
  const firstSegment = decodedPathname.replace(/^\/+/, "").split("/")[0] ?? ""

  if (ROUTE_PREFIXES.has(firstSegment)) {
    return `${decodedPathname}${parsedUrl.search}${parsedUrl.hash}`
  }

  const reconstructedPath = `${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`

  if (isLikelyExternalFileIntent(path) || isLikelyExternalFileIntent(reconstructedPath)) {
    return FALLBACK_ROUTE
  }

  return `${decodedPathname}${parsedUrl.search}${parsedUrl.hash}`
}
