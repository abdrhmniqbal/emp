/**
 * Purpose: Normalizes external Android intents and custom deep links before Expo Router attempts route matching.
 * Caller: Expo Router native intent bridge during app launch and runtime URL events.
 * Dependencies: URL parsing from runtime globals.
 * Main Functions: redirectSystemPath()
 * Side Effects: Redirects external audio file-manager URLs to the player route with the source URI preserved.
 */

const FALLBACK_ROUTE = "/(main)/(home)"
const EXTERNAL_AUDIO_ROUTE = "/player"

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
    try {
      const nextValue = decodeURIComponent(decodedValue)
      if (nextValue === decodedValue) {
        break
      }
      decodedValue = nextValue
    } catch {
      break
    }
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

function buildExternalAudioRoute(uri: string) {
  return `${EXTERNAL_AUDIO_ROUTE}?externalUri=${encodeURIComponent(uri)}`
}

export function redirectSystemPath({
  path,
}: {
  path: string
  initial: boolean
}) {
  if (isLikelyExternalFileIntent(path)) {
    return buildExternalAudioRoute(decodePathRecursively(path))
  }

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

  if (isLikelyExternalFileIntent(reconstructedPath)) {
    return buildExternalAudioRoute(decodePathRecursively(reconstructedPath))
  }

  return `${decodedPathname}${parsedUrl.search}${parsedUrl.hash}`
}
