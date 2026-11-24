# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server
- `npm run check` — svelte-kit sync + svelte-check (the main type/lint gate; there is no ESLint/Prettier config)
- `npm run build` — production build via `@sveltejs/adapter-cloudflare`
- `npm run preview` — build, then serve with `wrangler dev`
- `npm run deploy` — build + `wrangler deploy` (Cloudflare Workers/Pages; config in `wrangler.jsonc`)

There is no test runner. Pure modules in `src/lib/` (`streak.ts`, `timeline.ts`, `time.ts`, `frequency.ts`, `recovery.ts`, …) import each other with explicit `.ts` extensions, so they can be exercised directly with Node 24's type stripping, e.g. a throwaway script `import { currentStreak } from './src/lib/streak.ts'` run with `node script.mjs`. Modules ending in `.svelte.ts` use runes and can't be loaded this way.

## Architecture

Svelte 5 (runes forced on for all project files in `vite.config.ts`) + SvelteKit 2, **client-only**: `src/routes/+layout.ts` sets `ssr = false`, `prerender = false`. Everything is stored in the browser; there is no backend.

**State and persistence**
- `src/lib/stores.svelte.ts` is the single source of app state: module-level `$state` objects (`routines`, `settings`, `streak`, `painLog`, `morningChecks`) initialised from `storage.ts` at import. Persistence is explicit, not reactive: every mutating function calls `saveAll()` (or a specific `saveX`). Mutate state through these exported functions rather than writing to the objects from components, or changes won't be saved.
- `src/lib/storage.ts` owns the localStorage keys (`stretchTimer.*`), `defaultSettings`, rolling snapshots (last 5, restorable in Settings), and photo blobs in IndexedDB (`stretch-timer` / `photos`; routines reference photos by `photoId`).
- Data migrations run once at load (`migrateSchedules()` at the bottom of `stores.svelte.ts`). When changing persisted shapes in `types.ts`, add a migration there and keep old fields optional.
- `backup.ts` handles Web Share export and File System Access auto-sync, triggered from store mutations / routine completion.

**Playback**
- `timeline.ts` flattens a `Routine` into `Segment[]` (stretches, two-sided stretches as left/right segments, breaks between stretches). `player.svelte.ts` drives those segments with deadline-based timing (`Date.now()`, scaled by `settings.playbackSpeed` in testing mode), fires `audio.ts` Web Audio cues, and calls `recordCompletion` / `creditToday` on finish.

**Domain logic** (pure, no Svelte): `streak.ts` (streaks, fixers earned per 7 days, gap repair), `frequency.ts` (schedules: days + times), `recovery.ts` (pain zones, morning check, pain trend, readiness to progress), `reminders.ts` + `calendar.ts` (notification state shared with the service worker, ICS export).

**Content**
- `stockStretches.ts` is the built-in catalog; `stockTags.ts` derives focus/equipment tags and search text from it.
- Illustrations are generated SVG stick figures: `illustrations/figure.ts` defines the jointed figure and `Angles`, `illustrations/poses.ts` maps `iconKey`s to poses (angle conventions documented at the top of that file). `StretchIllustration.svelte` resolves a stretch's `iconKey` (falling back to name) to a pose. New stock stretches need a matching pose key.

**PWA**: `src/service-worker.ts` precaches build + static assets per version and also handles reminder notifications using `$lib/reminders`. Manifest and icons are in `static/`. `pwa.svelte.ts` handles install prompt state.

**Routes**: `/` (Home: Up next, this week, streak and recovery cards), `/routines` (routine list, new routine, starters), `/routine/[id]` (editor), `/player/[id]` (playback, sized to fit `100dvh` without scrolling on phones), `/stats`, `/settings` (backups, snapshots, testing mode tools).

## Conventions

- Inside `src/lib`, relative imports include the `.ts` extension (`./time.ts`); route/component code imports via `$lib/...` without the extension (`tsconfig` uses `rewriteRelativeImportExtensions`).
- Styling is vanilla CSS with design tokens in `src/app.css` (light/dark/system themes); no CSS framework.
- The UI is phone-first; check layouts at mobile widths.
