# Refactor Plan

## Objective

Refactor the existing Expo React Native codebase without changing user-facing behavior. The work should improve readability, maintainability, typing quality, module boundaries, and render performance while removing workaround-style code where a cleaner production-ready approach is available.

## Current Codebase Snapshot

- The project already leans toward a feature/domain structure under `src/modules`, `src/components`, and `src/app`.
- The highest-coupling area is the player stack:
  `src/modules/player/*`, player UI blocks, and screens that subscribe directly to player store state.
- There are still several `any` usages and legacy-compat parsing paths in shared modules:
  `src/modules/player/player-adapter.ts`
  `src/modules/playlist/playlist.utils.ts`
  `src/modules/library/library-sort.utils.ts`
  `src/components/ui/marquee-text.tsx`
  `src/components/blocks/player/lyrics-view.tsx`
  `src/components/blocks/player/progress-bar.tsx`
  `src/modules/tracks/tracks.mutations.ts`
- There are broad Zustand subscriptions in player, library, and screen-level code that can be reduced with narrower selectors and derived hooks.
- The repo uses strict TypeScript, but `allowJs` is enabled in `tsconfig.json`; any refactor should preserve build behavior while tightening local typing discipline.
- Existing platform constraints matter:
  Expo Router, TrackPlayer, Legend List, Expo FileSystem, Drizzle, and React Query are all part of the runtime surface and should be preserved.

## Refactor Principles

- Preserve all behavior and existing features.
- Refactor in small, reviewable slices.
- Prefer pure helpers over hidden side effects.
- Keep module APIs narrow and explicit.
- Avoid unnecessary memoization because the project uses React Compiler.
- Prefer store selectors and focused hooks over large component subscriptions.
- Keep Legend List render paths stable and lightweight.
- Remove workaround code only when a cleaner replacement is verified to preserve behavior.

## Execution Strategy

Work in slices so each step can be validated, documented, and committed independently with conventional commit messages.

### Slice 0: Baseline And Guardrails

Status: `completed`

Scope:

- Reconfirm project constraints and runtime boundaries.
- Document high-risk areas before refactoring.
- Capture the current refactor backlog in this file.

Deliverables:

- `refactor_plan.md`
- A prioritized list of modules and risks

Completion criteria:

- Plan exists at project root.
- Next slices are ordered by risk and leverage.

### Slice 1: Player Domain Boundary Cleanup

Status: `completed`

Scope:

- Audit `src/modules/player/*` for mixed responsibilities between store state, queue mutation logic, playback orchestration, persistence, and native adapter code.
- Remove workaround-style state coordination where a clearer service boundary is possible.
- Introduce narrower selectors or domain hooks for UI consumers that only need part of player state.
- Keep playback behavior identical.

Primary files:

- `src/modules/player/player.service.ts`
- `src/modules/player/player-controls.service.ts`
- `src/modules/player/player-session.service.ts`
- `src/modules/player/queue.service.ts`
- `src/modules/player/player.store.ts`
- `src/components/blocks/player/*`
- `src/components/blocks/mini-player.tsx`

Problems to address:

- Service and state concerns are still intertwined.
- UI components subscribe directly to broad store fields.
- Queue/session/playback flows have some defensive coordination logic that should be simplified where possible.

Completion criteria:

- Player-side modules each have a single, clear responsibility.
- Repeated queue/session logic is consolidated.
- UI consumers read player state through narrower selectors or dedicated hooks.
- No playback regressions.

Completed notes:

- Added a dedicated runtime coordination module for queue-replacement lifecycle state instead of keeping transient orchestration flags inside `player.service.ts`.
- Added a player selector layer so player UI and route consumers no longer read the raw player store directly.
- Updated player-facing screens and blocks to depend on player selectors rather than store internals.
- Simplified `QueueView` so it reads queue state through a player hook and no longer needs prop-threaded current-track context.
- Extracted queue-building logic in `player.service.ts` into a focused helper to keep track-selection orchestration smaller and easier to test.
- Reworked playback-session restoration so bootstrap hydrates store state without eagerly rebuilding the native queue, and queue/transport commands now lazily rehydrate the native queue only when needed.
- Added a lightweight playback-session sync on foreground return so long background sessions refresh player state without forcing the old heavy restore path.
- Preserved playback behavior while keeping the previous shuffle/playback fixes intact.

