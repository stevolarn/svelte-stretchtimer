import type { Routine, Settings } from './types.ts';
import { buildTimeline, timelineTotal } from './timeline.ts';
import { addDays, todayKey } from './time.ts';

const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/** Whole minutes the routine takes, at least five so calendars show a usable block. */
function minutesFor(r: Routine, settings: Settings): number {
	return Math.max(5, Math.ceil(timelineTotal(buildTimeline(r, settings)) / 60));
}

/** First date on or after today that falls on one of the days, as 'YYYY-MM-DD'. */
function firstDate(days: number[]): string {
	const today = todayKey();
	for (let i = 0; i < 7; i++) {
		const key = addDays(today, i);
		const [y, m, d] = key.split('-').map(Number);
		if (days.includes(new Date(y, m - 1, d).getDay())) return key;
	}
	return today;
}

/** Floating local date-time, e.g. '20261123T090000'. */
function stamp(key: string, hhmm: string, plusMinutes = 0): string {
	const [y, m, d] = key.split('-').map(Number);
	const [h, min] = hhmm.split(':').map(Number);
	const t = new Date(y, m - 1, d, h, min + plusMinutes);
	const p = (n: number) => String(n).padStart(2, '0');
	return `${t.getFullYear()}${p(t.getMonth() + 1)}${p(t.getDate())}T${p(t.getHours())}${p(t.getMinutes())}00`;
}

function rrule(days: number[]): string {
	return `RRULE:FREQ=WEEKLY;BYDAY=${days.map((d) => BYDAY[d]).join(',')}`;
}

function playUrl(r: Routine, origin: string): string {
	return `${origin}/player/${r.id}`;
}

/** A Google Calendar "add event" link for one of a routine's times, repeating on its days. */
export function googleCalendarUrl(r: Routine, time: string, settings: Settings, origin: string): string {
	const days = r.schedule?.days ?? [];
	const start = firstDate(days);
	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: `Stretch: ${r.name || 'Routine'}`,
		dates: `${stamp(start, time)}/${stamp(start, time, minutesFor(r, settings))}`,
		details: `Start the routine: ${playUrl(r, origin)}`,
		recur: rrule(days)
	});
	return `https://calendar.google.com/calendar/render?${params}`;
}

function escapeText(text: string): string {
	return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Fold long content lines at 74 characters, as RFC 5545 asks. */
function fold(line: string): string {
	const parts = [line.slice(0, 74)];
	for (let i = 74; i < line.length; i += 73) parts.push(line.slice(i, i + 73));
	return parts.join('\r\n ');
}

/** An .ics calendar with a weekly repeating event and alarm for every scheduled time. */
export function scheduleIcs(routines: Routine[], settings: Settings, origin: string): { ics: string; events: number } {
	const now = `${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`;
	const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Stretch Timer//Schedule//EN', 'CALSCALE:GREGORIAN'];
	let events = 0;
	for (const r of routines) {
		const s = r.schedule;
		if (!s || s.days.length === 0) continue;
		const start = firstDate(s.days);
		for (const time of s.times) {
			events += 1;
			lines.push(
				'BEGIN:VEVENT',
				`UID:${r.id}-${time.replace(':', '')}@stretch-timer`,
				`DTSTAMP:${now}`,
				`DTSTART:${stamp(start, time)}`,
				`DTEND:${stamp(start, time, minutesFor(r, settings))}`,
				rrule(s.days),
				`SUMMARY:${escapeText(`Stretch: ${r.name || 'Routine'}`)}`,
				`DESCRIPTION:${escapeText(`Start the routine: ${playUrl(r, origin)}`)}`,
				`URL:${playUrl(r, origin)}`,
				'BEGIN:VALARM',
				'ACTION:DISPLAY',
				`DESCRIPTION:${escapeText(`Time for ${r.name || 'your routine'}`)}`,
				'TRIGGER:PT0M',
				'END:VALARM',
				'END:VEVENT'
			);
		}
	}
	lines.push('END:VCALENDAR');
	return { ics: lines.map(fold).join('\r\n'), events };
}
