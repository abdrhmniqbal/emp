# Refactor Smoke Checklist

Manual checks after each big refactor chunk:

- App launch
- Library tabs
- Search
- Player route
- External audio open
- Settings
- Full reindex
- Quick reindex

Scale checks when possible:

- 1k track library
- 5k track library
- 10k track library

Suggested local commands:

```bash
bun run audit:effects
bun run audit:large-files
bun run audit:scroll-map
bun run lint
bun run knip
```