Planned commit message:

- `refactor(player): tighten playback and queue boundaries`

### Slice 2: Remove Unsafe Typing And Compatibility-Like Paths

Status: `completed`

Scope:

- Replace `any` usages with concrete types or safe unknown-to-narrow patterns.
- Remove compatibility-shaped parsing and fallback code where obsolete and safe to delete.
- Improve type signatures for shared helpers and adapters.

Primary files:

- `src/modules/player/player-adapter.ts`
- `src/modules/playlist/playlist.utils.ts`
- `src/modules/library/library-sort.utils.ts`
- `src/components/ui/marquee-text.tsx`
- `src/components/blocks/player/lyrics-view.tsx`
- `src/components/blocks/player/progress-bar.tsx`
- `src/modules/tracks/tracks.mutations.ts`
- `src/types/jsmediatags.d.ts`

Problems to address:

- `any` weakens maintainability and testability.
- Shared utilities are harder to reason about because contracts are implicit.
- Legacy/compatibility branches should be reevaluated and removed when no longer needed.

Completion criteria:

- Public helper APIs are typed.
- `any` is eliminated from targeted files.
- Compatibility branches retained only when required by persisted data or platform realities.

Planned commit message:

- `refactor(types): remove unsafe any usage in shared modules`

Completed notes:

- Replaced implicit `any` contracts in player and playlist adapters with concrete input shapes and explicit normalization for optional native/database fields.
- Converted library sort helpers to generic typed utilities so album, artist, and playlist consumers no longer rely on `as` casts to recover their concrete result types.
- Tightened UI-facing prop and event types in `marquee-text`, `lyrics-view`, and `progress-bar`, including stable parsed lyric memoization and safer animated text input props.
- Typed the track detail cache update path in React Query so favorite toggles no longer depend on untyped cache state.
- Narrowed the local `jsmediatags` module declaration to realistic tag value shapes instead of an open `any` index signature.
- Removed the invalid search layout screen declarations and made bootstrap listener registration idempotent while fixing artist-detail back navigation through the shared back button API, preserving the same user-facing routes while eliminating router warnings and duplicated listener setup.

### Slice 3: List And Screen Rendering Hygiene

Status: `completed`

Scope:

- Review Legend List and high-traffic screen blocks for unnecessary re-renders and heavy render-time work.
- Extract lightweight view hooks or helpers where they reduce component complexity.
- Keep render-item contracts stable and avoid inline expensive logic on hot paths.

Primary files:

- `src/components/blocks/track-list.tsx`
- `src/components/blocks/favorites-list.tsx`
- `src/components/blocks/ranked-track-carousel.tsx`
- `src/components/blocks/player/queue-view.tsx`
- `src/app/(main)/(library)/*`
- `src/app/(main)/(home)/*`
- `src/app/(main)/(search)/index.tsx`

Problems to address:

- Some screen-level files mix data selection, UI state, and rendering concerns.
- List consumers can lean more on derived values and smaller subscriptions.
- High-frequency player and indexing state should stay isolated from large view trees.

Completion criteria:

- Large screens are easier to scan and reason about.
- List rows do only the work they need.
- Store subscriptions are reduced to the smallest practical surface.

Planned commit message:

- `refactor(ui): streamline list and screen render paths`

Completed notes:

- Removed skeleton-driven loading branches from home, library, genre, album, artist, playlist, and playlist-form screens so the offline player shows real content, empty states, or lightweight blank shells instead of placeholder shimmer UIs.
- Deleted the now-unused shared skeleton components once all screen callers were removed.
- Simplified `LibraryTabState` so library tabs render directly from data presence rather than switching through screen-specific skeleton modes.
- Tightened hot list blocks by stabilizing row callbacks and memoized row components in `TrackList`, `FavoritesList`, `RankedTrackCarousel`, and `QueueView`.
- Kept pull-to-refresh and existing empty states intact while reducing render-time branching across the library, home, and search surfaces.

