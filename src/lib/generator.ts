import type { Routine, Settings, Stretch, StockStretch } from './types.ts';
import { equipmentOf, focusOf, type Equipment, type Focus } from './stockTags.ts';
import { stockStretches } from './stockStretches.ts';
import { buildTimeline, clampRepSeconds, clampReps, timelineTotal } from './timeline.ts';

export type Goal = 'relief' | 'mobility' | 'strength' | 'warmup' | 'cooldown' | 'desk';
export type Intensity = 'easy' | 'normal' | 'hard';
export type Position = StockStretch['position'];
export type MoveType = StockStretch['type'];

export interface WizardInput {
	goal: Goal;
	/** empty = full body (balance across all focuses) */
	focus: Focus[];
	/** target length in minutes */
	minutes: number;
	/** allowed types; empty = goal defaults */
	types: MoveType[];
	/** equipment the user has (never 'none'); 'none' moves are always allowed */
	equipment: Equipment[];
	/** allowed positions; empty = all */
	positions: Position[];
	intensity: Intensity;
	/** rest between stretches (also the get-ready rest at the start) */
	breakSeconds: number;
	seed?: number;
}

export const goalLabels: Record<Goal, string> = {
	relief: 'Pain relief',
	mobility: 'Mobility',
	strength: 'Strength & stability',
	warmup: 'Warm-up',
	cooldown: 'Cool-down',
	desk: 'Desk break'
};

export const goalBlurbs: Record<Goal, string> = {
	relief: 'Gentle stretches and easy movement to ease sore, tight spots.',
	mobility: 'Move joints through their range to feel looser day to day.',
	strength: 'Holds and controlled moves that build strength and stability.',
	warmup: 'Dynamic moves that get you ready before activity.',
	cooldown: 'Slow static stretches to wind down after activity.',
	desk: 'Quick seated and standing moves to break up sitting.'
};

export const goalTypes: Record<Goal, MoveType[]> = {
	relief: ['static', 'mobility', 'dynamic', 'isometrics'],
	mobility: ['mobility', 'dynamic', 'static', 'yoga'],
	strength: ['isometrics', 'calisthenics', 'eccentrics'],
	warmup: ['dynamic', 'mobility', 'cardio'],
	cooldown: ['static', 'yoga', 'mobility'],
	desk: ['static', 'dynamic', 'mobility', 'isometrics']
};

export const goalPositions: Record<Goal, Position[]> = {
	relief: [],
	mobility: [],
	strength: [],
	warmup: [],
	cooldown: [],
	desk: ['seated', 'standing']
};

export const typeLabels: Record<MoveType, string> = {
	static: 'Static stretches',
	dynamic: 'Dynamic moves',
	isometrics: 'Isometric holds',
	eccentrics: 'Eccentrics',
	calisthenics: 'Calisthenics',
	mobility: 'Mobility drills',
	yoga: 'Yoga',
	cardio: 'Cardio'
};

export const intensityLabels: Record<Intensity, string> = {
	easy: 'Easy',
	normal: 'Normal',
	hard: 'Hard'
};

const ALL_FOCUS: Focus[] = ['neck', 'shoulders', 'elbow', 'wrist-hand', 'back', 'core', 'hips', 'legs'];
const HARD_NAMES = /handstand|pike|single[- ]arm|v[- ]sit|dead hang|hollow|dip|pistol|nordic|l[- ]sit|dragon flag|plank leg lift|side plank leg/i;
const EASY_EXCLUDED_TYPES: MoveType[] = ['calisthenics', 'eccentrics', 'cardio'];
const RELIEF_EXCLUDED_TYPES: MoveType[] = ['cardio', 'calisthenics'];
const PHASE: Record<MoveType, number> = {
	dynamic: 0,
	mobility: 0,
	cardio: 0,
	isometrics: 1,
	calisthenics: 1,
	eccentrics: 1,
	yoga: 1,
	static: 2
};
const POSITION_ORDER: Record<Position, number> = { standing: 0, seated: 1, floor: 2 };

/** Goal-specific bonus for each type, on top of its place in the goal's default list. */
const GOAL_TYPE_BONUS: Record<Goal, Partial<Record<MoveType, number>>> = {
	relief: { static: 2, mobility: 1.5, dynamic: 0.5 },
	mobility: { mobility: 2, dynamic: 1.5, static: 0.5 },
	strength: { isometrics: 2, calisthenics: 1, eccentrics: 1 },
	warmup: { dynamic: 3, mobility: 2, cardio: 0.5 },
	cooldown: { static: 3, yoga: 1, mobility: 0.5 },
	desk: { static: 1.5, mobility: 1.5, dynamic: 1, isometrics: 0.5 }
};

