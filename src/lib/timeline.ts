import type { Routine, Segment, Settings } from './types.ts';

/** Clamp a duration to a sane positive value. */
export function clampSeconds(value: number, min = 1, max = 3600): number {
	if (!Number.isFinite(value)) return min;
	return Math.min(max, Math.max(min, Math.round(value)));
}

/**
 * Build the playable timeline from a routine + settings:
 * one-sided stretches become a single segment, two-sided stretches become
 * Left then Right segments using the same shared duration, and (when enabled) a fixed break is inserted
 * between consecutive stretches.
 */
export function buildTimeline(routine: Routine, settings: Settings): Segment[] {
	const segments: Segment[] = [];
	const last = routine.stretches.length - 1;
	const breakSecs =
		routine.breakSeconds !== undefined
			? Math.max(0, Math.round(routine.breakSeconds))
			: Math.max(0, Math.round(settings.breakSeconds));

	routine.stretches.forEach((stretch, i) => {
		if (stretch.sides === 'one') {
			segments.push({
				kind: 'stretch',
				stretch,
				side: null,
				seconds: clampSeconds(stretch.durationSeconds),
				label: stretch.name || 'Stretch'
			});
		} else {
			segments.push({
				kind: 'stretch',
				stretch,
				side: 'left',
				seconds: clampSeconds(stretch.durationSeconds),
				label: stretch.name || 'Stretch'
			});
			if (settings.breaksEnabled && breakSecs > 0) {
				segments.push({
					kind: 'break',
					stretch: null,
					side: null,
					seconds: breakSecs,
					label: 'Break'
				});
			}
			segments.push({
				kind: 'stretch',
				stretch,
				side: 'right',
				seconds: clampSeconds(stretch.durationSeconds),
				label: stretch.name || 'Stretch'
			});
		}
		if (settings.breaksEnabled && i < last && breakSecs > 0) {
			segments.push({
				kind: 'break',
				stretch: null,
				side: null,
				seconds: breakSecs,
				label: 'Break'
			});
		}
	});
	return segments;
}

export function timelineTotal(segments: Segment[]): number {
	return segments.reduce((sum, s) => sum + s.seconds, 0);
}

/** Short summary of a stretch's duration, e.g. "45s" or "L/R 30s". */
export function stretchDurationLabel(stretch: Routine['stretches'][number]): string {
	if (stretch.sides === 'one') return `${stretch.durationSeconds}s`;
	return `L/R ${stretch.durationSeconds}s`;
}
