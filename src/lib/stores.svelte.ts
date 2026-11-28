import type { FunctionCheck, MorningCheck, PainArea, PainEntry, Routine, SessionEntry, RoutineChange, Settings, StockStretch, Stretch, StreakState, StorageSnapshot } from './types.ts';
import { showToast } from './toast.svelte.ts';
import {
	deletePhotoData,
	getPhotoData,
	loadFunctionChecks,
	loadMorningChecks,
	loadPain,
	loadSessions,
	saveSessions,
	loadRoutines,
	loadSettings,
	loadStreak,
	recordSnapshot,
	requestPersistentStorage,
	saveFunctionChecks,
	saveMorningChecks,
	savePain,
	savePhotoData,
	saveRoutines,
	saveSettings,
	saveStreak
} from './storage.ts';
import { addDays, todayKey } from './time.ts';
import { fixersAvailable, repairGap, canRepairStreak } from './streak.ts';
import { uid } from './util.ts';
import { spreadTimes } from './frequency.ts';
import { easeRoutine, progressRoutine, type DoseChange } from './recovery.ts';
import { stockStretches } from './stockStretches.ts';
import { clampMoveSets, clampReps, clampRepSeconds } from './timeline.ts';
import { isMuscle } from './muscles.ts';
import { autoSaveToFileHandle, isFileAutoBackupConnected } from './backup.ts';
import { syncReminderState } from './reminders.ts';
import { cleanSpots, cleanTags, entryAreas, isPainArea, PAIN_CAUSES, PAIN_HELPED } from './painSpots.ts';

export const routines = $state<Routine[]>(loadRoutines());
export const settings = $state<Settings>(loadSettings());
export const streak = $state<StreakState>(loadStreak());
export const painLog = $state<PainEntry[]>(loadPain());
export const sessions = $state<SessionEntry[]>(loadSessions());
export const morningChecks = $state<MorningCheck[]>(loadMorningChecks());
export const functionChecks = $state<FunctionCheck[]>(loadFunctionChecks());

/**
 * Older data kept 'N× a day' goals and a one-routine-per-weekday plan; both
 * are now routine schedules. Returns whether anything changed.
 */
function migrateSchedules(): boolean {
	let changed = false;
	for (const r of routines) {
		if (r.frequency?.per === 'day') {
			r.schedule = { days: [0, 1, 2, 3, 4, 5, 6], times: spreadTimes(r.frequency.times), since: todayKey() };
			r.frequency = undefined;
			changed = true;
		}
	}
	settings.weekPlan?.forEach((id, day) => {
		const r = routines.find((item) => item.id === id);
		if (!r) return;
		r.schedule ??= { days: [], times: [], since: todayKey() };
		r.frequency = undefined;
		if (!r.schedule.days.includes(day)) r.schedule.days.push(day);
		changed = true;
	});
	if (settings.weekPlan) {
		settings.weekPlan = undefined;
		changed = true;
	}
	return changed;
}

// Auto-request persistent storage on startup in supported browsers
if (typeof window !== 'undefined') {
	void requestPersistentStorage().catch(() => {});
	void syncReminderState(settings, streak);
}

/** Blank routines just created; they're only saved once they get a stretch, and dropped if left empty. */
const drafts = new Set<string>();

function persistedRoutines(): Routine[] {
	for (const r of routines) if (drafts.has(r.id) && r.stretches.length > 0) drafts.delete(r.id);
	return routines.filter((r) => !drafts.has(r.id));
}

/** Add a blank routine that isn't saved until it has a stretch. */
export function addDraftRoutine(routine: Routine): void {
	drafts.add(routine.id);
	routines.push(routine);
}

