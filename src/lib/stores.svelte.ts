import type { Routine, Settings, Stretch, StreakState } from './types.ts';
import {
	deletePhotoData,
	getPhotoData,
	loadRoutines,
	loadSettings,
	loadStreak,
	savePhotoData,
	saveRoutines,
	saveSettings,
	saveStreak
} from './storage.ts';
import { todayKey } from './time.ts';
import { fixersAvailable, repairTarget } from './streak.ts';
import { uid } from './util.ts';

export const routines = $state<Routine[]>(loadRoutines());
export const settings = $state<Settings>(loadSettings());
export const streak = $state<StreakState>(loadStreak());

export function saveAll(): void {
	saveRoutines(routines);
	saveSettings(settings);
	saveStreak(streak);
}

export function newStretch(): Stretch {
	return {
		id: uid(),
		name: '',
		description: '',
		sides: 'one',
		durationSeconds: 30,
		leftSeconds: 30,
		rightSeconds: 30,
		photoId: null
	};
}

export function newRoutine(name = 'New routine'): Routine {
	return { id: uid(), name, stretches: [], createdAt: Date.now() };
}

export type StarterRoutineKind = 'desk-reset' | 'morning-mobility';

/** Build a ready-to-play routine for people who want to start immediately. */
export function starterRoutine(kind: StarterRoutineKind): Routine {
	const routine = newRoutine(kind === 'desk-reset' ? 'Desk reset' : 'Morning mobility');
	const stretches: Array<Partial<Stretch> & Pick<Stretch, 'name' | 'description' | 'sides'>> =
		kind === 'desk-reset'
			? [
					{ name: 'Neck release', description: 'Relax your shoulders and gently look left and right.', sides: 'one', durationSeconds: 30 },
					{ name: 'Shoulder rolls', description: 'Roll slowly backwards, then reverse direction.', sides: 'one', durationSeconds: 45 },
					{ name: 'Wrist and forearm stretch', description: 'Keep your elbow straight and use the other hand for light pressure.', sides: 'two', durationSeconds: 30 },
					{ name: 'Chest opener', description: 'Clasp your hands behind you or rest them on your lower back.', sides: 'one', durationSeconds: 45 }
				]
			: [
					{ name: 'Cat-cow', description: 'Move slowly between a rounded and gently extended spine.', sides: 'one', durationSeconds: 60 },
					{ name: 'Low lunge', description: 'Keep your hips facing forward and breathe into the front of the hip.', sides: 'two', durationSeconds: 45 },
					{ name: 'Standing side bend', description: 'Reach overhead and lengthen through the side body.', sides: 'two', durationSeconds: 30 },
					{ name: 'Forward fold', description: 'Soften your knees and let your head and neck relax.', sides: 'one', durationSeconds: 60 }
			];

	routine.stretches = stretches.map((stretch) => ({
		...newStretch(),
		...stretch,
		photoId: null
	}));
	return routine;
}

export function getRoutine(id: string): Routine | undefined {
	return routines.find((r) => r.id === id);
}

export function addRoutine(routine: Routine): void {
	routines.push(routine);
	saveAll();
}

export function updateRoutine(id: string, patch: Partial<Routine>): void {
	const r = getRoutine(id);
	if (r) {
		Object.assign(r, patch);
		saveAll();
	}
}

export function deleteRoutine(id: string): void {
	const idx = routines.findIndex((r) => r.id === id);
	if (idx < 0) return;
	const [removed] = routines.splice(idx, 1);
	saveAll();
	// Clean up photos owned by this routine.
	for (const s of removed.stretches) {
		if (s.photoId) void deletePhotoData(s.photoId).catch(() => {});
	}
}

/** Deep-copy a routine (and its photos) with fresh ids, then add it. */
export async function duplicateRoutine(id: string): Promise<Routine> {
	const src = getRoutine(id);
	if (!src) throw new Error('Routine not found');
	const copy: Routine = { ...src, id: uid(), name: `${src.name} copy`, stretches: [], createdAt: Date.now() };
	for (const s of src.stretches) {
		const cs: Stretch = { ...s, id: uid(), photoId: null };
		if (s.photoId) {
			const data = await getPhotoData(s.photoId).catch(() => null);
			if (data) {
				cs.photoId = uid();
				await savePhotoData(cs.photoId, data).catch(() => {});
			}
		}
		copy.stretches.push(cs);
	}
	routines.push(copy);
	saveAll();
	return copy;
}

