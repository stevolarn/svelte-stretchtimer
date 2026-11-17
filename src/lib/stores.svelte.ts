import type { Routine, Settings, Stretch, StreakState, StorageSnapshot } from './types.ts';
import { showToast } from './toast.svelte.ts';
import {
	deletePhotoData,
	getPhotoData,
	loadRoutines,
	loadSettings,
	loadStreak,
	recordSnapshot,
	requestPersistentStorage,
	savePhotoData,
	saveRoutines,
	saveSettings,
	saveStreak
} from './storage.ts';
import { addDays, todayKey } from './time.ts';
import { fixersAvailable, repairGap, canRepairStreak } from './streak.ts';
import { uid } from './util.ts';
import { stockStretches } from './stockStretches.ts';
import { autoSaveToFileHandle, isFileAutoBackupConnected } from './backup.ts';

export const routines = $state<Routine[]>(loadRoutines());
export const settings = $state<Settings>(loadSettings());
export const streak = $state<StreakState>(loadStreak());

// Auto-request persistent storage on startup in supported browsers
if (typeof window !== 'undefined') {
	void requestPersistentStorage().catch(() => {});
}

export function saveAll(): void {
	saveRoutines(routines);
	saveSettings(settings);
	saveStreak(streak);
	recordSnapshot(routines, streak);
	if (isFileAutoBackupConnected()) {
		void autoSaveToFileHandle().catch(() => {});
	}
}

export function newStretch(): Stretch {
	return {
		id: uid(),
		name: '',
		description: '',
		sides: 'one',
		durationSeconds: 30,
		photoId: null
	};
}

export function newRoutine(name = 'New routine', breakSeconds = 5): Routine {
	return { id: uid(), name, stretches: [], createdAt: Date.now(), breakSeconds };
}

export type StarterRoutineKind =
	| 'desk-reset'
	| 'morning-mobility'
	| 'bedtime-wind-down'
	| 'lower-body-reset'
	| 'runner-recovery'
	| 'full-body-mobility'
	| 'posture-fix'
	| 'lower-back-relief'
	| 'hip-opener'
	| 'pre-workout-warmup'
	| 'core-isometrics'
	| 'band-isometrics'
	| 'isometric-flexibility';

type StarterStretch = Partial<Stretch> & Pick<Stretch, 'name' | 'description' | 'sides'>;

/** Starter stretch copied from the stock library, optionally overriding its duration. */
function stock(id: string, durationSeconds?: number): StarterStretch {
	const s = stockStretches.find((item) => item.id === id);
	if (!s) throw new Error(`Unknown stock stretch: ${id}`);
	return {
		name: s.name,
		description: s.description,
		sides: s.sides,
		durationSeconds: durationSeconds ?? s.defaultSeconds,
		iconKey: s.iconKey
	};
}

const starterDefinitions: Record<
	StarterRoutineKind,
	{ name: string; stretches: StarterStretch[]; breakSeconds?: number; sets?: number }
