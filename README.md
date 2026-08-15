# Stevo's Stretch Timer (Svelte)

A fully offline web app for building and timing stretching/exercise routines — a browser port of a
Kotlin/Jetpack Compose Android app. Everything runs in the browser: no network calls, data is stored
in `localStorage` (routines, settings, streak) and IndexedDB (photos).

## Features

- **Build routines** — add, edit, reorder (drag handle or ↑/↓ arrows), duplicate, and delete named
  stretches; each with an optional photo (file picker, downscaled into app-private IndexedDB
  storage), a description, and a duration.
- **One- or two-sided stretches** — two-sided stretches play Left → beep → Right with one shared
	duration set once for both sides.
- **Timed playback** — full-screen player with a progress ring, mm:ss countdown, current photo and
  description, Left/Right badge, "Next: …" during breaks, and pause/resume, back, skip, and restart
  controls. Timing is deadline-based (`Date.now()`), so the countdown stays accurate when the tab is
  backgrounded, and the screen is kept awake with the Wake Lock API while playing.
- **Audible cues** — distinct Web Audio beeps for stretch start, side switch, the last 3 seconds of
  each stretch/break, and finish; every cue is toggleable in Settings, with test buttons.
- **Optional fixed breaks** between stretches, configured in Settings.
- **Streaks** — finishing a routine credits the day; consecutive days build a streak and missing a
  day breaks it. Every 7 completed days earns a **streak fixer** that repairs the most recent break.
- **Quick starts** — begin with Desk reset or Morning mobility templates and customize them like any
	other routine. The menu also includes Bedtime wind-down, Lower-body reset, Runner’s recovery, and
	Full-body mobility, each with an illustrated preview.
- **Routine library tools** — search and sort routines, plus export/import versioned JSON backups that
  include locally stored photos. Restores are additive and generate fresh ids.
- **Player navigation** — see whole-routine progress and jump directly to any stretch or break from
  the in-player routine map.
- **Polish** — light/dark/system theme, seconds steppers on all duration fields.

## Develop

```sh
npm install
npm run dev        # dev server
npm run check      # svelte-check + tsc
npm run build      # production build
npm run preview    # preview the production build
```

## Notes / trade-offs vs. the Android original

- Photos are stored as downscaled JPEG data URLs in IndexedDB (the web's app-private storage).
- The Android "foreground service with notification controls" has no direct web equivalent; instead
  playback timing is deadline-based so it stays correct in background tabs, the countdown is shown in
  the tab title, and beeps play via Web Audio while the tab is active.
