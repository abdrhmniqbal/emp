# System Map

## Module Map
- `src/app/**`: Expo Router routes and user-facing screens.
- `src/modules/settings/**`: Settings state, persistence, split-metadata behavior, and route definitions.
- `src/modules/indexer/**`: Library indexing flow, metadata parsing, and DB writes.
- `src/modules/player/**`: Player runtime, queue/actions, and player-facing UI data.
- `src/modules/library/**`, `src/modules/artists/**`, `src/modules/genres/**`: Library browsing queries and types.
- `src/modules/localization/**`: i18n resources and language utilities.
- `src/db/**`: SQLite schema, migrations, and database client.
- `src/components/blocks/value-navigation-sheet.tsx`: Reusable chooser sheet for multiple navigation targets.

## Core Logic Flow
1. UI routes (`src/app`) trigger actions via module hooks/services.
2. Settings route `src/app/settings/split-multiple-values.tsx` updates split config through `src/modules/settings/split-multiple-values.ts` and marks deferred reindex prompts.
3. Library settings route consumes prompt state and offers reindex action.
4. Indexer (`src/modules/indexer/indexer.repository.ts` → `metadata.repository.ts`) loads split config and applies symbol-based parsing while extracting metadata.
5. Player and track action sheets use split config + chooser sheet to navigate when metadata has multiple artists/genres.

## Data & Config
- Persistent settings: `src/modules/settings/settings.repository.ts` + `settings.store.ts`.
- Split metadata settings: `src/modules/settings/split-multiple-values.ts` persisted in `split-multiple-values.json`.
- Metadata normalization/indexing: `src/modules/indexer/metadata.repository.ts` and `indexer.repository.ts`.
- Localization strings: `src/modules/localization/resources/*.json`.
