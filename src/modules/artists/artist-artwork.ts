export function resolveArtistArtwork(
  trackArtwork?: string | null,
  artistArtwork?: string | null,
  albumArtwork?: string | null
): string | undefined {
  return trackArtwork || artistArtwork || albumArtwork || undefined
}
