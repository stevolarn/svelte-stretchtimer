import type { Routine, RoutineFrequency } from './types.ts';
import { addDays, todayKey } from './time.ts';

/** 'Daily', '3× a day', 'Weekly', '3× a week'. */
export function frequencyLabel(f: RoutineFrequency): string {
	if (f.times <= 1) return f.per === 'day' ? 'Daily' : 'Weekly';
	return `${f.times}× a ${f.per}`;
}

/** Plays so far against the goal, for today or this week (Monday first). */
export function frequencyProgress(r: Routine, now: Date = new Date()): { done: number; target: number; period: string } | null {
	const f = r.frequency;
	if (!f) return null;
	const today = todayKey(now);
	const from = f.per === 'day' ? today : addDays(today, -((now.getDay() + 6) % 7));
	const done = (r.completions ?? []).filter((d) => d >= from && d <= today).length;
	return { done, target: f.times, period: f.per === 'day' ? 'today' : 'this week' };
}

/** Plays of a routine on one day. */
export function playsOn(r: Routine, key: string): number {
	return (r.completions ?? []).filter((d) => d === key).length;
}

export interface ScheduledItem {
	routine: Routine;
	/** plays wanted that day */
	target: number;
	done: number;
	why: string;
}

/**
 * Routines scheduled on a date: the weekly plan's pick for that weekday, then
 * every daily goal. A routine that is both is listed once with the higher target.
 */
export function scheduledOn(routines: Routine[], weekPlan: (string | null)[], key: string): ScheduledItem[] {
	const [y, m, d] = key.split('-').map(Number);
	const weekday = new Date(y, m - 1, d).getDay();
	const items: ScheduledItem[] = [];
	const planned = routines.find((r) => r.id === weekPlan?.[weekday]);
	if (planned) {
		const daily = planned.frequency?.per === 'day' ? planned.frequency.times : 1;
		items.push({ routine: planned, target: daily, done: playsOn(planned, key), why: 'Planned' });
	}
	for (const r of routines) {
		if (r === planned || r.frequency?.per !== 'day') continue;
		items.push({ routine: r, target: r.frequency.times, done: playsOn(r, key), why: frequencyLabel(r.frequency) });
	}
	return items;
}

/** What's still to do today, in order: planned and daily routines, then unmet weekly goals not yet played today. */
export function dueToday(routines: Routine[], weekPlan: (string | null)[], now: Date = new Date()): ScheduledItem[] {
	const today = todayKey(now);
	const due = scheduledOn(routines, weekPlan, today).filter((i) => i.done < i.target);
	for (const r of routines) {
		if (r.frequency?.per !== 'week' || due.some((i) => i.routine === r)) continue;
		const progress = frequencyProgress(r, now);
		if (progress && progress.done < progress.target && playsOn(r, today) === 0) {
			due.push({ routine: r, target: progress.target, done: progress.done, why: `${progress.done}/${progress.target} this week` });
		}
	}
	return due;
}
