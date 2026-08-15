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
