import type { Routine, RoutineFrequency, RoutineSchedule } from './types.ts';
import { addDays, todayKey } from './time.ts';

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** 'Weekly', '3× a week' (and the legacy per-day forms). */
export function frequencyLabel(f: RoutineFrequency): string {
	if (f.times <= 1) return f.per === 'day' ? 'Daily' : 'Weekly';
	return `${f.times}× a ${f.per}`;
}

/** '13:30' -> '1:30 pm' (or '13:30', following the locale). */
export function formatTime(hhmm: string): string {
	const [h, m] = hhmm.split(':').map(Number);
	return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** 'Every day', 'Weekdays', 'Weekends' or 'Mon, Wed, Fri'. */
export function daysLabel(days: number[]): string {
	const set = new Set(days);
	if (set.size === 7) return 'Every day';
	if (set.size === 5 && [1, 2, 3, 4, 5].every((d) => set.has(d))) return 'Weekdays';
	if (set.size === 2 && set.has(0) && set.has(6)) return 'Weekends';
	return [1, 2, 3, 4, 5, 6, 0].filter((d) => set.has(d)).map((d) => SHORT_DAYS[d]).join(', ');
}

/** 'Weekdays · 9:00 am, 1:00 pm' or 'Every day · any time'. */
export function scheduleLabel(s: RoutineSchedule): string {
	if (s.days.length === 0) return 'No days picked';
	return `${daysLabel(s.days)} · ${s.times.length ? s.times.map(formatTime).join(', ') : 'any time'}`;
}

/** Plays wanted on a scheduled day: one per time, or once when there are no times. */
export function dailyTarget(s: RoutineSchedule): number {
	return Math.max(1, s.times.length);
}

function weekdayOf(key: string): number {
	const [y, m, d] = key.split('-').map(Number);
	return new Date(y, m - 1, d).getDay();
}

function mondayOf(key: string): string {
	return addDays(key, -((weekdayOf(key) + 6) % 7));
}

/** Plays of a routine on one day. */
export function playsOn(r: Routine, key: string): number {
	return (r.completions ?? []).filter((d) => d === key).length;
}

/** Plays of a routine in the Monday-to-Sunday week containing `key`, up to that day. */
export function playsInWeek(r: Routine, key: string): number {
	const from = mondayOf(key);
	return (r.completions ?? []).filter((d) => d >= from && d <= key).length;
}

/** Progress for a routine card: today's scheduled plays, or a weekly goal. */
export function goalProgress(r: Routine, now: Date = new Date()): { done: number; target: number; period: string } | null {
	const today = todayKey(now);
	if (r.schedule?.days.includes(now.getDay())) {
		return { done: playsOn(r, today), target: dailyTarget(r.schedule), period: 'today' };
	}
	if (r.frequency?.per === 'week') {
		return { done: playsInWeek(r, today), target: r.frequency.times, period: 'this week' };
	}
	return null;
}

export interface ScheduledItem {
	routine: Routine;
	/** plays wanted that day */
	target: number;
	done: number;
	times: string[];
}

/** Routines scheduled on a date, earliest first time first, any-time ones last. */
export function scheduledOn(routines: Routine[], key: string): ScheduledItem[] {
	const weekday = weekdayOf(key);
	return routines
		.filter((r) => r.schedule?.days.includes(weekday))
		.map((r) => {
			const s = r.schedule as RoutineSchedule;
			return { routine: r, target: dailyTarget(s), done: playsOn(r, key), times: s.times };
		})
		.toSorted((a, b) => (a.times[0] ?? '99').localeCompare(b.times[0] ?? '99'));
}

export interface DueItem {
	routine: Routine;
	/** the slot this play is for, or null for any time today */
	time: string | null;
	/** due: its time has come; later: still ahead today; anytime: no set time */
	state: 'due' | 'later' | 'anytime';
	done: number;
	target: number;
	/** short reason, e.g. 'Due 9:00 am', 'At 1:00 pm', '1/3 this week' */
	why: string;
}

function nowHHMM(now: Date): string {
	return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * What's still to do today, one entry per routine at its next unplayed slot.
 * Order: slots whose time has come (earliest first), then any-time routines and
 * unmet weekly goals, then slots later today.
 */
export function dueToday(routines: Routine[], now: Date = new Date()): DueItem[] {
	const today = todayKey(now);
	const clock = nowHHMM(now);
	const items: DueItem[] = [];
	for (const it of scheduledOn(routines, today)) {
		if (it.done >= it.target) continue;
		const time = it.times[it.done] ?? null;
		if (time === null) {
			items.push({ routine: it.routine, time, state: 'anytime', done: it.done, target: it.target, why: 'Any time today' });
		} else {
			const due = time <= clock;
			items.push({
				routine: it.routine,
				time,
				state: due ? 'due' : 'later',
				done: it.done,
				target: it.target,
				why: `${due ? 'Due' : 'At'} ${formatTime(time)}`
			});
		}
	}
	for (const r of routines) {
		if (r.frequency?.per !== 'week' || r.schedule || items.some((i) => i.routine === r) || playsOn(r, today) > 0) continue;
		const done = playsInWeek(r, today);
		if (done < r.frequency.times) {
			items.push({ routine: r, time: null, state: 'anytime', done, target: r.frequency.times, why: `${done}/${r.frequency.times} this week` });
		}
	}
	const rank = { due: 0, anytime: 1, later: 2 };
	return items.toSorted((a, b) => rank[a.state] - rank[b.state] || (a.time ?? '').localeCompare(b.time ?? ''));
}

/** Evenly spread times between 9am and 5pm, used when migrating 'N× a day' goals. */
export function spreadTimes(count: number): string[] {
	if (count <= 1) return [];
	// Half-hour steps so up to 17 slots stay distinct.
	const slots = Array.from({ length: count }, (_, i) => Math.round(18 + (i * 16) / (count - 1)) * 30);
	return [...new Set(slots)].map((m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${m % 60 ? '30' : '00'}`);
}

/* ------------------------------ last week ------------------------------ */

export interface WeekReview {
	/** Monday of the reviewed week */
	from: string;
	scheduled: number;
	completed: number;
	/** days with any finished routine */
	activeDays: number;
	bestDay: string | null;
}

/** Scheduled plays done vs planned in the week before the one containing `now` (schedules as they are today). */
export function reviewLastWeek(routines: Routine[], completedDates: string[], now: Date = new Date()): WeekReview {
	const from = addDays(mondayOf(todayKey(now)), -7);
	let scheduled = 0;
	let completed = 0;
	let activeDays = 0;
	let bestDay: string | null = null;
	let bestPlays = 0;
	for (let i = 0; i < 7; i++) {
		const key = addDays(from, i);
		for (const it of scheduledOn(routines, key)) {
			if (it.routine.schedule?.since && key < it.routine.schedule.since) continue;
			scheduled += it.target;
			completed += Math.min(it.done, it.target);
		}
		if (completedDates.includes(key)) activeDays += 1;
		const plays = routines.reduce((n, r) => n + playsOn(r, key), 0);
		if (plays > bestPlays) {
			bestPlays = plays;
			bestDay = key;
		}
	}
	// Weekly goals count as scheduled plays too.
	for (const r of routines) {
		if (r.frequency?.per !== 'week' || r.schedule || (r.frequency.since && r.frequency.since > addDays(from, 6))) continue;
		scheduled += r.frequency.times;
		completed += Math.min(playsInWeek(r, addDays(from, 6)), r.frequency.times);
	}
	return { from, scheduled, completed, activeDays, bestDay };
}