> = {
	'desk-reset': {
		name: 'Desk reset',
		stretches: [
			{ name: 'Neck release', description: 'Relax your shoulders and gently look left and right.', sides: 'one', durationSeconds: 30, iconKey: 'neck-release' },
			{ name: 'Shoulder rolls', description: 'Roll slowly backwards, then reverse direction.', sides: 'one', durationSeconds: 45, iconKey: 'shoulder-rolls' },
			{ name: 'Wrist and forearm stretch', description: 'Keep your elbow straight and use the other hand for light pressure.', sides: 'two', durationSeconds: 30, iconKey: 'wrist-forearm' },
			{ name: 'Chest opener', description: 'Clasp your hands behind you or rest them on your lower back.', sides: 'one', durationSeconds: 45, iconKey: 'chest-opener' }
		]
	},
	'morning-mobility': {
		name: 'Morning mobility',
		stretches: [
			{ name: 'Cat-cow', description: 'Move slowly between a rounded and gently extended spine.', sides: 'one', durationSeconds: 60, iconKey: 'cat-cow' },
			{ name: 'Low lunge', description: 'Keep your hips facing forward and breathe into the front of the hip.', sides: 'two', durationSeconds: 45, iconKey: 'low-lunge' },
			{ name: 'Standing side bend', description: 'Reach overhead and lengthen through the side body.', sides: 'two', durationSeconds: 30, iconKey: 'standing-side-bend' },
			{ name: 'Forward fold', description: 'Soften your knees and let your head and neck relax.', sides: 'one', durationSeconds: 60, iconKey: 'forward-fold' }
		]
	},
	'bedtime-wind-down': {
		name: 'Bedtime wind-down',
		stretches: [
			{ name: 'Child’s pose', description: 'Let your breath slow down as your back and shoulders relax.', sides: 'one', durationSeconds: 60, iconKey: 'childs-pose' },
			{ name: 'Seated forward fold', description: 'Keep the stretch gentle and let your neck soften.', sides: 'one', durationSeconds: 60, iconKey: 'hamstring-fold' },
			{ name: 'Reclined twist', description: 'Keep both shoulders heavy and move slowly between sides.', sides: 'two', durationSeconds: 45, iconKey: 'seated-twist' },
			{ name: 'Quiet breathing', description: 'Use this final minute to settle into a calm, comfortable rhythm.', sides: 'one', durationSeconds: 60, iconKey: 'neck-release' }
		]
	},
	'lower-body-reset': {
		name: 'Lower-body reset',
		stretches: [
			{ name: 'Calf stretch', description: 'Press through the heel and keep the toes pointing ahead.', sides: 'two', durationSeconds: 45, iconKey: 'standing-calf' },
			{ name: 'Quad stretch', description: 'Keep your knees close and hold onto a wall if needed.', sides: 'two', durationSeconds: 45, iconKey: 'quad-stretch' },
			{ name: 'Hamstring fold', description: 'Hinge from the hips and avoid forcing the range of motion.', sides: 'two', durationSeconds: 45, iconKey: 'hamstring-fold' },
			{ name: 'Hip flexor lunge', description: 'Tuck the pelvis gently and breathe into the front of the hip.', sides: 'two', durationSeconds: 45, iconKey: 'low-lunge' }
		]
	},
	'runner-recovery': {
		name: 'Runner’s recovery',
		stretches: [
			{ name: 'Standing calf stretch', description: 'Use a wall for balance and ease the heel toward the floor.', sides: 'two', durationSeconds: 45, iconKey: 'standing-calf' },
			{ name: 'Figure-four stretch', description: 'Sit back slowly while keeping your standing knee comfortable.', sides: 'two', durationSeconds: 45, iconKey: 'pigeon-pose' },
			{ name: 'Hip flexor release', description: 'Keep your ribs stacked over your hips and breathe steadily.', sides: 'two', durationSeconds: 45, iconKey: 'low-lunge' },
			{ name: 'Forward fold', description: 'Finish with a relaxed fold and a few easy breaths.', sides: 'one', durationSeconds: 60, iconKey: 'forward-fold' }
		]
	},
	'full-body-mobility': {
		name: 'Full-body mobility',
		stretches: [
			{ name: 'Overhead reach', description: 'Reach through both hands and lengthen from your feet to your fingertips.', sides: 'one', durationSeconds: 45, iconKey: 'arm-circles' },
			{ name: 'Thoracic rotation', description: 'Rotate from your upper back while keeping your hips steady.', sides: 'two', durationSeconds: 45, iconKey: 'thoracic-rotation' },
			{ name: 'World’s greatest stretch', description: 'Move between the lunge and rotation with control.', sides: 'two', durationSeconds: 60, iconKey: 'worlds-greatest' },
			{ name: 'Full-body fold', description: 'Breathe out and release any remaining tension.', sides: 'one', durationSeconds: 60, iconKey: 'forward-fold' }
		]
	},
	'posture-fix': {
		name: 'Posture fix',
		stretches: [
			stock('iso-scapular-squeeze'),
			stock('dynamic-wall-angels'),
			stock('static-chest-opener'),
			stock('static-upper-trap'),
			stock('mob-thread-needle', 30),
			stock('static-puppy-pose')
		]
	},
	'lower-back-relief': {
		name: 'Lower-back relief',
		stretches: [
			stock('static-knees-to-chest'),
			stock('dynamic-cat-cow', 60),
			stock('static-sphinx'),
			stock('static-reclined-twist'),
			stock('static-reclined-figure-four'),
			stock('yoga-childs-pose', 60)
		]
	},
	'hip-opener': {
		name: 'Hip opener',
		stretches: [
			stock('mob-90-90-hip-switches'),
			stock('yoga-lizard'),
			stock('static-seated-butterfly'),
			stock('static-pigeon-pose'),
			stock('mob-frog-pose'),
			stock('static-couch-stretch')
		]
	},
	'pre-workout-warmup': {
		name: 'Pre-workout warm-up',
		breakSeconds: 3,
		stretches: [
			stock('cardio-jumping-jacks', 30),
			stock('dynamic-arm-circles', 30),
			stock('dynamic-leg-swings', 20),
			stock('dynamic-hip-circles', 20),
			stock('dynamic-inchworm'),
			stock('dynamic-worlds-greatest', 30)
		]
	},
	'core-isometrics': {
		name: 'Core isometrics',
		breakSeconds: 10,
		sets: 2,
		stretches: [
			stock('iso-plank', 30),
			stock('iso-side-plank', 20),
			stock('iso-bird-dog-hold', 20),
			stock('iso-glute-bridge-hold', 30),
			stock('iso-superman-hold', 20)
		]
	},
	'band-isometrics': {
		name: 'Mini-band isometrics',
		breakSeconds: 10,
		sets: 2,
		stretches: [
			stock('iso-band-pull-apart'),
			stock('iso-band-external-rotation'),
			stock('iso-band-serratus-wall-press'),
			stock('iso-band-bicep-hold'),
			stock('iso-band-tricep-lockout'),
			stock('iso-band-tension-plank')
		]
	},
	'isometric-flexibility': {
		name: 'Isometric flexibility',
		stretches: [
			stock('iso-neck-press'),
			stock('iso-hamstring-contract-relax'),
			stock('iso-hip-flexor-contract-relax'),
			stock('iso-butterfly-knee-press')
		]
	}
};

