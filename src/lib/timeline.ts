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
 * between consecutive stretches. The whole set is repeated `routine.sets` times, with a break
 * between sets.
 */
export function buildTimeline(routine: Routine, settings: Settings): Segment[] {
	const totalSets = clampSeconds(routine.sets ?? 1, 1, 99);
	const breakSecs =
		routine.breakSeconds !== undefined
			? Math.max(0, Math.round(routine.breakSeconds))
			: Math.max(0, Math.round(settings.breakSeconds));
	const set = buildSet(routine, settings, breakSecs);
	if (totalSets === 1) return set;

	const segments: Segment[] = [];
	for (let n = 1; n <= totalSets; n++) {
		if (n > 1 && settings.breaksEnabled && breakSecs > 0 && set.length > 0) {
			segments.push({
				kind: 'break',
				stretch: null,
				side: null,
				seconds: breakSecs,
				label: 'Break',
				set: n,
				totalSets
			});
		}
		for (const seg of set) segments.push({ ...seg, set: n, totalSets });
	}
	return segments;
}

/** Seconds one side of a stretch lasts: holds use durationSeconds, reps use reps x seconds-per-rep. */
export function stretchSeconds(stretch: Routine['stretches'][number]): number {
	if (stretch.mode !== 'reps') return clampSeconds(stretch.durationSeconds);
	return clampReps(stretch.reps) * clampRepSeconds(stretch.repSeconds);
}

export function clampReps(value: number | undefined): number {
	return clampSeconds(value ?? 10, 1, 50);
}

export function clampRepSeconds(value: number | undefined): number {
	return clampSeconds(value ?? 3, 1, 20);
}

/** Sets of a single move (per-move sets, separate from routine.sets). */
export function clampMoveSets(value: number | undefined): number {
	return clampSeconds(value ?? 1, 1, 10);
}

function stretchSegment(stretch: Routine['stretches'][number], side: Segment['side'], moveSet = 1, moveSets = 1): Segment {
	const seg: Segment = {
		kind: 'stretch',
		stretch,
		side,
		seconds: stretchSeconds(stretch),
		label: stretch.name || 'Stretch'
	};
	if (moveSets > 1) {
		seg.moveSet = moveSet;
		seg.moveSets = moveSets;
	}
	if (stretch.mode === 'reps') {
		seg.reps = clampReps(stretch.reps);
		seg.repSeconds = clampRepSeconds(stretch.repSeconds);
	}
	return seg;
}

function buildSet(routine: Routine, settings: Settings, breakSecs: number): Segment[] {
	const segments: Segment[] = [];
	const last = routine.stretches.length - 1;

	const pushBreak = () => {
		if (settings.breaksEnabled && breakSecs > 0) {
			segments.push({ kind: 'break', stretch: null, side: null, seconds: breakSecs, label: 'Break' });
		}
	};

	routine.stretches.forEach((stretch, i) => {
		// Per-move sets run back to back (each side in turn), with a break between sets.
		const moveSets = clampMoveSets(stretch.sets);
		for (let n = 1; n <= moveSets; n++) {
			if (n > 1) pushBreak();
			if (stretch.sides === 'one') {
				segments.push(stretchSegment(stretch, null, n, moveSets));
			} else {
				segments.push(stretchSegment(stretch, 'left', n, moveSets));
				pushBreak();
				segments.push(stretchSegment(stretch, 'right', n, moveSets));
			}
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
	const time =
		stretch.mode === 'reps'
			? `${clampReps(stretch.reps)} reps · ${clampRepSeconds(stretch.repSeconds)}s`
			: durationText(stretch.durationSeconds);
	const sets = clampMoveSets(stretch.sets);
	const dose = sets > 1 ? `${sets} × ${time}` : time;
	return stretch.sides === 'one' ? dose : `${dose} each side`;
}

/** Compact duration: '45s' under a minute, otherwise '1:30'. */
export function durationText(seconds: number): string {
	const s = Math.max(0, Math.round(seconds));
	return s < 60 ? `${s}s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
