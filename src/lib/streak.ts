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
 * Returns the exact list of missing dates needed to completely bridge the
 * broken streak to the current day/yesterday.
 * Returns [] when no broken streak can be reconnected.
 */
export function repairGap(state: StreakState, today: string = todayKey()): string[] {
	const set = completedSet(state);
	if (set.size === 0) return [];

	const yesterday = addDays(today, -1);
	const sorted = [...set].sort();
	const earliest = sorted[0];

	// Case 1: Inactive streak (neither today nor yesterday is completed).
	// The gap is all consecutive missing days from (latest completed + 1) up to yesterday.
	if (!set.has(today) && !set.has(yesterday)) {
		const latestDone = sorted[sorted.length - 1];
		if (!latestDone) return [];

		const gapDates: string[] = [];
		let cursor = addDays(latestDone, 1);
		while (cursor <= yesterday) {
			gapDates.push(cursor);
			cursor = addDays(cursor, 1);
		}
		return gapDates;
	}

	// Case 2: Active run exists ending at today or yesterday.
	// Walk back through the active run to find the missing gap immediately preceding it.
	const anchor = set.has(today) ? today : yesterday;
	let cursor = anchor;
	while (set.has(cursor)) {
		cursor = addDays(cursor, -1);
	}

	// Now cursor is at the first missing date. Walk backwards collecting all missing dates
	// until we either hit a completed date in `set` or go earlier than `earliest`.
	const gapDates: string[] = [];
	while (!set.has(cursor) && cursor >= earliest) {
		gapDates.unshift(cursor);
		cursor = addDays(cursor, -1);
	}

	// Only return the gap if there is a completed day before it to connect to!
	if (cursor < earliest) {
		return [];
	}

	return gapDates;
}

/** Returns true only if a broken streak exists and the user has enough fixers to completely repair it. */
export function canRepairStreak(state: StreakState, today: string = todayKey()): boolean {
	const gap = repairGap(state, today);
	return gap.length > 0 && fixersAvailable(state) >= gap.length;
}

/** Legacy helper for single-date target (returns first missing date or null). */
export function repairTarget(state: StreakState, today: string = todayKey()): string | null {
	const gap = repairGap(state, today);
	return gap.length > 0 ? gap[0] : null;
}