### Slice 4: Repository And Query Layer Simplification

Status: `pending`

Scope:

- Reduce duplicated query shaping and transformation logic in repository modules.
- Align repository return types with consuming query hooks.
- Separate pure mapping from IO-heavy repository functions.

Primary files:

- `src/modules/library/library.repository.ts`
- `src/modules/genres/genres.repository.ts`
- `src/modules/favorites/favorites.repository.ts`
- `src/modules/history/history.repository.ts`
- `src/modules/player/player.repository.ts`
- `src/utils/transformers.ts`

Problems to address:

- Similar query patterns and transformation logic appear in multiple repositories.
- IO and shaping logic are sometimes coupled too tightly.

Completion criteria:

- Repeated repository patterns are consolidated into small helpers where helpful.
- Repository functions return clearer, better-typed shapes.
- Consumers need less defensive code.

Planned commit message:

- `refactor(data): simplify repository query and mapping flows`

### Slice 5: Settings, Bootstrap, And Indexer Cohesion

Status: `pending`

Scope:

- Clean up bootstrap and settings orchestration so startup responsibilities are easier to trace.
- Review indexer runtime and progress/state handling for smaller functions and clearer command boundaries.

Primary files:

- `src/modules/bootstrap/*`
- `src/modules/indexer/*`
- `src/modules/settings/*`
- `src/components/providers/*`

Problems to address:

- Startup and runtime orchestration are naturally side-effect-heavy and benefit from clearer boundaries.
- Some modules can be split into pure decision helpers and side-effect executors.

Completion criteria:

- Bootstrap flow is easier to follow.
- Indexer command/state transitions are clearer.
- Settings modules expose focused responsibilities.

Planned commit message:

- `refactor(runtime): clarify bootstrap settings and indexer flows`

### Slice 6: Developer Experience And Consistency Pass

Status: `pending`

Scope:

- Normalize naming and file-level conventions in touched modules.
- Remove dead imports and leftover duplication from earlier slices.
- Update this plan with completed work and residual risks.

Primary files:

- Touched files from all prior slices

Completion criteria:

- Touched modules follow consistent naming and structure.
- No stale helpers or dead code remain from the refactor.
- Plan reflects what was completed and what remains.

Planned commit message:

- `chore(refactor): finalize consistency and cleanup pass`

## Validation Checklist Per Slice

- Run lint or targeted validation when the environment allows it.
- Verify key user flows affected by the slice.
- Confirm no external behavior changed.
- Update this file:
  mark completed work
  note what changed
  note any follow-up items
- Create a conventional commit for that slice.

## Risks And Watchouts

- Player and queue code is behavior-sensitive and should be refactored incrementally.
- Persisted playback/session code may still require limited legacy handling until migration is explicitly removed.
- Large repository files may look tempting to split aggressively; prefer extracting stable helpers over folder churn.
- Screen files under Expo Router should preserve route structure even if their internals are decomposed.

## Optional Structural Improvements

- Introduce small domain hooks such as player selectors and queue view selectors under `src/modules/<domain>/hooks` only where they clearly reduce coupling.
- Group pure domain helpers more consistently under each module instead of leaving shaping logic in screens or UI blocks.
- Consider a dedicated `src/modules/player/selectors.ts` or similar if store access keeps spreading across UI.

## Done Log

- [x] Slice 0: create initial `refactor_plan.md`
- [x] Slice 1: player domain boundary cleanup
- [ ] Slice 2: remove unsafe typing and compatibility-like paths
- [ ] Slice 3: list and screen rendering hygiene
- [ ] Slice 4: repository and query layer simplification
- [ ] Slice 5: settings, bootstrap, and indexer cohesion
- [ ] Slice 6: developer experience and consistency pass
