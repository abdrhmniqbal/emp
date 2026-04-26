# Changelog

All notable changes to this project are documented in this file.

## [v0.2.3-rc.1] - 2026-04-26

### Added

- Advanced setting to reset listening history with confirmation before clearing history and play counts.
- Session-only player lyric preferences for karaoke mode and lyric zoom level.

### Changed

- Improved indexer throughput by reducing repeated database relation lookups and genre visual scans during batch processing.
- Logging verbosity now respects minimal and extra settings more consistently across runtime flows.
- Player and app notification icons now use visible white notification assets.

### Fixed

- Missing track detail queries now return `null` instead of undefined so React Query remains stable after local file deletion.
- Search focus and input transition timing now runs in sequence to avoid intermittent input overlap with the back button.
- Player drag-to-close now only responds from the drag handle instead of the whole interface.
- Duplicate rapid taps to the same navigation target are ignored during route transitions.
- Decorative playlist and folder row chevrons no longer block row navigation taps.

## [v0.2.2] - 2026-04-25

### Added

- Dedicated full player route with zoom-style presentation and updated player header behavior.
- Recently Added search destination for browsing newly indexed tracks from the Search area.
- Playback session snapshots with queue cursor persistence to restore listening state more accurately after app restarts.
- Track counts on genre cards for quicker library scanning.
- Shared themed refresh control adopted across major screens for more consistent pull-to-refresh behavior.

### Changed

- Refined album, artist, playlist, and player transitions with shared zoom presentation, cleaner stack presets, and follow-up visual polish.
- Reworked search screen composition, keyboard handling, and embedded back-button behavior to better support focused queries and detail navigation.
- Refreshed home, library, settings, and shared UI surfaces as part of the broader visual redesign pass.
- Improved track list and queue item state handling to keep selection, identity, and playback state updates more predictable.
- Enhanced playback activity tracking so play counts and listening history are recorded more reliably.
- Upgraded `heroui-native` and aligned transition-related dependencies with the new navigation setup.

### Fixed

- Fixed detail-screen back navigation requiring two taps in some transition flows.
- Fixed intermittent overlap between the search back button and typed query text during focus and transition timing.
- Fixed recent-search playlist artwork rendering so playlist entries use the expected multi-image collage.
- Fixed zoom-transition backgrounds not rendering correctly during transparent presentation flows.
- Removed extraneous screen declarations from the Home route layout to eliminate Expo Router "Too many screens defined" warnings.

## [v0.2.1] - 2026-04-16

### Added

- Shared LegendList behavior hook for unified scroll-reset and list ref wiring across core list/grid blocks.
- Shared query invalidation helper to standardize multi-key invalidation fan-out.

### Changed

- Extracted playlist form orchestration into a dedicated domain hook and simplified route-level composition.
- Unified playlist picker selection handling for player and track action sheets through a shared module hook.
- Consolidated track mapping paths so history and playlist track mapping reuse the shared DB-to-domain transformer.
- Refactored query invalidation in favorites, history, indexer, playlist, and tracks modules to use one invalidation utility path.

### Fixed

- Removed duplicate navigation/tab bars on search detail screens (album, artist, playlist) by hiding parent search-stack headers for nested detail route groups.

## [v0.2.0] - 2026-04-09

### Added

- Recently added tracks on the Search home screen.
- Recent search history with richer search targets for albums, artists, and playlists.
- Search detail routes for albums, artists, and playlists.
- Genre browsing as a first-class Library tab.
- Indexer run snapshots, retry/backoff handling, scoped commit retries, and manual completion timing.

### Changed

- Completed a major internal rewrite of the player, bootstrap, indexer, routes, and shared module boundaries.
- Simplified player session restore and foreground sync behavior for better long-background recovery.
- Tightened shared typing across player adapters, playlist utilities, sort helpers, and player UI support code.
- Streamlined high-traffic list and screen render paths.
- Removed skeleton loading UIs across app screens in favor of direct offline-friendly content and empty states.

### Fixed

- Shuffle and queue updates no longer interrupt active playback.
- Playback state transitions are more stable when switching tracks from lists.
- Search and detail routing behavior is more consistent.
- Artwork fallback behavior is more consistent across track, album, and artist surfaces.
- Indexer notifications and foreground autoscan timing are more reliable.

## [v0.2.0-rc.2] - 2026-04-02

### Added

- System notification controls for indexing progress with pause, resume, cancel, and open-library actions.
- Google Cast controls in the full player.
- Expanded runtime and route diagnostics for bootstrap, player queue, and media permission flows.

### Changed

- Improved navigation transitions and shared stack configuration for media detail routes.
- Reduced hot-screen store subscriptions and unnecessary playback/list rerenders.
- Continued the rewrite by separating bootstrap listener registration, playback helpers, indexer orchestration, and shared UI list wiring.

### Fixed

- Background playback and foreground autoscan freeze issues.
- Player state resync issues after shuffle and skip flows.
- Artist artwork fallback consistency between tabs and detail screens.
- Incremental indexing responsiveness and history refresh behavior.

## [v0.2.0-rc.1] - 2026-03-28

### Added

- Basic synchronized lyrics support for embedded lyrics, `.lrc`, and TTML lyrics.
- Structured logging across runtime workflows.
- Rewrite planning and module-boundary documentation.

### Changed

- Large-scale refactor of player, indexer, settings, bootstrap, and shared repositories/services.
- Settings and local preferences were consolidated into clearer module ownership.
- Player session persistence, queue/runtime control, and theme/file helpers were separated into dedicated modules.

### Fixed

- Repeated media permission prompts during autoscan.
- Home history refresh after playback activity.
- Duplicate player/indexer adapters and several compatibility-layer leftovers.

## [v0.1.1] - 2026-02-19

### Fixed

- Build rules and release packaging stability.

## [v0.1.0] - 2026-03-12

### Added

- Offline local music playback with queue, repeat, shuffle, seeking, and background playback.
- Library browsing for tracks, albums, artists, genres, favorites, folders, and playlists.
- Playlist creation, editing, reordering, and track action sheet playlist flows.
- Rich full-player UI, mini player, queue view, artist and album detail screens, and favorites across item types.
- Folder filters, track-duration filters, force reindex, autoscan settings, battery optimization settings, and logging controls.
- Track metadata inspection improvements, removable local files, and richer artwork-based player visuals.

### Changed

- Major UI redesign across home, library, search, album, artist, playlist, player, mini player, settings, and indexing progress.
- Adoption of Expo Router, bottom-sheet based full player flows, and improved HeroUI-based controls.

### Fixed

- Search route handling, navigation history, queue sorting, playback resume, indexing updates, and list padding/touch issues.
- Artist image fallback behavior and genre metadata handling.

## Pre-v0.1.0

- Initial project setup and basic UI scaffolding.
- Local library indexing and playback foundations.
- Early iterations of queueing, sorting, favorites, genre pages, and app-wide redesign work.