export function saveAll(): void {
	const kept = persistedRoutines();
	saveRoutines(kept);
	saveSettings(settings);
	saveStreak(streak);
	saveSessions(sessions);
	recordSnapshot(kept, streak);
	void syncReminderState(settings, streak);
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

/** A routine stretch built from a library entry; rep-based moves keep their reps and tempo. */
export function stretchFromStock(s: StockStretch): Stretch {
	const stretch: Stretch = {
		...newStretch(),
		name: s.name,
		description: s.description,
		sides: s.sides,
		durationSeconds: s.defaultSeconds,
		iconKey: s.iconKey
	};
	if (s.defaultReps !== undefined) {
		stretch.mode = 'reps';
		stretch.reps = clampReps(s.defaultReps);
		stretch.repSeconds = clampRepSeconds(s.repSeconds);
		stretch.durationSeconds = stretch.reps * stretch.repSeconds;
	}
	return stretch;
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
	| 'isometric-flexibility'
	| 'wrist-relief'
	| 'typing-break'
	| 'nerve-glides'
	| 'thoracic-outlet'
	| 'neck-shoulder-release'
	| 'finger-band'
	| 'wrist-dumbbells'
	| 'wrist-dumbbell-holds'
	| 'elbow-relief'
	| 'shoulder-rehab'
	| 'rsi-upper-body'
	| 'neck-shoulder-strength'
	| 'tennis-elbow-loading'
	| 'golfers-elbow-loading'
	| 'wrist-forearm-strength'
	| 'physio-wrist-shoulder'
	| 'loop-band-full-body'
	| 'neck-shoulder-wrist-stretch';

type StarterStretch = Partial<Stretch> & Pick<Stretch, 'name' | 'description' | 'sides'>;

/**
 * Starter stretch copied from the stock library, optionally overriding its duration.
 * Rep-based stock moves come across as reps at their tempo; `reps` overrides the count
 * (and `durationSeconds` is ignored for them, since the duration follows from the reps).
 */
function stock(id: string, durationSeconds?: number, reps?: number): StarterStretch {
	const s = stockStretches.find((item) => item.id === id);
	if (!s) throw new Error(`Unknown stock stretch: ${id}`);
	const base = { name: s.name, description: s.description, sides: s.sides, iconKey: s.iconKey };
	if (s.defaultReps !== undefined) {
		const count = clampReps(reps ?? s.defaultReps);
		const tempo = clampRepSeconds(s.repSeconds);
		return { ...base, mode: 'reps', reps: count, repSeconds: tempo, durationSeconds: count * tempo };
	}
	return { ...base, durationSeconds: durationSeconds ?? s.defaultSeconds };
}

/**
 * A stock move at a prescribed dose: `sets` of either a hold (`seconds`) or `reps` at `repSeconds` each
 * (a hold-style stock move becomes reps when `reps` is given).
 */
function dose(
	id: string,
	opts: { sets?: number; seconds?: number; reps?: number; repSeconds?: number; load?: string }
): StarterStretch {
	const base = stock(id, opts.seconds, opts.reps);
	if (opts.reps !== undefined) {
		base.mode = 'reps';
		base.reps = clampReps(opts.reps);
		base.repSeconds = clampRepSeconds(opts.repSeconds ?? base.repSeconds);
		base.durationSeconds = base.reps * base.repSeconds;
	}
	if (opts.load) base.load = opts.load;
	if (opts.sets && opts.sets > 1) base.sets = clampMoveSets(opts.sets);
	return base;
}

const starterDefinitions: Record<
	StarterRoutineKind,
	{ name: string; stretches: StarterStretch[]; breakSeconds?: number; sets?: number; weeklyGoal?: number }
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
	},
	'wrist-relief': {
		name: 'Wrist & forearm relief',
		stretches: [
			stock('dynamic-forearm-rotations'),
			stock('static-wrist-flexor'),
			stock('static-wrist-extensor'),
			stock('static-prayer-stretch'),
			stock('static-reverse-prayer'),
			stock('mob-tendon-glides'),
			stock('mob-wrist-circles', 30)
		]
	},
	'typing-break': {
		name: 'Typing break',
		breakSeconds: 3,
		stretches: [
			stock('dynamic-shoulder-shrugs', 20),
			stock('mob-chin-tucks', 20),
			stock('static-wrist-flexor', 20),
			stock('static-wrist-extensor', 20),
			stock('mob-tendon-glides', 30),
			stock('static-chest-opener', 30)
		]
	},
	'nerve-glides': {
		name: 'Nerve glides',
		sets: 2,
		stretches: [
			stock('mob-chin-tucks'),
			stock('mob-median-nerve-glide'),
			stock('mob-ulnar-nerve-glide'),
			stock('mob-radial-nerve-glide')
		]
	},
	'thoracic-outlet': {
		name: 'Thoracic outlet relief',
		stretches: [
			stock('static-diaphragmatic-breathing'),
			stock('mob-chin-tucks'),
			stock('static-scalene-stretch'),
			stock('static-doorway-pec-stretch'),
			stock('iso-scapular-squeeze'),
			stock('mob-thoracic-extension'),
			stock('dynamic-shoulder-shrugs')
		]
	},
	'neck-shoulder-release': {
		name: 'Neck & shoulder release',
		stretches: [
			stock('dynamic-shoulder-rolls', 30),
			stock('static-upper-trap'),
			stock('static-levator-scapulae'),
			stock('static-scalene-stretch'),
			stock('static-cross-body-shoulder'),
			stock('mob-thread-needle', 30)
		]
	},
	'finger-band': {
		name: 'Finger band workout',
		breakSeconds: 10,
		stretches: [
			stock('mob-tendon-glides', 30),
			stock('dynamic-finger-band-extensions'),
			stock('dynamic-finger-band-spreads'),
			stock('dynamic-thumb-band-abduction'),
			stock('iso-finger-band-open-hold'),
			stock('iso-thumb-band-hold'),
			stock('ecc-finger-band-slow-close'),
			stock('ecc-thumb-band-slow-return'),
			stock('static-prayer-stretch'),
			stock('static-wrist-flexor')
		]
	},
	'wrist-dumbbells': {
		name: 'Wrist dumbbells',
		breakSeconds: 0,
		sets: 3,
		stretches: [
			// 8 reps a side keeps three rounds near the old 18 minutes
			stock('dynamic-db-wrist-extension', undefined, 8),
			stock('dynamic-db-wrist-flexion', undefined, 8),
			stock('dynamic-db-pronation', undefined, 8),
			stock('dynamic-db-supination', undefined, 8),
			stock('dynamic-db-ulnar-deviation', undefined, 8),
			stock('dynamic-db-radial-deviation', undefined, 8)
		]
	},
	'elbow-relief': {
		name: 'Elbow relief',
		breakSeconds: 10,
		stretches: [
			stock('mob-elbow-bend-turn'),
			stock('static-wall-biceps'),
			stock('static-wrist-flexor'),
			stock('static-wrist-extensor'),
			stock('iso-hand-wrist-extension'),
			stock('iso-hand-wrist-flexion'),
			stock('ecc-tennis-elbow'),
			stock('ecc-golfers-elbow')
		]
	},
	'shoulder-rehab': {
		name: 'Shoulder & upper back',
		breakSeconds: 10,
		stretches: [
			stock('mob-pendulum-swings'),
			stock('static-towel-shoulder'),
			stock('iso-doorframe-external-rotation'),
			stock('dynamic-forearm-wall-slides'),
			stock('dynamic-prone-ytw'),
			stock('iso-prone-cobra'),
			stock('static-towel-roll-chest')
		]
	},
	'rsi-upper-body': {
		name: 'RSI upper-body circuit',
		breakSeconds: 5,
		stretches: [
			stock('mob-chin-tucks'),
			stock('static-neck-rotation'),
			stock('static-wall-pec'),
			stock('static-reach-round'),
			stock('iso-doorframe-external-rotation'),
			stock('mob-elbow-bend-turn'),
			stock('static-wrist-flexor'),
			stock('static-wrist-extensor'),
			stock('mob-tendon-glides'),
			stock('mob-median-nerve-glide')
		]
	},
	'neck-shoulder-strength': {
		name: 'Neck & shoulder strength',
		breakSeconds: 5,
		weeklyGoal: 5,
		stretches: [
			// 8 reps each keeps the whole circuit to about 3 minutes
			stock('dynamic-band-shrugs', undefined, 8),
			stock('dynamic-band-lateral-raise', undefined, 8),
			stock('dynamic-band-row', undefined, 8),
			stock('dynamic-band-reverse-fly', undefined, 8),
			stock('dynamic-band-wrist-extension', undefined, 8)
		]
	},
	'tennis-elbow-loading': {
		name: 'Tennis elbow loading',
		breakSeconds: 10,
		sets: 3,
		// Tyler twist 3 x 15 (see docs/research.md); the dumbbell slow lowers are in Elbow relief
		stretches: [stock('iso-hand-wrist-extension'), stock('ecc-tyler-twist')]
	},
	'golfers-elbow-loading': {
		name: 'Golfer’s elbow loading',
		breakSeconds: 10,
		sets: 3,
		stretches: [stock('iso-hand-wrist-flexion'), stock('ecc-reverse-tyler-twist')]
	},
	'wrist-forearm-strength': {
		name: 'Wrist & forearm strength',
		breakSeconds: 10,
		stretches: [
			stock('dynamic-db-wrist-extension'),
			stock('dynamic-db-wrist-flexion'),
			stock('dynamic-db-pronation'),
			stock('dynamic-db-supination')
		]
	},
	// A typical physio home programme for wrist, forearm and shoulder blade, at the doses on the sheet.
	'physio-wrist-shoulder': {
		name: 'Physio programme: wrist & shoulder',
		breakSeconds: 10,
		stretches: [
			dose('static-wrist-flexor', { seconds: 30, sets: 3 }),
			dose('static-wrist-extensor', { seconds: 30, sets: 3 }),
			dose('dynamic-finger-band-extensions', { reps: 25, sets: 3 }),
			dose('dynamic-db-wrist-flexion', { reps: 15, sets: 3, load: '7 lbs' }),
			dose('dynamic-db-wrist-extension', { reps: 15, sets: 3, load: '7 lbs' }),
			dose('dynamic-ball-squeeze', { reps: 25, sets: 3 }),
			dose('dynamic-prone-scapular-retraction', { reps: 12, sets: 3 }),
			dose('static-chest-opener', { seconds: 20, sets: 3 }),
			dose('static-doorway-pec-stretch', { seconds: 20, sets: 3 }),
			dose('dynamic-plank-scapular-protraction', { reps: 10, sets: 3 }),
			dose('dynamic-quadruped-scapular-protraction', { reps: 10, sets: 3 }),
			dose('dynamic-sidelying-external-rotation', { reps: 12, sets: 3, load: '5 lbs' }),
			dose('mob-chin-tucks', { reps: 10, repSeconds: 5, sets: 3 }),
			dose('dynamic-shoulder-rolls', { reps: 12, repSeconds: 3, sets: 3, load: '20 lbs' }),
			dose('static-upper-trap', { seconds: 20, sets: 3 }),
			dose('dynamic-thoracic-openers', { reps: 12, repSeconds: 4, sets: 2 })
		]
	},
	// Beginner full-body loop band session: 10 reps each (per side where one-sided), then 45 s of scissor kicks.
	'loop-band-full-body': {
		name: 'Loop band full body',
		breakSeconds: 10,
		stretches: [
			stock('loop-band-external-rotation'),
			stock('loop-band-tricep-pushdown'),
			stock('loop-band-bicep-curl'),
			stock('loop-band-chest-pull-apart'),
			stock('loop-band-overhead-pull-down'),
			stock('loop-band-behind-back-pull-apart'),
			stock('loop-band-lateral-leg-raise'),
			stock('loop-band-glute-kickback'),
			stock('loop-band-front-leg-raise'),
			stock('loop-band-wide-squat'),
			stock('loop-band-narrow-squat'),
			stock('loop-band-glute-bridge'),
			stock('loop-band-supine-abduction'),
			stock('loop-band-straight-leg-abduction'),
			stock('loop-band-scissor-kicks')
		]
	},
	'neck-shoulder-wrist-stretch': {
		name: 'Neck, shoulders & wrists',
		breakSeconds: 5,
		stretches: [
			stock('static-chair-overhead-triceps', 15),
			stock('static-chair-shoulder-cross', 15),
			stock('mob-chin-tucks', 15),
			stock('static-scalene-stretch', 15),
			stock('static-neck-rotation', 15),
			stock('static-neck-tilt', 15),
			stock('static-levator-scapulae', 15),
			stock('static-neck-release', 15),
			stock('dynamic-neck-half-circles', 15),
			stock('static-standing-side-bend', 15),
			stock('static-reverse-shoulder', 15),
			stock('static-upward-salute', 15),
			stock('mob-wrist-circles', 15),
			stock('static-wrist-flexor', 15),
			stock('static-wrist-extensor', 15),
			stock('static-chair-wrist-extension', 15),
			stock('dynamic-chair-shoulder-rolls', 15),
			stock('static-chair-overhead-reach', 15),
			stock('static-standing-diver', 15),
			stock('static-bear-hug', 15),
			stock('static-chest-opener', 15),
			stock('static-cactus-arms', 15),
			stock('static-doorway-pec-stretch', 15),
			stock('static-wall-pec', 15)
		]
	},
	'wrist-dumbbell-holds': {
		name: 'Wrist dumbbell holds',
		breakSeconds: 10,
		sets: 2,
		stretches: [
			stock('iso-db-wrist-extension-hold'),
			stock('iso-db-wrist-flexion-hold'),
			stock('iso-db-pronation-hold'),
			stock('iso-db-supination-hold'),
			stock('iso-db-ulnar-deviation-hold'),
			stock('iso-db-radial-deviation-hold')
		]
	}
};

