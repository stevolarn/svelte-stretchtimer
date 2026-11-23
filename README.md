# 🧘 Stevo's Stretch Timer

A fast, phone-first, 100% offline web app for building, timing, and tracking stretching and mobility routines. Built with **Svelte 5** and designed for seamless use on mobile phones and desktop browsers.

---

## ✨ Features

### 📱 Phone-First & PWA Installable on Android
- **Installable from Chrome on Android**: Full Progressive Web App (PWA) with Web App Manifest, offline-first Service Worker, and high-resolution icons (192px, 512px, maskable, and SVG).
- **Standalone App Experience**: Launches full-screen from your Android home screen with zero browser URL bar or navigation clutter.
- **Zero-Scroll Player**: Calibrated to fit mobile viewports (e.g. Google Pixel 9 Pro) within `100dvh` without page scrolling.
- **Mobile Bottom Navigation Bar**: Quick, thumb-friendly access to Routines, Streak, and Settings with safe-area inset padding.
- **Touch-Native Drag & Drop**: Smooth pointer-event drag-and-drop reordering with haptic feedback, alongside dedicated 1-tap `↑` / `↓` controls.
- **Screen Wake Lock**: Automatically prevents your phone screen from dimming or sleeping during routine playback using the Screen Wake Lock API.

### 🧘 Curated Stock Stretches Library & Illustrations
- **Stock Stretches Catalog**: 20+ built-in stretching movements organized by category (Upper Body, Spine & Core, Hips & Glutes, Legs & Calves).
- **1-Tap Stretch Adding**: Add ready-to-go stretches with pre-filled names, cues, sides, and recommended durations.
- **Custom Stretch Support**: Create blank custom stretches at any time with custom names, durations, side configurations, and camera photos.
- **Dynamic Vector Pose Artwork**: Crisp, modern SVG pose illustrations displayed in stretch cards, thumbnails, the picker modal, and during workout playback.

### ⏱ Accurate Timed Playback
- **Live Total Routine Time**: Automatically computes and displays the live total time of any routine while creating or editing.
- **Per-Routine Break Length**: Configure custom break intervals (`0s`, `5s`, `10s`...) per routine, with a 5-second global default.
- **Adaptive Progress Ring**: High-contrast countdown timer with real-time circular SVG animation.
- **Deadline-Based Timing**: Accurate millisecond-precise timing driven by `Date.now()` that never drifts even if backgrounded.
- **Single & Two-Sided Stretches**: Configurable one-side or two-sided stretches (`Left` → beep → `Right`).
- **5-Second Timer Increments**: Quick +/- steppers for fast routine duration configuration (e.g., 25s, 30s, 35s).
- **In-Player Routine Map & Quick Jump**: Visual progress track and segment chips to jump between stretches.
- **Keyboard Shortcuts**: `Space` (Play/Pause), `←` (Previous), `→` (Skip), `Esc` (Stop).