/** Build a ready-to-play routine for people who want to start immediately. */
export function starterRoutine(kind: StarterRoutineKind): Routine {
	const definition = starterDefinitions[kind];
	const routine = newRoutine(definition.name, definition.breakSeconds);
	if (definition.sets) routine.sets = definition.sets;
	const stretches = definition.stretches;

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
	removeRoutine(id)?.commit();
}

/**
 * Remove a routine but keep its photos until `commit`, so the removal can be
 * undone with `undo` (which puts it back where it was).
 */
export function removeRoutine(id: string): { routine: Routine; undo: () => void; commit: () => void } | null {
	const idx = routines.findIndex((r) => r.id === id);
	if (idx < 0) return null;
	const [removed] = routines.splice(idx, 1);
	saveAll();
	return {
		routine: removed,
		undo() {
			if (getRoutine(removed.id)) return;
			routines.splice(Math.min(idx, routines.length), 0, removed);
			saveAll();
		},
		commit() {
			if (getRoutine(removed.id)) return;
			for (const s of removed.stretches) {
				if (s.photoId) void deletePhotoData(s.photoId).catch(() => {});
			}
		}
	};
}

/** Delete a routine and offer an Undo toast; photos are removed once it expires. */
export function deleteRoutineWithUndo(id: string): void {
	const removal = removeRoutine(id);
	if (!removal) return;
	showToast(`Deleted “${removal.routine.name || 'Untitled routine'}”`, {
		action: 'Undo',
		onAction: removal.undo,
		onExpire: removal.commit
	});
}