function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function allowed(input: WizardInput, s: StockStretch): boolean {
	const types = input.types.length ? input.types : goalTypes[input.goal];
	if (!types.includes(s.type)) return false;
	if (input.positions.length && !input.positions.includes(s.position)) return false;
	const have = new Set<Equipment>([...input.equipment, 'none']);
	if (!equipmentOf(s).every((e) => have.has(e))) return false;
	if (input.intensity === 'easy' && (EASY_EXCLUDED_TYPES.includes(s.type) || HARD_NAMES.test(s.name))) return false;
	if (input.goal === 'relief' && RELIEF_EXCLUDED_TYPES.includes(s.type)) return false;
	if (input.goal === 'desk' && s.position === 'floor' && !input.positions.includes('floor')) return false;
	if (input.focus.length && !focusOf(s).some((f) => input.focus.includes(f))) return false;
	return true;
}

function scoreOf(input: WizardInput, s: StockStretch, rnd: () => number): number {
	const order = goalTypes[input.goal].indexOf(s.type);
	let score = GOAL_TYPE_BONUS[input.goal][s.type] ?? 0;
	if (order >= 0) score += (goalTypes[input.goal].length - order) * 0.3;
	const f = focusOf(s);
	if (input.focus.length) {
		const matched = f.filter((x) => input.focus.includes(x)).length;
		score += matched * 1.5 + (matched === f.length ? 1 : 0);
	} else if (f.length === 1) score += 0.5;
	return score + rnd() * 2.5;
}

/** Candidates with their scores, best first. The same seed always gives the same jitter. */
function ranked(input: WizardInput, catalog: StockStretch[]): Array<{ s: StockStretch; score: number }> {
	const rnd = mulberry32((input.seed ?? 1) * 2654435761);
	return catalog
		.filter((s) => allowed(input, s))
		.map((s) => ({ s, score: scoreOf(input, s, rnd) }))
		.sort((a, b) => b.score - a.score);
}

export function candidates(input: WizardInput, catalog: StockStretch[] = stockStretches): StockStretch[] {
	return ranked(input, catalog).map((r) => r.s);
}

const round5 = (n: number) => Math.round(n / 5) * 5;

export function toStretch(s: StockStretch, intensity: Intensity): Stretch {
	const stretch: Stretch = {
		id: crypto.randomUUID(),
		name: s.name,
		description: s.description,
		sides: s.sides,
		durationSeconds: s.defaultSeconds,
		photoId: null,
		iconKey: s.iconKey
	};
	const k = intensity === 'easy' ? 0.7 : intensity === 'hard' ? 1.3 : 1;
	if (s.defaultReps !== undefined) {
		stretch.mode = 'reps';
		stretch.reps = clampReps(s.defaultReps);
		stretch.repSeconds = clampRepSeconds(s.repSeconds);
		if (k !== 1) stretch.reps = clampReps(Math.max(3, Math.round(stretch.reps * k)));
		stretch.durationSeconds = stretch.reps * stretch.repSeconds;
	} else if (k !== 1) {
		stretch.durationSeconds = Math.max(10, round5(s.defaultSeconds * k));
	}
	return stretch;
}

export function estimateSeconds(stretches: Stretch[], breakSeconds: number): number {
	const routine: Routine = { id: 'x', name: 'x', stretches, createdAt: 0, breakSeconds };
	return timelineTotal(buildTimeline(routine, { breaksEnabled: true, breakSeconds } as Settings));
}

const sameMove = (a: { iconKey?: string; name: string }, b: { iconKey?: string; name: string }) =>
	(a.iconKey !== undefined && a.iconKey === b.iconKey) || a.name === b.name;

