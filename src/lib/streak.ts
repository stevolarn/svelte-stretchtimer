import type { StreakState } from './types.ts';
import { addDays, todayKey } from './time.ts';

export function completedSet(state: StreakState): Set<string> {
	return new Set(state.completedDates);
}

/**
 * Current streak: consecutive completed days ending today (if today is
 * completed) or yesterday (a not-yet-completed today does not break a streak).
 */
export function currentStreak(state: StreakState, today: string = todayKey()): number {
	const set = completedSet(state);
	let day = set.has(today) ? today : addDays(today, -1);
	let streak = 0;
	while (set.has(day)) {
		streak += 1;
		day = addDays(day, -1);
	}
	return streak;
}

/** Longest run of consecutive completed days ever recorded. */
export function longestStreak(state: StreakState): number {
	const set = completedSet(state);
	const dates = [...set].sort();
	let best = 0;
	let run = 0;
	let prev: string | null = null;
	for (const d of dates) {
		if (prev !== null && addDays(prev, 1) === d) {
			run += 1;
		} else {
			run = 1;
		}
		if (run > best) best = run;
		prev = d;
	}
	return best;
}

/** Every 7 completed days earns one streak fixer. */
export function fixersEarned(state: StreakState): number {
	return Math.floor(state.completedDates.length / 7);
}

export function fixersAvailable(state: StreakState): number {
	return Math.max(0, fixersEarned(state) - state.fixersUsed);
}

/** Progress (0-7) toward the next earned fixer. */
export function fixerProgress(state: StreakState): number {
	return state.completedDates.length % 7;
}

/**
 * The date a repair would fill: the day immediately before the current
 * streak run, when that day is missing AND a completed day exists before it
 * (i.e. the gap actually broke two runs — filling it is a real repair, not
 * just extending the streak). Returns null when there is nothing to repair.
 */
export function repairTarget(state: StreakState, today: string = todayKey()): string | null {
	const set = completedSet(state);
	if (set.size === 0) return null;
	const day = set.has(today) ? today : addDays(today, -1);
	if (!set.has(day)) return null; // nothing completed in the current window
	// Walk back to the first missing day before the current run.
	let cursor = day;
	while (set.has(cursor)) cursor = addDays(cursor, -1);
	const repair = cursor;
	const earliest = state.completedDates[0];
	// Only a genuine break can be repaired: something was completed before it.
	if (repair <= earliest) return null;
	return repair;
}
