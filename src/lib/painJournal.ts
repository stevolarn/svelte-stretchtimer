import type { PainArea, PainEntry } from './types.ts';
import { PAIN_AREAS, entryAreaScore, entryAreas, painSpot, spotKey, tagLabel } from './painSpots.ts';
import { addDays } from './time.ts';

export type JournalRange = '30d' | '3m' | '1y' | 'all';
export type AreaFilter = PainArea | 'all';

export function rangeStart(range: JournalRange, today: string, log: PainEntry[]): string {
	if (range === '30d') return addDays(today, -29);
	if (range === '3m') return addDays(today, -89);
	if (range === '1y') return addDays(today, -364);
	let first = today;
	for (const e of log) if (e.date < first) first = e.date;
	return first;
}

export function filterEntries(log: PainEntry[], from: string, to: string, area: AreaFilter): PainEntry[] {
	return log.filter((e) => e.date >= from && e.date <= to && (area === 'all' || entryAreas(e).includes(area)));
}

/** Score an entry contributes for the filter: its area score, or its overall score for 'all'. */
function scoreFor(e: PainEntry, area: AreaFilter): number | null {
	return area === 'all' ? e.score : entryAreaScore(e, area);
}

export interface DailyPoint {
	key: string;
	max: number | null;
	count: number;
}

/** One point per day from..to inclusive (oldest first); max is null on days with no entries. */
export function dailyMax(entries: PainEntry[], from: string, to: string, area: AreaFilter): DailyPoint[] {
	const byDay = new Map<string, { max: number | null; count: number }>();
	for (const e of entries) {
		const s = scoreFor(e, area);
		const d = byDay.get(e.date) ?? { max: null, count: 0 };
		d.count++;
		if (s !== null) d.max = d.max === null ? s : Math.max(d.max, s);
		byDay.set(e.date, d);
	}
	const out: DailyPoint[] = [];
	for (let key = from; key <= to; key = addDays(key, 1)) {
		const d = byDay.get(key);
		out.push({ key, max: d?.max ?? null, count: d?.count ?? 0 });
	}
	return out;
}

/** Group daily points into buckets of `size` days; each bucket's max is the highest day in it. */
export function bucketed(daily: DailyPoint[], size: number): DailyPoint[] {
	if (size <= 1) return daily;
	const out: DailyPoint[] = [];
	for (let i = 0; i < daily.length; i += size) {
		const chunk = daily.slice(i, i + size);
		let max: number | null = null;
		let count = 0;
		for (const d of chunk) {
			count += d.count;
			if (d.max !== null) max = max === null ? d.max : Math.max(max, d.max);
		}
		out.push({ key: chunk[0].key, max, count });
	}
	return out;
}

/** Bucket size in days for a range spanning `days` days: daily up to 3 months, weekly to a year, else monthly. */
export function bucketSize(days: number): number {
	return days <= 92 ? 1 : days <= 370 ? 7 : 30;
}

export interface AreaTrend {
	area: PainArea;
	label: string;
	count: number;
	average: number;
	latest: number;
	/** second-half average minus first-half average (positive = worse); 0 with fewer than 2 entries */
	change: number;
	trend: 'better' | 'worse' | 'steady';
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function areaTrends(entries: PainEntry[]): AreaTrend[] {
	const sorted = [...entries].sort((a, b) => a.at - b.at);
	const out: AreaTrend[] = [];
	for (const { id, label } of PAIN_AREAS) {
		const scores: number[] = [];
		for (const e of sorted) {
			const s = entryAreaScore(e, id);
			if (s !== null && entryAreas(e).includes(id)) scores.push(s);
		}
		if (!scores.length) continue;
		const half = Math.floor(scores.length / 2);
		const change = half ? avg(scores.slice(scores.length - half)) - avg(scores.slice(0, half)) : 0;
		out.push({
			area: id,
			label,
			count: scores.length,
			average: avg(scores),
			latest: scores[scores.length - 1],
			change,
			trend: change <= -1 ? 'better' : change >= 1 ? 'worse' : 'steady'
		});
	}
	return out.sort((a, b) => b.count - a.count);
}

export interface SpotTotal {
	max: number;
	avg: number;
	count: number;
}

/** Per spot (key 'elbow-outer:left'): highest score, average and number of entries naming it. */
export function spotTotals(entries: PainEntry[]): Record<string, SpotTotal> {
	const acc: Record<string, number[]> = {};
	for (const e of entries) {
		for (const p of e.spots ?? []) {
			if (!painSpot(p.spot)) continue;
			(acc[spotKey(p.spot, p.side)] ??= []).push(p.score);
		}
	}
	const out: Record<string, SpotTotal> = {};
	for (const [k, v] of Object.entries(acc)) out[k] = { max: Math.max(...v), avg: avg(v), count: v.length };
	return out;
}

export interface TagCount {
	value: string;
	label: string;
	count: number;
}

export function topTags(entries: PainEntry[], field: 'causes' | 'helped', n: number): TagCount[] {
	const counts = new Map<string, number>();
	for (const e of entries) for (const v of new Set(e[field] ?? [])) counts.set(v, (counts.get(v) ?? 0) + 1);
	return [...counts]
		.map(([value, count]) => ({ value, label: tagLabel(value), count }))
		.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
		.slice(0, n);
}
