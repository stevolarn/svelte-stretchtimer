import type { MorningCheck, PainEntry, Routine } from './types.ts';
import { addDays, todayKey } from './time.ts';

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