### 🔒 Rock-Solid Storage & Automated Backups
- **Persistent Storage API**: Automatically requests browser persistence (`navigator.storage.persist()`) so mobile browsers (e.g., Chrome on Android) never evict routine or streak data under storage pressure.
- **Local Rolling Auto-Snapshots**: Automatically saves the last 5 state versions locally with 1-tap rollback/restore in Settings.
- **1-Tap Save to Google Drive / Files**: Native cloud backup export using the Web Share API (which directly triggers Android's system "Save to Google Drive" dialog).
- **File System Auto-Sync**: Link a local or cloud-synced backup file (via File System Access API) that auto-updates on every change.
- **Auto-Backup on Finish**: Optional automatic backup trigger whenever a routine is completed.
- **Complete Backups**: Backups include routines, pain scores and morning checks; restoring merges them without duplicates.

### 🧪 Developer & Testing Mode
- **Speed Multipliers**: Fast-forward player timing at `1x`, `5x`, `10x`, or `30x` speed to test a full routine in seconds.
- **In-Player Dev HUD**: Quick buttons to jump to the final 3s countdown ticks, skip stretches, or complete a workout immediately.
- **Streak & Fixer Simulator**: Test 7-day streaks, missed day breaks, and fixer repairs with 1-tap test buttons.
- **Test Routine Seeder**: Seed pre-configured 5-second quick test routines in seconds.

### 🔔 Synthesized Audio Cues
- Built-in Web Audio synthesizer generating crisp, clean tone cues without heavy audio files.
- Dedicated tones for **Stretch start**, **Side switch (L → R)**, **Final 3-second countdown ticks**, and **Routine finish fanfare**.
- Full control to toggle each tone and test sounds in Settings.
- Optional customizable break periods between stretches.

### 🔥 Streaks & Streak Fixers
- **Daily Streak Tracking**: Completing any routine credits the day.
- **Streak Fixers**: Earn 1 streak fixer for every 7 completed days to repair an accidental missed day.
- **Complete Streak Repair**: Enforces complete repair of broken streak gaps using available earned fixers.
- **42-Day Visual Calendar**: Interactive history grid of recent workout activity.
- **Reset Capability**: Option to clear streak history whenever you want a clean slate.

### 🩹 Recovery & Habit Tools
- **Habit Cues**: Anchor each routine to something you already do ("After I pour my morning coffee"), shown on the Up next card. In a meta-analysis, if-then plans like this gave a medium-to-large boost to follow-through (d ≈ 0.65; Gollwitzer & Sheeran, 2006).
- **Pain Zones**: After a routine, your 0-10 pain score gets a green / amber / red read based on the tendon pain-monitoring model: up to 5/10 is fine if it has settled by the next morning.
- **Morning Check**: The day after a session, answer Better / Same / Worse. If it's worse, today's routine is suggested in its gentle version.
- **Rising-Pain Alert**: A card appears if pain rises week on week or two mornings feel worse, with a "When to get it checked" guide to warning signs.
- **Ready to Progress?**: After a calm fortnight on a routine (6+ plays, pain ≤3, no bad mornings), you're offered one step up: +5s per stretch or +1 set. It never changes anything without asking.
- **Forgiving Streaks**: Shows days practised in the last 30 alongside the streak, because missing a single day doesn't undo a habit (Lally et al., 2010).
- **Optional by Design**: Pain scores, the morning check, rising-pain alerts, progress prompts and the weekly review can each be switched off in Settings → Tracking & prompts.

### 🚀 Starter Routine Presets
Includes 6 ready-to-use stretching routines with illustrated previews:
1. **Desk Reset** (3 min) – Neck, shoulders, wrists, and chest.
2. **Morning Mobility** (5 min) – Cat-cow, low lunge, side bend, forward fold.
3. **Bedtime Wind-Down** (5 min) – Child’s pose, seated fold, reclined twists, breathing.
4. **Lower-Body Reset** (5 min) – Calves, quads, hamstrings, hip flexors.
5. **Runner’s Recovery** (5 min) – Standing calf stretch, figure-four, hip flexor release.
6. **Full-Body Mobility** (6 min) – Balanced full-body flow.

---

## 🛠 Tech Stack

- **Framework**: [Svelte 5](https://svelte.dev/) with modern Runes (`$state`, `$derived`, `$effect`, `$props`)
- **App Engine**: [SvelteKit 2](https://kit.svelte.dev/)
- **Service Worker & PWA**: Offline-first caching with `$service-worker`
- **Language**: TypeScript
- **Bundler**: [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS Design Tokens (Automatic Light / Dark / System theme)
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com/) (`@sveltejs/adapter-cloudflare`)

---

## 💻 Development

### Prerequisites
- Node.js 18+
- npm

### Setup
```bash
# Clone the repository
git clone https://github.com/stevolarn/svelte-stretchtimer.git
cd svelte-stretchtimer

# Install dependencies
npm install

# Start development server
npm run dev

# Run TypeScript & Svelte diagnostics
npm run check

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 📄 License

MIT License. Feel free to use, modify, and build upon this project.