/** Build a ready-to-play routine for people who want to start immediately. */
export function starterRoutine(kind: StarterRoutineKind): Routine {
	const definition = starterDefinitions[kind];
	const routine = newRoutine(definition.name, definition.breakSeconds);
	if (definition.sets) routine.sets = definition.sets;
	if (definition.weeklyGoal) routine.frequency = { per: 'week', times: definition.weeklyGoal, since: todayKey() };
	const stretches = definition.stretches;

	routine.stretches = stretches.map((stretch) => ({
		...newStretch(),
		...stretch,
		photoId: null
	}));
	return routine;
}

export function getRoutine(id: string): Routine | undefined {
	if (id === MICRO_BREAK_ID) return microBreak.routine ?? undefined;
	return routines.find((r) => r.id === id);
}

/* --------------------------- micro-break --------------------------- */

export const MICRO_BREAK_ID = 'micro-break';

/** Desk-friendly RSI moves in the typing break's order: shoulders, neck, wrist flexors, wrist extensors, hands, chest. */
const microPools = [
	['dynamic-shoulder-shrugs', 'dynamic-shoulder-rolls'],
	['mob-chin-tucks', 'static-neck-rotation', 'static-upper-trap'],
	['static-wrist-flexor', 'static-prayer-stretch'],
	['static-wrist-extensor', 'static-reverse-prayer', 'dynamic-forearm-rotations'],
	['mob-tendon-glides', 'mob-median-nerve-glide', 'static-thumb-tuck', 'mob-wrist-circles'],
	['static-chest-opener', 'static-reach-round', 'static-cactus-arms']
];

