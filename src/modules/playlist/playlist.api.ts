import { db } from "@/db/client";
import { playlistTracks, playlists } from "@/db/schema";

function generateId(): string {
  if (globalThis.crypto && globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export async function createPlaylist(
  name: string,
  description: string = "",
  trackIds: string[] = [],
): Promise<void> {
  try {
    const id = generateId();
    const now = Date.now();

    await db.insert(playlists).values({
      id,
      name,
      description,
      trackCount: trackIds.length,
      createdAt: now,
      updatedAt: now,
    });

    if (trackIds.length > 0) {
      await db.insert(playlistTracks).values(
        trackIds.map((trackId, index) => ({
          id: generateId(),
          playlistId: id,
          trackId,
          position: index,
          addedAt: now,
        })),
      );
    }
  } catch (e) {
    console.error("Failed to create playlist", e);
  }
}
