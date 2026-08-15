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
 * streak run, or the most recent missed day when a streak was broken.
 * Returns null when there is nothing to repair.
 */
export function repairTarget(state: StreakState, today: string = todayKey()): string | null {
	const set = completedSet(state);
	if (set.size === 0) return null;

	const yesterday = addDays(today, -1);
	const sorted = [...set].sort();
	const earliest = sorted[0];

	// Case 1: Neither today nor yesterday is completed (streak is currently broken/inactive)
	if (!set.has(today) && !set.has(yesterday)) {
		const latestDone = sorted[sorted.length - 1];
		if (!latestDone) return null;

		// If the most recent completed day is within recent history, the gap immediately following it can be repaired
		const nextDay = addDays(latestDone, 1);
		if (nextDay <= today) {
			return nextDay === today ? yesterday : nextDay;
		}
		return null;
	}

	// Case 2: Today or yesterday is completed (an active run exists)
	// Walk back through the active run to find the missing date immediately preceding it.
	const anchor = set.has(today) ? today : yesterday;
	let cursor = anchor;
	while (set.has(cursor)) {
		cursor = addDays(cursor, -1);
	}
	const gap = cursor;
	// Only a genuine break can be repaired: something was completed before it.
	if (gap <= earliest) return null;
	return gap;
}