export function generateRoutine(
	input: WizardInput,
	catalog: StockStretch[] = stockStretches
): { name: string; stretches: Stretch[]; seconds: number } {
	const target = Math.round(input.minutes * 60);
	const pool = ranked(input, catalog);
	const areas: Focus[] = input.focus.length
		? [...input.focus]
		: ALL_FOCUS.filter((f) => pool.some((p) => focusOf(p.s).includes(f)));
	const share = new Map<Focus, number>(areas.map((a) => [a, 0]));
	const exhausted = new Set<Focus>();
	const used = new Set<StockStretch>();
	const picked: Array<{ s: StockStretch; stretch: Stretch }> = [];
	let est = 0;
	const total = () => estimateSeconds(picked.map((p) => p.stretch), input.breakSeconds);

	const take = (s: StockStretch, area: Focus | null) => {
		used.add(s);
		const stretch = toStretch(s, input.intensity);
		const before = est;
		picked.push({ s, stretch });
		est = total();
		if (area) share.set(area, (share.get(area) ?? 0) + (est - before));
	};

	while (est < target - 60) {
		const open = areas.filter((a) => !exhausted.has(a));
		if (!open.length) break;
		const area = open.reduce((m, a) => ((share.get(a) ?? 0) < (share.get(m) ?? 0) ? a : m));
		let found: StockStretch | null = null;
		for (const { s } of pool) {
			if (used.has(s) || picked.some((p) => sameMove(p.s, s))) continue;
			if (!focusOf(s).includes(area)) continue;
			const trial = estimateSeconds([...picked.map((p) => p.stretch), toStretch(s, input.intensity)], input.breakSeconds);
			if (trial <= target + 45) {
				found = s;
				break;
			}
		}
		if (found) take(found, area);
		else exhausted.add(area);
	}

	// Always at least two moves, even if the target is tiny or the pool is thin.
	for (const { s } of pool) {
		if (picked.length >= 2) break;
		if (!used.has(s) && !picked.some((p) => sameMove(p.s, s))) take(s, null);
	}

	const ordered = picked
		.map((p, i) => ({ p, i }))
		.sort(
			(a, b) =>
				PHASE[a.p.s.type] - PHASE[b.p.s.type] ||
				POSITION_ORDER[a.p.s.position] - POSITION_ORDER[b.p.s.position] ||
				a.i - b.i
		)
		.map((x) => x.p.stretch);
	topUp(ordered, input);
	return { name: routineName(input), stretches: ordered, seconds: estimateSeconds(ordered, input.breakSeconds) };
}

/**
 * A narrow focus can run out of distinct moves before the time is used: repeat moves as extra
 * sets (up to 3 each), then lengthen holds (up to 2 min), so the routine still fills its length.
 */
function topUp(stretches: Stretch[], input: WizardInput): void {
	const target = input.minutes * 60;
	const fits = () => estimateSeconds(stretches, input.breakSeconds) <= target + 45;
	const short = () => estimateSeconds(stretches, input.breakSeconds) < target - 60;
	for (let round = 2; round <= 3 && short(); round++) {
		for (const s of stretches) {
			if (!short()) break;
			const before = s.sets;
			s.sets = round;
			if (!fits()) s.sets = before;
		}
	}
	for (let step = 0; step < 10 && short(); step++) {
		let grew = false;
		for (const s of stretches) {
			if (!short() || s.mode === 'reps') continue;
			const base = s.durationSeconds;
			s.durationSeconds = base + 5;
			if (!fits() || s.durationSeconds > 120) s.durationSeconds = base;
			else grew = true;
		}
		if (!grew) break;
	}
}

export function swapOptions(
	input: WizardInput,
	current: Stretch[],
	index: number,
	catalog: StockStretch[] = stockStretches
): StockStretch[] {
	const cur = current[index];
	if (!cur) return [];
	const curStock = catalog.find((s) => sameMove(s, cur));
	const curFocus = curStock ? focusOf(curStock) : [];
	const pool = candidates(input, catalog).filter((s) => !current.some((c) => sameMove(c, s)));
	const tier = (s: StockStretch) => {
		const sharesFocus = focusOf(s).some((f) => curFocus.includes(f));
		const sameType = curStock !== undefined && s.type === curStock.type;
		return (sharesFocus ? 0 : 2) + (sameType ? 0 : 1);
	};
	return pool
		.map((s, i) => ({ s, i }))
		.sort((a, b) => tier(a.s) - tier(b.s) || a.i - b.i)
		.map((x) => x.s);
}

const focusShort: Record<Focus, string> = {
	neck: 'Neck',
	shoulders: 'Shoulders',
	elbow: 'Elbow',
	'wrist-hand': 'Wrist & Hand',
	back: 'Back',
	core: 'Core',
	hips: 'Hips',
	legs: 'Legs'
};

const goalNameWord: Record<Goal, string> = {
	relief: 'Relief',
	mobility: 'Mobility',
	strength: 'Strength',
	warmup: 'Warm-up',
	cooldown: 'Cool-down',
	desk: 'Desk break'
};

export function routineName(input: WizardInput): string {
	const names = ALL_FOCUS.filter((f) => input.focus.includes(f)).map((f) => focusShort[f]);
	let part: string;
	if (names.length === 0 || names.length === ALL_FOCUS.length) part = 'Full-body';
	else if (names.length <= 3) part = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
	else part = 'Multi-area';
	return `${input.minutes}-min ${part} ${goalNameWord[input.goal]}`;
}
