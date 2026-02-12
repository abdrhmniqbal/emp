import { initializeTrackPlayer, registerPlaybackService } from '@/core/audio/track-player.service';
import { requestMediaLibraryPermission } from '@/core/storage/media-library.service';
import { db } from '@/db/client';
import { startIndexing } from '@/modules/indexer';
import { tracks } from '@/db/schema';
import { count } from 'drizzle-orm';

export async function bootstrapApp(): Promise<void> {
  registerPlaybackService();
  await initializeTrackPlayer();

  const { status } = await requestMediaLibraryPermission();
  if (status === 'granted') {
    const result = await db
      .select({ value: count() })
      .from(tracks);

    const trackCount = result[0]?.value ?? 0;
    const isFreshDatabase = trackCount === 0;

    // Always index on app bootstrap; force a full scan only for fresh databases.
    // Uses indexer store so progress UI is shown.
    void startIndexing(isFreshDatabase, true);
  }
}