/** The current micro-break; never saved with the routines. */
export const microBreak = $state<{ routine: Routine | null }>({ routine: null });

function pick<T>(items: T[], count: number): T[] {
	const pool = [...items];
	for (let i = pool.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[pool[i], pool[j]] = [pool[j], pool[i]];
	}
	return pool.slice(0, count);
}

/** Shuffle up a fresh ~2-minute break: one move from each pool, 20 seconds each, split across sides where needed. */
export function shuffleMicroBreak(): Routine {
	const routine = newRoutine('2-minute micro-break', 3);
	routine.id = MICRO_BREAK_ID;
	routine.stretches = microStretches();
	microBreak.routine = routine;
	return routine;
}

function microStretches(): Stretch[] {
	const ids = microPools.map((pool) => pick(pool, 1)[0]);
	return ids.map((id) => {
		const s = stock(id);
		return { ...newStretch(), ...s, durationSeconds: s.sides === 'two' ? 10 : 20, photoId: null };
	});
}

/** Turn a routine into its bad-day version: no loading, resistance or reps, one set. */
export function gentleVersion(r: Routine): Routine {
	const hard = new Set(['eccentrics', 'isometrics', 'calisthenics', 'cardio']);
	const kept = r.stretches.filter((s) => {
		const known = stockStretches.find((item) => item.name === s.name);
		if (known && hard.has(known.type)) return false;
		if (s.mode === 'reps') return false;
		return !/dumbbell|\bband\b|weight|push-?up|plank|flexbar|tyler/i.test(s.name);
	});
	const stretches = kept.length > 0 ? kept : microStretches();
	return { ...r, name: `${r.name || 'Routine'} · gentle`, stretches, sets: 1 };
}