/** Deep-copy a routine (and its photos) with fresh ids, then add it. */
export async function duplicateRoutine(id: string): Promise<Routine> {
	const src = getRoutine(id);
	if (!src) throw new Error('Routine not found');
	const copy: Routine = {
		...src,
		id: uid(),
		name: `${src.name} copy`,
		breakSeconds: src.breakSeconds,
		stretches: [],
		createdAt: Date.now()
	};
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

/* ---------------------------- snapshot restoration ----------------------- */

/** Restore data from an automatic local snapshot point. */
export function restoreFromSnapshot(snapshot: StorageSnapshot): void {
	routines.length = 0;
	routines.push(...JSON.parse(JSON.stringify(snapshot.routines)));
	streak.completedDates = [...snapshot.streak.completedDates];
	streak.fixersUsed = snapshot.streak.fixersUsed;
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
			breakSeconds: typeof candidate.breakSeconds === 'number' ? candidate.breakSeconds : undefined,
			sets: typeof candidate.sets === 'number' ? candidate.sets : undefined,
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
				photoId: null,
				iconKey: typeof item.iconKey === 'string' ? item.iconKey : undefined
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

/** Spend available fixers to completely repair a broken streak gap. */
export function applyFixer(): boolean {
	const gap = repairGap(streak);
	if (gap.length === 0) return false;
	const available = fixersAvailable(streak);
	if (available < gap.length) return false;

	for (const date of gap) {
		if (!streak.completedDates.includes(date)) {
			streak.completedDates.push(date);
		}
	}
	streak.completedDates.sort();
	streak.fixersUsed += gap.length;
	saveAll();
	return true;
}

/** Clear all streak history, resetting completed days and fixers. */
export function clearStreakHistory(): void {
	streak.completedDates = [];
	streak.fixersUsed = 0;
	saveAll();
}

/* -------------------------- Testing Mode Helpers -------------------------- */

/** Simulate N days of consecutive streak up through today. */
export function simulateStreak(days = 7): void {
	const today = todayKey();
	const list: string[] = [];
	for (let i = 0; i < days; i++) {
		list.push(addDays(today, -i));
	}
	list.sort();
	streak.completedDates = list;
	streak.fixersUsed = 0;
	saveAll();
}

/** Simulate a broken streak (gap yesterday) with a prior completed period so a fixer can repair it. */
export function simulateBrokenStreak(): void {
	const today = todayKey();
	const list: string[] = [];
	// Completed 2, 3, 4, 5, 6, 7, 8 days ago. Yesterday is missed.
	for (let i = 2; i <= 8; i++) {
		list.push(addDays(today, -i));
	}
	list.sort();
	streak.completedDates = list;
	streak.fixersUsed = 0;
	saveAll();
}

/** Grant a streak fixer for testing. */
export function addTestFixer(): void {
	if (streak.fixersUsed > 0) {
		streak.fixersUsed -= 1;
	} else {
		// Add dummy historical dates to pass the 7-day multiplier
		const earliest = streak.completedDates[0] || todayKey();
		const extra: string[] = [];
		for (let i = 1; i <= 7; i++) {
			extra.push(addDays(earliest, -100 - i));
		}
		streak.completedDates.push(...extra);
		streak.completedDates.sort();
	}
	saveAll();
}

/** Seed rapid-test routines for feature validation. */
export function seedTestRoutines(): void {
	const r1 = newRoutine('⚡ 5s Quick Test Flow');
	r1.stretches = [
		{ ...newStretch(), name: 'Test Stretch A', durationSeconds: 5, sides: 'one', description: 'Testing 5s countdown and audio cues' },
		{ ...newStretch(), name: 'Test Stretch B', durationSeconds: 5, sides: 'one', description: 'Second stretch test' }
	];

	const r2 = newRoutine('🔄 2-Sided Quick Tester');
	r2.stretches = [
		{ ...newStretch(), name: 'Left/Right Test Stretch', durationSeconds: 5, sides: 'two', description: 'Testing Left → Beep → Right transition' }
	];

	routines.push(r1, r2);
	saveAll();
}

