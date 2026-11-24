import type { FunctionCheck, MorningCheck, PainEntry, Routine, Stretch } from './types.ts';
import { addDays, todayKey } from './time.ts';
import { clampReps, clampRepSeconds } from './timeline.ts';

/*
 * Rehab helpers built on the tendon pain-monitoring model (Silbernagel 2007):
 * some pain during or after exercise is acceptable as long as it stays
 * moderate and has settled by the next morning. A worse next morning means
 * ease off; a calm fortnight means it's safe to think about progressing.
 */

export type PainZone = 'green' | 'amber' | 'red';

/** Pain right after a session: 0-2 comfortable, 3-5 acceptable if it settles, 6+ too much. */
export function painZone(score: number): PainZone {
	return score <= 2 ? 'green' : score <= 5 ? 'amber' : 'red';
}

export const zoneAdvice: Record<PainZone, string> = {
	green: 'Comfortable — a good level to work at.',
	amber: 'Acceptable, as long as it settles by tomorrow morning.',
	red: 'More than ideal. Try the gentle version next time.'
};

/**
 * Ask how it feels the morning after a routine was played, until it's answered or
 * something is done today. Uses routine plays, not streak days, which fixers can fill in.
 */
export function needsMorningCheck(
	routines: Routine[],
	completedDates: string[],
	checks: MorningCheck[],
	today: string = todayKey()
): boolean {
	const yesterday = addDays(today, -1);
	return (
		routines.some((r) => r.completions?.includes(yesterday)) &&
		!completedDates.includes(today) &&
		!checks.some((c) => c.date === today)
	);
}

export function morningVerdict(checks: MorningCheck[], today: string = todayKey()): MorningCheck['verdict'] | null {
	return checks.findLast((c) => c.date === today)?.verdict ?? null;
}

function average(scores: number[]): number | null {
	return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
}

export interface PainTrend {
	rising: boolean;
	reason: string;
}

/**
 * Rising when the last 7 days average at least 1.5 points above the 7 before
 * (two or more entries in each), or when two mornings this week were worse.
 */
export function painTrend(log: PainEntry[], checks: MorningCheck[], today: string = todayKey()): PainTrend {
	const weekStart = addDays(today, -6);
	const priorStart = addDays(today, -13);
	const recent = log.filter((p) => p.date >= weekStart && p.date <= today).map((p) => p.score);
	const prior = log.filter((p) => p.date >= priorStart && p.date < weekStart).map((p) => p.score);
	const now = recent.length >= 2 ? average(recent) : null;
	const before = prior.length >= 2 ? average(prior) : null;
	if (now !== null && before !== null && now >= before + 1.5) {
		return { rising: true, reason: `Pain this week averages ${now.toFixed(1)}, up from ${before.toFixed(1)} the week before.` };
	}
	const worse = checks.filter((c) => c.date >= weekStart && c.verdict === 'worse').length;
	if (worse >= 2) return { rising: true, reason: `${worse} mornings this week felt worse than before.` };
	return { rising: false, reason: '' };
}

/** Days with a finished routine among the last `days`, today included. */
export function daysPractised(completedDates: string[], days = 30, today: string = todayKey()): number {
	const from = addDays(today, -(days - 1));
	return completedDates.filter((d) => d >= from && d <= today).length;
}

export interface ProgressReady {
	plays: number;
	worst: number;
}

/**
 * Suggest progressing a routine after a calm fortnight: played on six or more
 * days, at least three pain scores after full (not gentle) plays all 3 or
 * under, and no worse mornings.
 * The choice is the user's; this only decides when to ask.
 */
export function readyToProgress(
	r: Routine,
	log: PainEntry[],
	checks: MorningCheck[],
	today: string = todayKey()
): ProgressReady | null {
	const from = addDays(today, -13);
	if (r.progressAnswered && r.progressAnswered >= from) return null;
	const plays = new Set((r.completions ?? []).filter((d) => d >= from)).size;
	if (plays < 6) return null;
	const scores = log.filter((p) => p.routineId === r.id && !p.gentle && p.date >= from).map((p) => p.score);
	if (scores.length < 3) return null;
	const worst = Math.max(...scores);
	if (worst > 3) return null;
	if (checks.some((c) => c.date >= from && c.verdict === 'worse')) return null;
	return { plays, worst };
}

/* ------------------------- graded dose changes ------------------------- */

export interface DoseChange {
	routine: Routine;
	/** one line per stretch (or set) that changes, for a preview before applying */
	changes: string[];
	/** advice that can't be applied automatically, e.g. a heavier load */
	tips: string[];
}

