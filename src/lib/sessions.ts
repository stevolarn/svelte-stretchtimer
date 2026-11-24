import type { Routine, SessionEntry } from './types.ts';
import { addDays, todayKey } from './time.ts';

/** Monday of the week containing a 'YYYY-MM-DD' key. */
function mondayOf(key: string): string {
	const [y, m, d] = key.split('-').map(Number);
	const dow = (new Date(y, m - 1, d).getDay() + 6) % 7;
	return addDays(key, -dow);
}

/** Seconds played this week (from Monday), this month and ever. */
export function sessionTotals(sessions: SessionEntry[], now: Date = new Date()): { week: number; month: number; all: number } {
	const today = todayKey(now);
	const monday = mondayOf(today);
	const month = today.slice(0, 7);
	let week = 0;
	let monthSecs = 0;
	let all = 0;
	for (const s of sessions) {
		all += s.seconds;
		if (s.date >= monday && s.date <= today) week += s.seconds;
		if (s.date.startsWith(month)) monthSecs += s.seconds;
	}
	return { week, month: monthSecs, all };
}

/** '1 h 25 min', '25 min', '< 1 min' or '0 min'. */
export function formatDuration(seconds: number): string {
	const mins = Math.round(seconds / 60);
	if (mins === 0) return seconds > 0 ? '< 1 min' : '0 min';
	const h = Math.floor(mins / 60);
	const m = mins % 60;
	if (h === 0) return `${mins} min`;
	return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** The routine's last play: newest session time, else the newest completion date (as local midnight). 0 = never. */
export function lastPlayedAt(routine: Routine, sessions: SessionEntry[]): number {
	let best = 0;
	for (const s of sessions) if (s.routineId === routine.id && s.at > best) best = s.at;
	if (best) return best;
	const last = (routine.completions ?? []).reduce((a, b) => (b > a ? b : a), '');
	if (!last) return 0;
	const [y, m, d] = last.split('-').map(Number);
	return new Date(y, m - 1, d).getTime();
}

/** 'played today' / 'played yesterday' / 'played N days ago', or '' when never played. */
export function playedAgo(at: number, now: Date = new Date()): string {
	if (!at) return '';
	const days = Math.max(0, Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(new Date(at).getFullYear(), new Date(at).getMonth(), new Date(at).getDate()).getTime()) / 86_400_000));
	return days === 0 ? 'played today' : days === 1 ? 'played yesterday' : `played ${days} days ago`;
}

/** 'Tue 24 Nov · 9:15 am' */
export function sessionWhen(at: number): string {
	const d = new Date(at);
	const day = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
	const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' AM', ' am').replace(' PM', ' pm');
	return `${day.replace(',', '')} · ${time}`;
}