export { PAIN_AREAS } from './painSpots.ts';

/**
 * Add or replace a pain-journal entry. `originalAt` is the entry being edited (null for a new one).
 * Spots are tidied, `score` becomes their max and `areas` their coarse areas; entries with no spots
 * keep the given score and areas. Custom causes / helped values are remembered as chips.
 * Returns the saved entry's `at`.
 */
export function savePainEntry(originalAt: number | null, next: PainEntry): number {
	const spots = cleanSpots(next.spots);
	const causes = cleanTags(next.causes);
	const helped = cleanTags(next.helped);
	const note = typeof next.note === 'string' ? next.note.trim().slice(0, 2000) : '';
	const keep = painLog.filter((p) => p.at !== originalAt);
	let at = Math.round(next.at);
	while (keep.some((p) => p.at === at)) at += 1;
	const entry: PainEntry = {
		date: todayKey(new Date(at)),
		score: spots.length ? Math.max(...spots.map((p) => p.score)) : Math.min(10, Math.max(0, Math.round(next.score))),
		routineId: next.routineId ?? null,
		at,
		...(next.gentle && { gentle: true })
	};
	const areas = spots.length ? entryAreas({ spots }) : [...new Set((next.areas ?? []).filter(isPainArea))];
	if (areas.length) entry.areas = areas;
	if (spots.length) entry.spots = spots;
	if (causes.length) entry.causes = causes;
	if (helped.length) entry.helped = helped;
	if (note) entry.note = note;
	keep.push(entry);
	keep.sort((a, b) => a.at - b.at);
	painLog.splice(0, painLog.length, ...keep);
	savePain(painLog);
	rememberCustom('customCauses', causes, PAIN_CAUSES);
	rememberCustom('customHelped', helped, PAIN_HELPED);
	return at;
}

function rememberCustom(key: 'customCauses' | 'customHelped', values: string[], presets: { id: string }[]): void {
	const known = new Set([...presets.map((p) => p.id), ...(settings[key] ?? []).map((v) => v.toLowerCase())]);
	const fresh = values.filter((v) => !known.has(v) && !known.has(v.toLowerCase()));
	if (!fresh.length) return;
	settings[key] = [...(settings[key] ?? []), ...fresh].slice(-30);
	saveSettings(settings);
}

/** Forget a custom cause / "what helped" chip (entries that used it keep the text). */
export function forgetCustomTag(key: 'customCauses' | 'customHelped', value: string): void {
	settings[key] = (settings[key] ?? []).filter((v) => v !== value);
	saveSettings(settings);
}

/** Delete one pain entry by its timestamp. */
export function deletePainEntry(at: number): void {
	const i = painLog.findIndex((p) => p.at === at);
	if (i === -1) return;
	painLog.splice(i, 1);
	savePain(painLog);
}

/** Record how the pain is right now (0-10), and optionally where. */
export function logPain(score: number, routineId: string | null, gentle = false, areas: PainArea[] = []): void {
	const where = [...new Set(areas.filter(isPainArea))];
	painLog.push({ date: todayKey(), score, routineId, at: Date.now(), ...(gentle && { gentle }), ...(where.length && { areas: where }) });
	savePain(painLog);
}

/** Set where the latest pain entry hurts (the area chips come after the score tap). */
export function setLastPainAreas(areas: PainArea[]): void {
	const last = painLog.at(-1);
	if (!last) return;
	const where = [...new Set(areas.filter(isPainArea))];
	if (where.length) last.areas = where;
	else delete last.areas;
	savePain(painLog);
}

/**
 * Save a "how are everyday tasks?" check-in (PSFS): up to three activities rated 0-10.
 * A second check-in on the same day replaces the first.
 */
export function logFunctionCheck(items: FunctionCheck['items'], flag = false): void {
	const clean = items
		.map((i) => ({ activity: i.activity.trim().slice(0, 80), score: Math.min(10, Math.max(0, Math.round(i.score))) }))
		.filter((i) => i.activity)
		.slice(0, 3);
	if (clean.length === 0) return;
	const today = todayKey();
	const kept = functionChecks.filter((c) => c.date !== today);
	functionChecks.splice(0, functionChecks.length, ...kept, { date: today, at: Date.now(), items: clean, ...(flag && { flag }) });
	saveFunctionChecks(functionChecks);
}