const HOLD_CAP = 60;
const REPS_CAP = 15;
const HOLD_FLOOR = 10;
const REPS_FLOOR = 3;

function stretchName(s: Stretch): string {
	return s.name || 'Untitled stretch';
}

function withReps(s: Stretch, reps: number): Stretch {
	const tempo = clampRepSeconds(s.repSeconds);
	return { ...s, reps, repSeconds: tempo, durationSeconds: reps * tempo };
}

/**
 * One small step up: holds +5s (up to 60s) and reps +2 (up to 15). At 15 reps the
 * next step is a heavier load and back to 10 reps, which the user makes in the editor.
 * Sets are left alone; an extra set is its own choice (change one thing at a time).
 */
export function progressRoutine(r: Routine): DoseChange {
	const changes: string[] = [];
	const tips: string[] = [];
	const stretches = r.stretches.map((s) => {
		if (s.mode === 'reps') {
			const reps = clampReps(s.reps);
			if (reps >= REPS_CAP) {
				tips.push(`${stretchName(s)}: at ${reps} reps, try a heavier load and drop back to 10`);
				return { ...s };
			}
			const next = Math.min(REPS_CAP, reps + 2);
			changes.push(`${stretchName(s)}: ${reps} → ${next} reps`);
			return withReps(s, next);
		}
		if (s.durationSeconds >= HOLD_CAP) return { ...s };
		const next = Math.min(HOLD_CAP, s.durationSeconds + 5);
		changes.push(`${stretchName(s)}: ${s.durationSeconds}s → ${next}s`);
		return { ...s, durationSeconds: next };
	});
	return { routine: { ...r, stretches }, changes, tips };
}

/**
 * About 25% less: with more than one set, drop a set and leave the moves alone;
 * otherwise shorten holds (to the nearest 5s, at least 10s) and cut reps (at least 3).
 */
export function easeRoutine(r: Routine): DoseChange {
	const sets = r.sets ?? 1;
	if (sets > 1) {
		return {
			routine: { ...r, stretches: r.stretches.map((s) => ({ ...s })), sets: sets - 1 },
			changes: [`One set fewer: ${sets} → ${sets - 1}`],
			tips: []
		};
	}
	const changes: string[] = [];
	const stretches = r.stretches.map((s) => {
		if (s.mode === 'reps') {
			const reps = clampReps(s.reps);
			const next = Math.max(REPS_FLOOR, Math.round(reps * 0.75));
			if (next >= reps) return { ...s };
			changes.push(`${stretchName(s)}: ${reps} → ${next} reps`);
			return withReps(s, next);
		}
		const next = Math.max(HOLD_FLOOR, Math.round((s.durationSeconds * 0.75) / 5) * 5);
		if (next >= s.durationSeconds) return { ...s };
		changes.push(`${stretchName(s)}: ${s.durationSeconds}s → ${next}s`);
		return { ...s, durationSeconds: next };
	});
	return { routine: { ...r, stretches }, changes, tips: [] };
}

export interface EaseReason {
	reason: string;
}

/**
 * Suggest easing off when the last two full (not gentle) plays of this routine in the past
 * week both scored 6+, or two mornings this week were worse the day after playing it.
 * Quiet for a week after the prompt is answered.
 */
export function needsEasing(
	r: Routine,
	log: PainEntry[],
	checks: MorningCheck[],
	today: string = todayKey()
): EaseReason | null {
	const from = addDays(today, -6);
	if (r.easeAnswered && r.easeAnswered >= from) return null;
	const recent = log
		.filter((p) => p.routineId === r.id && !p.gentle && p.date >= from && p.date <= today)
		.sort((a, b) => a.at - b.at)
		.slice(-2);
	if (recent.length === 2 && recent.every((p) => painZone(p.score) === 'red')) {
		return { reason: `Your last two pain scores after this routine were ${recent[0].score} and ${recent[1].score} out of 10.` };
	}
	const played = new Set(r.completions ?? []);
	// Completions don't say whether a play was gentle; the pain scores do, when there are any.
	const gentleOnly = (day: string) => {
		const scores = log.filter((p) => p.routineId === r.id && p.date === day);
		return scores.length > 0 && scores.every((p) => p.gentle);
	};
	const worse = checks.filter((c) => {
		const before = addDays(c.date, -1);
		return c.verdict === 'worse' && c.date >= from && c.date <= today && played.has(before) && !gentleOnly(before);
	}).length;
	if (worse >= 2) return { reason: `${worse} mornings this week felt worse the day after this routine.` };
	return null;
}

