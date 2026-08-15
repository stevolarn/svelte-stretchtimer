/** mm:ss formatting for a duration in seconds (may be fractional). */
export function formatSeconds(total: number): string {
	const s = Math.max(0, Math.round(total));
	const m = Math.floor(s / 60);
	const r = s % 60;
	return `${m}:${r.toString().padStart(2, '0')}`;
}

/** Local date as 'YYYY-MM-DD'. */
export function todayKey(now: Date = new Date()): string {
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, '0');
	const d = String(now.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

/** Add days to a 'YYYY-MM-DD' key (delta may be negative). */
export function addDays(key: string, delta: number): string {
	const [y, m, d] = key.split('-').map(Number);
	const dt = new Date(y, m - 1, d + delta);
	return todayKey(dt);
}

/** Short human label for a duration, e.g. 90 -> '1:30'. */
export function secondsLabel(seconds: number): string {
	return formatSeconds(seconds);
}
