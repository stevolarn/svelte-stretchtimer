import type { Routine, StreakState } from './types.ts';
import { addDays, todayKey } from './time.ts';
import { scheduledOn } from './frequency.ts';

/*
 * From docs/research.md: a new habit takes a median of about 59-66 days of practice to
 * feel automatic (range 18-254), and a single missed day doesn't set it back.
 */
export const HABIT_DAYS = 66;

/** Days actually practised: completed days minus the ones filled in with a fixer (one fixer each). */
export function practiceDays(state: StreakState): number {
	return Math.max(0, new Set(state.completedDates).size - state.fixersUsed);
}

function lastPractised(state: StreakState, today: string): string | null {
	const past = state.completedDates.filter((d) => d <= today);
	return past.length ? past.reduce((a, b) => (a > b ? a : b)) : null;
}

/**
 * "Never miss twice": yesterday was missed after practising the day before, and today
 * isn't done yet. With schedules set up, only a scheduled day counts as a miss; with
 * only weekly goals there are no fixed days to miss, so it stays quiet.
 */
export function missedYesterday(state: StreakState, routines: Routine[], today: string = todayKey()): boolean {
	const done = new Set(state.completedDates);
	const yesterday = addDays(today, -1);
	if (done.has(today) || done.has(yesterday) || !done.has(addDays(today, -2))) return false;
	if (routines.some((r) => r.schedule)) {
		// a schedule set up after yesterday doesn't make yesterday a missed day
		const active = routines.filter((r) => !r.schedule?.since || r.schedule.since <= yesterday);
		return scheduledOn(active, yesterday).length > 0;
	}
	return !routines.some((r) => r.frequency);
}

/** daysAway: days since the last practice (3 or more). */
export type FreshStart = { kind: 'comeback'; daysAway: number } | { kind: 'month' };

/**
 * A fresh-start moment: back after three or more days away, or the first of the month.
 * `dismissed` is the 'YYYY-MM-DD' the card was last closed: a comeback card stays closed
 * until the next gap (only a close during this gap counts, not an earlier new-month one),
 * a new-month card for the rest of the day.
 */
export function freshStart(state: StreakState, today: string = todayKey(), dismissed?: string): FreshStart | null {
	const last = lastPractised(state, today);
	if (!last) return null;
	if (last <= addDays(today, -3)) {
		if (dismissed && dismissed >= addDays(last, 3)) return null;
		let daysAway = 3;
		while (addDays(last, daysAway) < today) daysAway += 1;
		return { kind: 'comeback', daysAway };
	}
	if (today.endsWith('-01') && dismissed !== today) return { kind: 'month' };
	return null;
}
