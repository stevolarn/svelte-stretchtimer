# 🧘 Stevo's Stretch Timer

A fast, phone-first, 100% offline web app for building, timing, and tracking stretching and mobility routines. Built with **Svelte 5** and designed for seamless use on mobile phones and desktop browsers.

---

## ✨ Features

### 📱 Phone-First & App-Like Experience
- **Zero-Scroll Player**: Calibrated to fit mobile viewports (e.g. Google Pixel 9 Pro) within `100dvh` without page scrolling.
- **Mobile Bottom Navigation Bar**: Quick, thumb-friendly access to Routines, Streak, and Settings with safe-area inset padding.
- **Touch-Native Drag & Drop**: Smooth pointer-event drag-and-drop reordering with haptic feedback, alongside dedicated 1-tap `↑` / `↓` controls.
- **Screen Wake Lock**: Automatically prevents your phone screen from dimming or sleeping during routine playback using the Screen Wake Lock API.

### ⏱ Accurate Timed Playback
- **Adaptive Progress Ring**: High-contrast countdown timer with real-time circular SVG animation.
- **Deadline-Based Timing**: Accurate millisecond-precise timing driven by `Date.now()` that never drifts even if backgrounded.
- **Single & Two-Sided Stretches**: Configurable one-side or two-sided stretches (`Left` → beep → `Right`).
- **5-Second Timer Increments**: Quick +/- steppers for fast routine duration configuration (e.g., 25s, 30s, 35s).
- **In-Player Routine Map & Quick Jump**: Visual progress track and segment chips to jump between stretches.
- **Keyboard Shortcuts**: `Space` (Play/Pause), `←` (Previous), `→` (Skip), `Esc` (Stop).

### 🔔 Synthesized Audio Cues
- Built-in Web Audio synthesizer generating crisp, clean tone cues without heavy audio files.
- Dedicated tones for **Stretch start**, **Side switch (L → R)**, **Final 3-second countdown ticks**, and **Routine finish fanfare**.
- Full control to toggle each tone and test sounds in Settings.
- Optional customizable break periods between stretches.

### 🔥 Streaks & Streak Fixers
- **Daily Streak Tracking**: Completing any routine credits the day.
- **Streak Fixers**: Earn 1 streak fixer for every 7 completed days to repair an accidental missed day.
- **42-Day Visual Calendar**: Interactive history grid of recent workout activity.
- **Reset Capability**: Option to clear streak history whenever you want a clean slate.

### 🚀 Starter Routine Presets
Includes 6 ready-to-use stretching routines with illustrated previews:
1. **Desk Reset** (3 min) – Neck, shoulders, wrists, and chest.
2. **Morning Mobility** (5 min) – Cat-cow, low lunge, side bend, forward fold.
3. **Bedtime Wind-Down** (5 min) – Child’s pose, seated fold, reclined twists, breathing.
4. **Lower-Body Reset** (5 min) – Calves, quads, hamstrings, hip flexors.
5. **Runner’s Recovery** (5 min) – Standing calf stretch, figure-four, hip flexor release.
6. **Full-Body Mobility** (6 min) – Balanced full-body flow.

### 🔒 100% Offline, Private & Portable
- **Zero Network Dependencies**: Operates completely offline.
- **Local Storage**: Routines, settings, and streaks saved in `localStorage`.
- **Photo Attachments**: Photos downscaled and stored locally in `IndexedDB`.
- **Backup & Restore**: Export and import complete routine libraries (including photos) as standard JSON files.

---

## 🛠 Tech Stack

- **Framework**: [Svelte 5](https://svelte.dev/) with modern Runes (`$state`, `$derived`, `$effect`, `$props`)
- **App Engine**: [SvelteKit 2](https://kit.svelte.dev/)
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