export function updateSettings(patch: Partial<Settings>): void {
	Object.assign(settings, patch);
	saveAll();
}

/* ---------------------------- backup actions ---------------------------- */

export interface RoutineBackup {
	version: 1;
	exportedAt: string;
	routines: Routine[];
	photos: Record<string, string>;
}

/** Serialize routines and their local photos into a portable JSON backup. */
export async function exportBackup(): Promise<string> {
	const photos: Record<string, string> = {};
	for (const routine of routines) {
		for (const stretch of routine.stretches) {
			if (!stretch.photoId) continue;
			const data = await getPhotoData(stretch.photoId).catch(() => null);
			if (data) photos[stretch.photoId] = data;
		}
	}
	const backup: RoutineBackup = {
		version: 1,
		exportedAt: new Date().toISOString(),
		routines: JSON.parse(JSON.stringify(routines)) as Routine[],
		photos
	};
	return JSON.stringify(backup, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

/** Add routines from a backup, generating fresh ids so restore is always additive. */
export async function importBackup(raw: string): Promise<{ added: number; skipped: number }> {
	const parsed: unknown = JSON.parse(raw);
	const source = Array.isArray(parsed) ? { routines: parsed, photos: {} } : parsed;
	if (!isRecord(source) || !Array.isArray(source.routines)) throw new Error('This file is not a valid Stretch Timer backup.');

	const photos = isRecord(source.photos) ? source.photos : {};
	let added = 0;
	let skipped = 0;
	for (const candidate of source.routines) {
		if (!isRecord(candidate) || typeof candidate.name !== 'string' || !Array.isArray(candidate.stretches)) {
			skipped += 1;
			continue;
		}
		const routine: Routine = {
			id: uid(),
			name: candidate.name.trim() || 'Imported routine',
			createdAt: typeof candidate.createdAt === 'number' ? candidate.createdAt : Date.now(),
			stretches: []
		};

		for (const item of candidate.stretches) {
			if (!isRecord(item) || typeof item.name !== 'string') continue;
			const originalPhotoId = typeof item.photoId === 'string' ? item.photoId : null;
			const stretch: Stretch = {
				id: uid(),
				name: item.name,
				description: typeof item.description === 'string' ? item.description : '',
				sides: item.sides === 'two' ? 'two' : 'one',
				durationSeconds: typeof item.durationSeconds === 'number' ? item.durationSeconds : 30,
				leftSeconds: typeof item.leftSeconds === 'number' ? item.leftSeconds : 30,
				rightSeconds: typeof item.rightSeconds === 'number' ? item.rightSeconds : 30,
				photoId: null
			};
			if (originalPhotoId && typeof photos[originalPhotoId] === 'string') {
				stretch.photoId = uid();
				await savePhotoData(stretch.photoId, photos[originalPhotoId] as string).catch(() => {
					stretch.photoId = null;
				});
			}
			routine.stretches.push(stretch);
		}
		if (routine.stretches.length === 0) {
			skipped += 1;
			continue;
		}
		routines.push(routine);
		added += 1;
	}
	saveRoutines(routines);
	return { added, skipped };
}

/* ----------------------------- Streak actions ----------------------------- */

/** Credit today as a completed day (idempotent per day). */
export function creditToday(now: Date = new Date()): void {
	const key = todayKey(now);
	if (!streak.completedDates.includes(key)) {
		streak.completedDates.push(key);
		streak.completedDates.sort();
		saveAll();
	}
}

/** Spend one available fixer to repair the most recent broken day. */
export function applyFixer(): boolean {
	if (fixersAvailable(streak) <= 0) return false;
	const target = repairTarget(streak);
	if (!target) return false;
	streak.completedDates.push(target);
	streak.completedDates.sort();
	streak.fixersUsed += 1;
	saveAll();
	return true;
}
