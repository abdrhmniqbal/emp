<!--
Purpose: Root navigation guide for AI/code-agent sessions on Startune Music.
Caller: Agents and contributors starting work in this repository.
Dependencies: README.md, package.json, app.json, drizzle.config.ts, src/db/schema.ts, optional SYSTEM_MAP.md.
Main Functions: Session protocol, architecture reference, command guide, testing and style rules.
Side Effects: None.
-->

# AGENTS.md

## Project Overview

Startune Music is an offline-first local music player built with Expo, React Native, and Expo Router. It indexes audio files on-device, stores metadata in SQLite through Drizzle ORM, and supports local playback, playlists, favorites, queue management, search, settings, notifications, and rich player screens.

The app is mobile-first and local-library focused: avoid assuming any cloud streaming backend, account system, or remote media catalog unless the code explicitly adds one.

## Session Start Protocol

Read only the minimum needed context before editing:

1. `package.json` — stack, scripts, dependency constraints.
2. `README.md` — product scope, user-facing features, development notes.
3. `app.json` — Expo config, permissions, plugins, React Compiler setting.
4. `src/db/schema.ts` — SQLite schema, relations, indexes, persisted app state.
5. `SYSTEM_MAP.md` if present — architecture map and flow references.

If `SYSTEM_MAP.md` is missing and the task changes architecture, data flow, module boundaries, or integrations, create or update it briefly in the same change. Do not perform broad blind scans when a map or existing file header can point to the target module.

Before editing, write a short trace note in the work summary:

```text
Trace: <target file> -> <function/flow>; impact: <related modules/state/db/ui>.
```

## Quick Start Commands

Use Bun.

```bash
bun install
bun run start
bun run android
bun run ios
bun run web
bun run lint
bun run format
bun run knip
```

Do not run `bun run build`; this project currently treats that as a prohibited command.

## Architecture Quick Reference

| Area | Location / Tooling | Notes |
|---|---|---|
| App runtime | Expo SDK 54, React Native 0.81, Expo Router | Entry is `expo-router/entry`; native app config lives in `app.json`. |
| UI | HeroUI Native, Uniwind, Tailwind CSS, React Native primitives | Keep screens mobile-first and responsive to theme/safe-area behavior. |
| State | Zustand, TanStack Query | Use store state for local UI/player state; use query patterns for async/cacheable data. |
| Database | SQLite via Expo SQLite, Drizzle ORM | Schema and relations live in `src/db/schema.ts`; migrations output to `src/db/migrations`. |
| Music playback | React Native Track Player fork | Preserve background audio, queue, seeking, repeat/shuffle, metadata, and notification behavior. |
| Local media | Expo Media Library, filesystem, metadata retriever | Index existing on-device audio; avoid remote catalog assumptions. |
| Navigation | Expo Router | Keep route-level behavior explicit; avoid hidden cross-route side effects. |
| Localization | i18next, react-i18next, expo-localization | User-facing text must use localization strings, not hardcoded literals. |

Core persisted entities include artists, albums, genres, tracks, track-genre links, track-artist links, playlists, playlist tracks, play history, artwork cache, indexer state, and app settings.

Typical flow shape:

```text
Screen / route
  -> hook or UI handler
  -> store / service / query function
  -> repository or Drizzle query
  -> SQLite / filesystem / native media APIs
```

Map unfamiliar terms by responsibility, not by name. A `hook`, `runtime`, `manager`, `repository`, `adapter`, or `store` may fill the same layer role depending on the module.

## Testing and Verification

Prefer the smallest verification that proves the change:

```bash
bun run lint
bun run knip
```

For UI or native behavior, document manual verification instead of inventing unavailable tests:

```text
Verified: opened <screen>, performed <action>, observed <result>.
```

For database changes, verify at the query/design level before finalizing:

- Fetch only needed columns and rows.
- Avoid N+1 reads; batch or join where appropriate.
- Use existing indexes or add justified indexes for selective filters.
- Keep transactions short and scoped.
- Prefer atomic upserts/updates over read-then-write races.
- Consider behavior at 10k+ tracks.

## Documentation Navigation

| Need | Read / Update |
|---|---|
| Product overview and development basics | `README.md` |
| Release notes | `CHANGELOG.md` |
| Agent operating rules | `AGENTS.md` |
| Architecture map | `SYSTEM_MAP.md` if present; create/update when architecture changes |
| Stack and commands | `package.json` |
| Native permissions/plugins | `app.json` |
| Database schema and relations | `src/db/schema.ts` and `src/db/migrations` |
| External agent skill docs | `.agents/skills/**` only when the task needs that specific skill |

When modifying business logic, keep documentation synchronized:

- Update the file header block if purpose, caller, dependencies, main exports, or side effects change.
- Update `SYSTEM_MAP.md` when adding/removing files, renaming exports, changing critical data flow, adding integrations, or changing schema responsibility.
- Do not expand scope silently; separate unrelated improvements from the requested change.

## Code Style Guidelines

- TypeScript only; avoid `any` unless narrowed at an external boundary with a clear reason.
- Follow SOLID, DRY, and KISS; keep modules single-purpose.
- Do not add dependencies before checking `package.json` for existing capability.
- Do not add automatic memoization; React Compiler is enabled in `app.json`.
- Do not hardcode user-facing strings; use localization resources.
- Keep database work cost-aware: selective filters, indexed access, minimal writes, short transactions.
- Prefer explicit data flow over implicit global side effects.
- Keep generated, dependency, build, cache, lock, and artifact files out of analysis unless directly relevant.
- Ignore broad scans of `node_modules`, `.git`, `.expo`, `dist`, `build`, `coverage`, `.cache`, lock files, logs, minified files, and source maps.

## File Header Standard

Every created or significantly modified source file must start with a concise header matching the language comment style:

```ts
/**
 * Purpose: <what this file/module does>
 * Caller: <main consumers>
 * Dependencies: <important services/repos/APIs>
 * Main Functions: <public exports or entry points>
 * Side Effects: <DB, filesystem, native API, network, notifications, none>
 */
```

Keep headers accurate after edits. Do not modify logic while leaving stale purpose, dependency, or side-effect documentation behind.