/** Remove the latest pain entry (undo for an accidental tap). */
export function undoLastPain(): void {
	painLog.pop();
	savePain(painLog);
}

/** Answer today's next-morning check, replacing an earlier answer today; keeps about two months. */
export function logMorningCheck(verdict: MorningCheck['verdict']): void {
	const today = todayKey();
	const cutoff = addDays(today, -60);
	const kept = morningChecks.filter((c) => c.date !== today && c.date >= cutoff);
	morningChecks.splice(0, morningChecks.length, ...kept, { date: today, verdict, at: Date.now() });
	saveMorningChecks(morningChecks);
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

/** Record a dose change on a routine, keeping the last ten. */
function logChange(r: Routine, kind: RoutineChange['kind'], note: string): void {
	r.history = [...(r.history ?? []), { date: todayKey(), kind, note: note.slice(0, 200) }].slice(-10);
}

/** Apply the next small step up (longer holds, more reps) and note it in the routine's history. */
export function stepUpRoutine(id: string): DoseChange | null {
	const r = getRoutine(id);
	if (!r) return null;
	const result = progressRoutine(r);
	if (result.changes.length === 0) return result;
	r.stretches = result.routine.stretches;
	r.progressAnswered = todayKey();
	logChange(r, 'progress', result.changes.join('; '));
	saveAll();
	return result;
}

/** Add one set (up to 20) as the progression step. */
export function addRoutineSet(id: string): void {
	const r = getRoutine(id);
	if (!r) return;
	const before = r.sets ?? 1;
	const after = Math.min(20, before + 1);
	r.sets = after;
	r.progressAnswered = todayKey();
	if (after !== before) logChange(r, 'set', `Sets ${before} → ${after}`);
	saveAll();
}

/** Answer "ready to progress?" with "not yet". */
export function skipProgress(id: string): void {
	const r = getRoutine(id);
	if (!r) return;
	r.progressAnswered = todayKey();
	saveAll();
}

/** Do about a quarter less (a set, or shorter holds and fewer reps) and note it in the history. */
export function easeOffRoutine(id: string): DoseChange | null {
	const r = getRoutine(id);
	if (!r) return null;
	const result = easeRoutine(r);
	if (result.changes.length > 0) {
		r.stretches = result.routine.stretches;
		r.sets = result.routine.sets;
		logChange(r, 'ease', result.changes.join('; '));
	}
	r.easeAnswered = todayKey();
	saveAll();
	return result;
}

/** Answer "ease off?" with "not now". */
export function dismissEase(id: string): void {
	const r = getRoutine(id);
	if (!r) return;
	r.easeAnswered = todayKey();
	saveAll();
}

/** Star or unstar a library stretch. */
export function toggleFavouriteStretch(id: string): void {
	const list = settings.favouriteStretches ?? [];
	settings.favouriteStretches = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
	saveSettings(settings);
}

/** Remember a library stretch as recently added (newest first, last 20). */
export function noteRecentStretch(id: string): void {
	settings.recentStretches = [id, ...(settings.recentStretches ?? []).filter((x) => x !== id)].slice(0, 20);
	saveSettings(settings);
}

/** Pain areas logged with any pain in the last two weeks. */
export function recentPainAreas(): PainArea[] {
	const since = addDays(todayKey(), -14);
	return [...new Set(painLog.filter((e) => e.date >= since && e.score > 0).flatMap((e) => e.areas ?? []))];
}

/** Drop a new blank routine that was left without stretches (it was never saved). Returns true if dropped. */
export function discardIfEmpty(id: string): boolean {
	const idx = routines.findIndex((r) => r.id === id);
	if (idx < 0 || !drafts.has(id) || routines[idx].stretches.length > 0) return false;
	routines.splice(idx, 1);
	drafts.delete(id);
	return true;
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
		completions: [],
		// a copy starts its own dose history and prompts
		history: undefined,
		easeAnswered: undefined,
		progressAnswered: undefined,
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

/** Log a played session (finished or ended early) for the history on Stats. */
export function logSession(entry: Omit<SessionEntry, 'date' | 'at'>, now: Date = new Date()): void {
	sessions.push({ ...entry, date: todayKey(now), at: now.getTime() });
	if (sessions.length > 1000) sessions.splice(0, sessions.length - 1000);
	saveSessions(sessions);
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
	/** absent in backups made before pain and morning checks were included */
	pain?: PainEntry[];
	morning?: MorningCheck[];
	/** absent in backups made before the session history existed */
	sessions?: SessionEntry[];
	/** absent in backups made before function check-ins existed */
	function?: FunctionCheck[];
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
		routines: JSON.parse(JSON.stringify(persistedRoutines())) as Routine[],
		photos,
		pain: JSON.parse(JSON.stringify(painLog)) as PainEntry[],
		morning: JSON.parse(JSON.stringify(morningChecks)) as MorningCheck[],
		sessions: JSON.parse(JSON.stringify(sessions)) as SessionEntry[],
		function: JSON.parse(JSON.stringify(functionChecks)) as FunctionCheck[]
	};
	return JSON.stringify(backup, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

/** Add routines from a backup, generating fresh ids so restore is always additive. */
/** A backed-up schedule, if it looks valid. */
function importSchedule(value: unknown): Routine['schedule'] {
	if (!isRecord(value) || !Array.isArray(value.days) || !Array.isArray(value.times)) return undefined;
	const days = [...new Set(value.days.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
	const times = [
		...new Set(value.times.filter((t): t is string => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t)))
	].sort();
	return days.length ? { days, times, since: todayKey() } : undefined;
}

/** A backed-up schedule or weekly goal; old 'N× a day' goals become an every-day schedule. */
function importGoal(candidate: Record<string, unknown>): Pick<Routine, 'schedule' | 'frequency'> {
	const schedule = importSchedule(candidate.schedule);
	if (schedule) return { schedule };
	const f = candidate.frequency;
	if (!isRecord(f) || typeof f.times !== 'number') return {};
	const times = Math.max(1, Math.round(f.times));
	if (f.per === 'day') return { schedule: { days: [0, 1, 2, 3, 4, 5, 6], times: spreadTimes(times), since: todayKey() } };
	if (f.per === 'week') return { frequency: { per: 'week', times: Math.min(7, times), since: todayKey() } };
	return {};
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** A YYYY-MM-DD key from 2000 to tomorrow (allowing for time zones), so bad dates can't jump the queue. */
function validDay(value: unknown): value is string {
	return typeof value === 'string' && DATE_KEY.test(value) && value >= '2000-01-01' && !Number.isNaN(Date.parse(value)) && value <= addDays(todayKey(), 1);
}

/**
 * Merge backed-up pain scores, skipping ones already here (same timestamp), and
 * point them at the restored copies of their routines. Returns how many were added.
 */
function importPain(value: unknown, idMap: Map<string, string>): number {
	if (!Array.isArray(value)) return 0;
	const seen = new Set(painLog.map((p) => p.at));
	let added = 0;
	for (const p of value) {
		if (!isRecord(p) || !validDay(p.date)) continue;
		if (typeof p.score !== 'number' || p.score < 0 || p.score > 10 || typeof p.at !== 'number' || p.at > Date.now() + 86_400_000 || seen.has(p.at)) continue;
		const oldId = typeof p.routineId === 'string' ? p.routineId : null;
		// The micro-break has a fixed id and isn't in the routine list.
		const routineId =
			oldId === null || oldId === MICRO_BREAK_ID
				? oldId
				: (idMap.get(oldId) ?? (routines.some((r) => r.id === oldId) ? oldId : null));
		const spots = cleanSpots(p.spots);
		const areas = spots.length ? entryAreas({ spots }) : Array.isArray(p.areas) ? [...new Set(p.areas.filter(isPainArea))] : [];
		const causes = cleanTags(p.causes);
		const helped = cleanTags(p.helped);
		const note = typeof p.note === 'string' ? p.note.trim().slice(0, 2000) : '';
		painLog.push({
			date: p.date,
			score: spots.length ? Math.max(...spots.map((s) => s.score)) : Math.round(p.score),
			routineId,
			at: p.at,
			...(p.gentle === true && { gentle: true }),
			...(areas.length && { areas }),
			...(spots.length && { spots }),
			...(causes.length && { causes }),
			...(helped.length && { helped }),
			...(note && { note })
		});
		seen.add(p.at);
		added += 1;
	}
	if (added) {
		painLog.sort((a, b) => a.at - b.at);
		savePain(painLog);
	}
	return added;
}

/** Merge backed-up sessions, skipping ones already here (same timestamp) and mapping routine ids. */
function importSessions(value: unknown, idMap: Map<string, string>): void {
	if (!Array.isArray(value)) return;
	const seen = new Set(sessions.map((s) => s.at));
	let added = 0;
	for (const s of value) {
		if (!isRecord(s) || !validDay(s.date) || typeof s.at !== 'number' || s.at > Date.now() + 86_400_000 || seen.has(s.at)) continue;
		if (typeof s.routineId !== 'string' || typeof s.name !== 'string' || typeof s.seconds !== 'number' || !(s.seconds >= 0)) continue;
		sessions.push({
			date: s.date,
			at: s.at,
			routineId: idMap.get(s.routineId) ?? s.routineId,
			name: s.name.slice(0, 80),
			seconds: Math.round(s.seconds),
			...(s.gentle === true && { gentle: true }),
			...(s.partial === true && { partial: true })
		});
		seen.add(s.at);
		added += 1;
	}
	if (added) {
		sessions.sort((a, b) => a.at - b.at);
		if (sessions.length > 1000) sessions.splice(0, sessions.length - 1000);
		saveSessions(sessions);
	}
}

/** Merge backed-up morning checks for days that don't have one yet. */
function importMorning(value: unknown): number {
	if (!Array.isArray(value)) return 0;
	const days = new Set(morningChecks.map((c) => c.date));
	let added = 0;
	for (const c of value) {
		if (!isRecord(c) || !validDay(c.date) || days.has(c.date)) continue;
		if (c.verdict !== 'better' && c.verdict !== 'same' && c.verdict !== 'worse') continue;
		morningChecks.push({ date: c.date, verdict: c.verdict, at: typeof c.at === 'number' ? c.at : Date.now() });
		days.add(c.date);
		added += 1;
	}
	if (added) {
		morningChecks.sort((a, b) => a.date.localeCompare(b.date));
		saveMorningChecks(morningChecks);
	}
	return added;
}

/** Merge backed-up function check-ins for days that don't have one yet. */
function importFunction(value: unknown): number {
	if (!Array.isArray(value)) return 0;
	const days = new Set(functionChecks.map((c) => c.date));
	let added = 0;
	for (const c of value) {
		if (!isRecord(c) || !validDay(c.date) || days.has(c.date) || !Array.isArray(c.items)) continue;
		const items = c.items
			.filter((i): i is { activity: string; score: number } => isRecord(i) && typeof i.activity === 'string' && typeof i.score === 'number')
			.map((i) => ({ activity: i.activity.trim().slice(0, 80), score: Math.min(10, Math.max(0, Math.round(i.score))) }))
			.filter((i) => i.activity)
			.slice(0, 3);
		if (items.length === 0) continue;
		functionChecks.push({ date: c.date, at: typeof c.at === 'number' ? c.at : Date.now(), items, ...(c.flag === true && { flag: true }) });
		days.add(c.date);
		added += 1;
	}
	if (added) {
		functionChecks.sort((a, b) => a.date.localeCompare(b.date));
		saveFunctionChecks(functionChecks);
	}
	return added;
}

/** Keep the well-formed dose-history entries (last ten) and prompt answers from a backup. */
function importHistory(candidate: Record<string, unknown>): Pick<Routine, 'history' | 'easeAnswered' | 'progressAnswered'> {
	// Without these, a restore would bring back an ease-off or progress prompt that was already answered.
	const answered = {
		...(validDay(candidate.easeAnswered) && { easeAnswered: candidate.easeAnswered }),
		...(validDay(candidate.progressAnswered) && { progressAnswered: candidate.progressAnswered })
	};
	if (!Array.isArray(candidate.history)) return answered;
	const kept: RoutineChange[] = [];
	for (const item of candidate.history) {
		if (!isRecord(item) || !validDay(item.date)) continue;
		if (item.kind !== 'progress' && item.kind !== 'set' && item.kind !== 'ease') continue;
		if (typeof item.note !== 'string') continue;
		kept.push({ date: item.date, kind: item.kind, note: item.note.trim().slice(0, 200) });
	}
	return kept.length ? { ...answered, history: kept.slice(-10) } : answered;
}

export async function importBackup(
	raw: string
): Promise<{ added: number; skipped: number; pain: number; morning: number; function: number }> {
	const parsed: unknown = JSON.parse(raw);
	const source = Array.isArray(parsed) ? { routines: parsed, photos: {} } : parsed;
	if (!isRecord(source) || !Array.isArray(source.routines)) throw new Error('This file is not a valid Stretch & Recovery backup.');

	const photos = isRecord(source.photos) ? source.photos : {};
	let added = 0;
	let skipped = 0;
	/** backed-up routine id -> its restored copy, so pain scores follow */
	const idMap = new Map<string, string>();
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
			cue: typeof candidate.cue === 'string' && candidate.cue.trim() ? candidate.cue.trim() : undefined,
			fallback: candidate.fallback === 'gentle' ? 'gentle' : undefined,
			...importGoal(candidate),
			...importHistory(candidate),
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
			if (item.mode === 'hold' || item.mode === 'reps') stretch.mode = item.mode;
			if (typeof item.reps === 'number' && Number.isFinite(item.reps)) stretch.reps = clampReps(item.reps);
			if (typeof item.repSeconds === 'number' && Number.isFinite(item.repSeconds)) stretch.repSeconds = clampRepSeconds(item.repSeconds);
			if (Array.isArray(item.muscles)) stretch.muscles = item.muscles.filter(isMuscle);
			if (typeof item.load === 'string' && item.load.trim()) stretch.load = item.load.trim().slice(0, 60).trimEnd();
			if (typeof item.sets === 'number' && Number.isFinite(item.sets) && item.sets > 1) stretch.sets = clampMoveSets(item.sets);
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
		if (typeof candidate.id === 'string') idMap.set(candidate.id, routine.id);
		added += 1;
	}
	saveRoutines(persistedRoutines());
	importSessions(source.sessions, idMap);
	return {
		added,
		skipped,
		pain: importPain(source.pain, idMap),
		morning: importMorning(source.morning),
		function: importFunction(source.function)
	};
}

/* ----------------------------- Streak actions ----------------------------- */

/** Log a finished play against the routine's frequency goal. */
export function recordCompletion(id: string, now: Date = new Date()): void {
	const r = routines.find((item) => item.id === id);
	if (!r) return;
	const today = todayKey(now);
	const cutoff = addDays(today, -27);
	r.completions = [...(r.completions ?? []).filter((d) => d >= cutoff), today];
	saveAll();
}

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


if (typeof window !== 'undefined' && migrateSchedules()) saveAll();
