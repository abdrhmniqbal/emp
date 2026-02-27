import { getActualPath } from '@missingcore/react-native-actual-path'

function toFileUri(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`
}

export async function resolvePlayableFileUri(uri: string): Promise<string> {
  if (!uri) {
    return ''
  }

  if (uri.startsWith('content://')) {
    try {
      const actualPath = await getActualPath(uri)
      if (actualPath) {
        return toFileUri(actualPath)
      }
    } catch {
      // Fallback to the original content URI when path resolving fails.
    }
    return uri
  }

  if (uri.includes('://')) {
    return uri
  }

  return toFileUri(uri)
}

export function getContainingFolderUri(uri: string): string | null {
  if (!uri.startsWith('file://')) {
    return null
  }

  const lastSlash = uri.lastIndexOf('/')
  if (lastSlash <= 'file://'.length) {
    return null
  }

  return uri.slice(0, lastSlash)
}
