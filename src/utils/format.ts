export const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

export const formatTrackCount = (count: number): string =>
    `${count} ${count === 1 ? "track" : "tracks"}`;

export const formatSongCount = (count: number): string =>
    `${count} ${count === 1 ? "song" : "songs"}`;
