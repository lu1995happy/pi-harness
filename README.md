# Personal Pi harness

A macOS-first global Pi coordinator and background supervisor, with Pi, Claude Code and Codex crews in Herdr and native Git worktrees. Projects remain in their existing repositories.

Implementation status and review evidence are in [PROGRESS.md](PROGRESS.md). macOS application verification remains pending on this Windows development host.

## Install on macOS

With Pi, Herdr, WezTerm, Node 22.19+ and Git installed:

```sh
node scripts/install-macos.mjs
herdr server reload-config
```

The installer stages owned files under `~/.pi/agent/harness/releases/`, installs pinned dependencies, runs tests, installs a digest-verified no-mistakes 1.64.0 binary and full Herdr Annotate, then activates the release in global Pi settings. If Bun is absent, Homebrew must be available to install it. Existing model settings and unrelated packages are preserved.

Launch Pi normally inside Herdr from any existing project. `/harness` reports role and home; `/crew-status` refreshes supervision, map groups and waiting visual questions; `/calm` toggles middle activity while preserving prompt and output. Pi crews have `todo` and `/simplify`. Firstmate uses `fm_map` to dispatch, review, merge, clean and ship maps.

Planning workflows use `/grill-with-docs`, `/wayfinder`, `/to-spec`, `/to-tickets`, `/show-me` or Pi's `/skill:<name>` interface. Main delegates substantive research and artifact creation to crews. Maps are explicit issue lists; GitHub sub-issue support is unnecessary.

## Layout

- `components/firstmate/`: selected supervision and calm behavior.
- `components/`: isolated tool display, Simplify and Herdr lifecycle integrations.
- `extensions/`: role tools and terminal UI.
- `src/`: map lifecycle, durable storage and native command adapters.
- `skills/`: adapted planning, visual and validation workflows.
- Global `harness/state/`: maps, worktrees, events, acknowledgements and assignments.

See [requirements](docs/requirements.md), [UI design](docs/ui-and-extensions.md), [macOS checks](docs/macos.md), [upstream inventory](upstream.json) and [maintenance](docs/upstream-maintenance.md).

```sh
npm ci --ignore-scripts --legacy-peer-deps
npm test
node scripts/doctor-macos.mjs
node scripts/install-macos.mjs --rollback
```

Rollback selects the previous harness release while retaining runtime state and projects. External annotation and no-mistakes installations have separate rollback boundaries.
