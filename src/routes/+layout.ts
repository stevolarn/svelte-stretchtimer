// Client-only app: everything lives in the browser (localStorage + IndexedDB),
// and the player needs browser APIs. Keeps the app fully offline-capable.
export const ssr = false;
export const prerender = false;
