import type { Routine, Settings, StreakState, StorageSnapshot } from './types.ts';

const ROUTINES_KEY = 'stretchTimer.routines';
const SETTINGS_KEY = 'stretchTimer.settings';
const STREAK_KEY = 'stretchTimer.streak';
const SNAPSHOTS_KEY = 'stretchTimer.snapshots';
const PHOTO_DB = 'stretch-timer';
const PHOTO_STORE = 'photos';

export const defaultSettings: Settings = {
	theme: 'system',
	beepStart: true,
	beepSideSwitch: true,
	beepCountdown: true,
	beepFinish: true,
	breaksEnabled: true,
	breakSeconds: 5,
	testingMode: false,
	playbackSpeed: 1,
	autoBackupOnFinish: false,
	reminderEnabled: false,
	reminderHour: 18,
	weekPlan: [null, null, null, null, null, null, null]
};

export const defaultStreak: StreakState = { completedDates: [], fixersUsed: 0 };

function loadJSON<T>(key: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
}

function saveJSON(key: string, value: unknown): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// storage full or unavailable — keep app running
	}
}

export function loadRoutines(): Routine[] {
	return loadJSON<Routine[]>(ROUTINES_KEY, []);
}
export function saveRoutines(routines: Routine[]): void {
	saveJSON(ROUTINES_KEY, routines);
}

export function loadSettings(): Settings {
	return { ...defaultSettings, ...loadJSON<Partial<Settings>>(SETTINGS_KEY, {}) };
}
export function saveSettings(settings: Settings): void {
	saveJSON(SETTINGS_KEY, settings);
}

export function loadStreak(): StreakState {
	const stored = loadJSON<Partial<StreakState>>(STREAK_KEY, {});
	return { ...defaultStreak, ...stored, completedDates: stored.completedDates ?? [] };
}
export function saveStreak(streak: StreakState): void {
	saveJSON(STREAK_KEY, streak);
}

/* ------------------------------------------------------------------ */
/* Persistent Storage API                                             */
/* ------------------------------------------------------------------ */

export async function requestPersistentStorage(): Promise<boolean> {
	if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
		try {
			return await navigator.storage.persist();
		} catch {
			return false;
		}
	}
	return false;
}

export async function checkStoragePersistence(): Promise<boolean> {
	if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
		try {
			return await navigator.storage.persisted();
		} catch {
			return false;
		}
	}
	return false;
}

/* ------------------------------------------------------------------ */
/* Local Rolling Auto-Snapshots (Protection against accidental loss)  */
/* ------------------------------------------------------------------ */

const MAX_SNAPSHOTS = 5;

export function loadSnapshots(): StorageSnapshot[] {
	return loadJSON<StorageSnapshot[]>(SNAPSHOTS_KEY, []);
}

export function saveSnapshots(snapshots: StorageSnapshot[]): void {
	saveJSON(SNAPSHOTS_KEY, snapshots.slice(0, MAX_SNAPSHOTS));
}

export function recordSnapshot(routines: Routine[], streak: StreakState): void {
	const snapshots = loadSnapshots();
	const newSnapshot: StorageSnapshot = {
		id: `snap-${Date.now()}`,
		timestamp: Date.now(),
		routineCount: routines.length,
		streakDays: streak.completedDates.length,
		routines: JSON.parse(JSON.stringify(routines)),
		streak: JSON.parse(JSON.stringify(streak))
	};
	// Avoid duplicate identical snapshots in succession
	if (snapshots.length > 0) {
		const latest = snapshots[0];
		if (
			latest.routineCount === newSnapshot.routineCount &&
			latest.streakDays === newSnapshot.streakDays &&
			JSON.stringify(latest.routines) === JSON.stringify(newSnapshot.routines) &&
			JSON.stringify(latest.streak) === JSON.stringify(newSnapshot.streak)
		) {
			return;
		}
	}
	snapshots.unshift(newSnapshot);
	saveSnapshots(snapshots);
}

export function clearSnapshots(): void {
	try {
		localStorage.removeItem(SNAPSHOTS_KEY);
	} catch {}
}

/* ------------------------------------------------------------------ */
/* Photo storage (IndexedDB — the web equivalent of app-private files) */
/* ------------------------------------------------------------------ */

let dbPromise: Promise<IDBDatabase> | null = null;

function getPhotoDB(): Promise<IDBDatabase> {
	if (dbPromise) return dbPromise;
	dbPromise = new Promise((resolve, reject) => {
		const req = indexedDB.open(PHOTO_DB, 1);
		req.onupgradeneeded = () => {
			if (!req.result.objectStoreNames.contains(PHOTO_STORE)) {
				req.result.createObjectStore(PHOTO_STORE);
			}
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
	return dbPromise;
}

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export async function savePhotoData(id: string, dataUrl: string): Promise<void> {
	const db = await getPhotoDB();
	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction(PHOTO_STORE, 'readwrite');
		tx.objectStore(PHOTO_STORE).put(dataUrl, id);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

export async function getPhotoData(id: string): Promise<string | null> {
	const db = await getPhotoDB();
	const req = idbRequest(db.transaction(PHOTO_STORE, 'readonly').objectStore(PHOTO_STORE).get(id));
	return (await req) as string | null;
}

export async function deletePhotoData(id: string): Promise<void> {
	const db = await getPhotoDB();
	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction(PHOTO_STORE, 'readwrite');
		tx.objectStore(PHOTO_STORE).delete(id);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

/**
 * Read an image file (Photo Picker equivalent) and return a downscaled
 * JPEG data URL so app-private storage stays small.
 */
export function downscaleImage(file: File, maxDim = 1024): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error('Could not read file'));
		reader.onload = () => {
			const img = new Image();
			img.onerror = () => reject(new Error('Not a valid image'));
			img.onload = () => {
				const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
				const w = Math.max(1, Math.round(img.width * scale));
				const h = Math.max(1, Math.round(img.height * scale));
				const canvas = document.createElement('canvas');
				canvas.width = w;
				canvas.height = h;
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('Canvas unavailable'));
					return;
				}
				ctx.drawImage(img, 0, 0, w, h);
				resolve(canvas.toDataURL('image/jpeg', 0.85));
			};
			img.src = String(reader.result);
		};
		reader.readAsDataURL(file);
	});
}
