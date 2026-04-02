import * as MediaLibrary from "expo-media-library"

export async function getMediaLibraryPermission() {
  return MediaLibrary.getPermissionsAsync()
}

export async function requestMediaLibraryPermission() {
  return MediaLibrary.requestPermissionsAsync()
}
