import type { InferSelectModel } from "drizzle-orm";
import type { tracks, artists, albums, genres } from "@/db/schema";

export type DBTrack = InferSelectModel<typeof tracks> & {
    artist: InferSelectModel<typeof artists> | null;
    album: InferSelectModel<typeof albums> | null;
    genres: Array<{ genre: InferSelectModel<typeof genres> | null }>;
};

export type DBArtist = InferSelectModel<typeof artists>;
export type DBAlbum = InferSelectModel<typeof albums> & {
    artist: InferSelectModel<typeof artists> | null;
};
export type DBGenre = InferSelectModel<typeof genres>;