/* ------------------------- function and outcomes ------------------------- */

/*
 * Thresholds from docs/research.md: a change of about 2 points is the smallest that
 * matters on both the 0-10 pain scale and the PSFS; re-measure every 2-4 weeks; no
 * meaningful progress after about 6 weeks of steady work is a reason to get checked.
 */
export const MEANINGFUL_CHANGE = 2;
const FUNCTION_EVERY_DAYS = 14;
const NOT_IMPROVING_DAYS = 42;

/** A baseline function check first, then one a fortnight. */
export function functionCheckDue(checks: FunctionCheck[], today: string = todayKey()): boolean {
	const last = checks.at(-1);
	return !last || last.date <= addDays(today, -FUNCTION_EVERY_DAYS);
}

/** Average score of a check, counting only the activities in `only` when given; null if none count. */
export function checkScore(check: FunctionCheck, only?: Set<string>): number | null {
	const scores = check.items.filter((i) => !only || only.has(i.activity.trim().toLowerCase())).map((i) => i.score);
	return average(scores);
}

export interface FunctionChangeResult {
	baseline: number;
	latest: number;
	/** latest - baseline; positive = better */
	change: number;
	meaningful: boolean;
}

/**
 * The activities rated at both the first and the latest check (lower-cased), so averages compare
 * like with like; undefined (count everything) when they share none.
 */
export function trackedActivities(checks: FunctionCheck[]): Set<string> | undefined {
	if (checks.length < 2) return undefined;
	const key = (a: string) => a.trim().toLowerCase();
	const last = checks[checks.length - 1];
	const shared = new Set(checks[0].items.map((i) => key(i.activity)).filter((a) => last.items.some((i) => key(i.activity) === a)));
	return shared.size > 0 ? shared : undefined;
}

/**
 * First check against the latest, averaged over the activities both rated (or over
 * all of each when they share none). Null until there are two checks.
 */
export function functionChange(checks: FunctionCheck[]): FunctionChangeResult | null {
	if (checks.length < 2) return null;
	const first = checks[0];
	const last = checks[checks.length - 1];
	const only = trackedActivities(checks);
	const baseline = checkScore(first, only);
	const latest = checkScore(last, only);
	if (baseline === null || latest === null) return null;
	const change = latest - baseline;
	return { baseline, latest, change, meaningful: Math.abs(change) >= MEANINGFUL_CHANGE };
}

export interface NotImproving {
	reason: string;
}

/**
 * After six weeks or more of records, flag when neither measure shows a meaningful gain:
 * pain (first fortnight against the last, if it started at 3 or more) hasn't dropped by 2,
 * and function (if it started below 8) hasn't risen by 2. Measures with too little data,
 * or no room to improve, are left out; with none left there's nothing to say.
 */
export function notImproving(
	log: PainEntry[],
	checks: FunctionCheck[],
	today: string = todayKey()
): NotImproving | null {
	const dates = [...log.map((p) => p.date), ...checks.map((c) => c.date)].sort();
	const start = dates[0];
	if (!start || start > addDays(today, -NOT_IMPROVING_DAYS)) return null;

	const verdicts: boolean[] = [];
	const parts: string[] = [];
	const early = average(log.filter((p) => p.date < addDays(start, 14)).map((p) => p.score));
	const lateScores = log.filter((p) => p.date > addDays(today, -14)).map((p) => p.score);
	const late = lateScores.length >= 2 ? average(lateScores) : null;
	if (early !== null && late !== null && early >= 3) {
		const stuck = early - late < MEANINGFUL_CHANGE;
		verdicts.push(stuck);
		if (stuck) parts.push(`pain has gone from about ${early.toFixed(1)} to ${late.toFixed(1)}`);
	}
	const fn = functionChange(checks);
	const lastCheck = checks[checks.length - 1];
	// only a recent check says anything about now
	if (fn && fn.baseline < 8 && lastCheck.date > addDays(checks[0].date, 20) && lastCheck.date > addDays(today, -NOT_IMPROVING_DAYS)) {
		const stuck = fn.change < MEANINGFUL_CHANGE;
		verdicts.push(stuck);
		if (stuck) parts.push(`your activity scores have gone from ${fn.baseline.toFixed(1)} to ${fn.latest.toFixed(1)}`);
	}
	if (verdicts.length === 0 || verdicts.some((v) => !v)) return null;
	return { reason: `After six weeks, ${parts.join(' and ')}.` };
}
