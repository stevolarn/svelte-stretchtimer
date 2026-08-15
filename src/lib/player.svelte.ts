import type { Routine, Segment, Settings } from './types.ts';
import { beepFinish, beepSideSwitch, beepStart, beepTick } from './audio.ts';
import { buildTimeline } from './timeline.ts';
import { creditToday } from './stores.svelte.ts';
import { formatSeconds } from './time.ts';

export interface PlayerUiState {
	status: 'idle' | 'running' | 'paused' | 'finished';
	routineId: string | null;
	routineName: string;
	segments: Segment[];
	index: number;
	/** seconds remaining in the current segment (fractional) */
	remaining: number;
	/** seconds elapsed in the current segment */
	elapsed: number;
}

export const player = $state<PlayerUiState>({
	status: 'idle',
	routineId: null,
	routineName: '',
	segments: [],
	index: 0,
	remaining: 0,
	elapsed: 0
});

/* ------------------------- engine internals ------------------------- */

let timer: ReturnType<typeof setInterval> | null = null;
let endAt = 0;
let lastTick = 0;
let finished = false;
let settingsSnapshot: Settings | null = null;
const originalTitle = typeof document !== 'undefined' ? document.title : '';

function clearTimer(): void {
	if (timer !== null) {
		clearInterval(timer);
		timer = null;
	}
	restoreTitle();
}

function updateTitle(): void {
	const seg = player.segments[player.index];
	if (seg && (player.status === 'running' || player.status === 'paused')) {
		const side = seg.side === 'left' ? 'L' : seg.side === 'right' ? 'R' : '';
		document.title = `${formatSeconds(player.remaining)} ${side ? side + ' · ' : ''}${seg.label} · ${player.routineName}`;
	} else {
		restoreTitle();
	}
}

function restoreTitle(): void {
	if (document.title !== originalTitle) document.title = originalTitle;
}

function enterSegment(index: number, settings: Settings): void {
	player.index = index;
	const seg = player.segments[index];
	player.remaining = seg.seconds;
	player.elapsed = 0;
	lastTick = 0;
	endAt = Date.now() + seg.seconds * 1000;

	// Audible cues on segment entry.
	if (seg.kind === 'stretch' && seg.side === 'right') {
		if (settings.beepSideSwitch) beepSideSwitch();
	} else if (seg.kind === 'stretch') {
		if (settings.beepStart) beepStart();
	}
	updateTitle();
}

function tick(): void {
	const now = Date.now();
	const remainingMs = Math.max(0, endAt - now);
	player.remaining = remainingMs / 1000;
	player.elapsed = Math.max(0, player.segments[player.index].seconds - player.remaining);

	// Last-3-seconds countdown ticks (each stretch and break).
	const ceil = Math.ceil(player.remaining);
	if (settingsSnapshot && ceil <= 3 && ceil >= 1 && ceil !== lastTick && player.remaining > 0) {
		lastTick = ceil;
		if (settingsSnapshot.beepCountdown) beepTick(ceil);
	}

	if (remainingMs <= 0) {
		advance();
		return;
	}
	updateTitle();
}

function advance(): void {
	const settings = settingsSnapshot;
	if (!settings) return;
	if (player.index < player.segments.length - 1) {
		enterSegment(player.index + 1, settings);
	} else {
		finish(settings);
	}
}

function finish(settings: Settings): void {
	clearTimer();
	player.status = 'finished';
	player.remaining = 0;
	player.elapsed = player.segments[player.index]?.seconds ?? 0;
	if (settings.beepFinish) beepFinish();
	if (!finished) {
		finished = true;
		creditToday();
	}
}

function startTimer(): void {
	if (timer !== null) clearInterval(timer);
	timer = setInterval(tick, 200);
}

/* ----------------------------- public API ----------------------------- */

/** Begin playback of a routine (call from a user-gesture handler so the
 *  AudioContext is allowed to run). */
export function startPlayer(routine: Routine, currentSettings: Settings): void {
	clearTimer();
	settingsSnapshot = { ...currentSettings };
	finished = false;
	const segments = buildTimeline(routine, currentSettings);
	player.status = segments.length > 0 ? 'running' : 'idle';
	player.routineId = routine.id;
	player.routineName = routine.name;
	player.segments = segments;
	if (segments.length === 0) return;
	enterSegment(0, currentSettings);
	startTimer();
}

export function togglePause(): void {
	if (player.status === 'running') {
		player.remaining = Math.max(0, (endAt - Date.now()) / 1000);
		player.status = 'paused';
		clearTimer();
	} else if (player.status === 'paused') {
		player.status = 'running';
		endAt = Date.now() + player.remaining * 1000;
		lastTick = 0;
		startTimer();
		updateTitle();
	}
}

/** Back to the previous segment; at the first segment, restart it. */
export function back(): void {
	const settings = settingsSnapshot;
	if (!settings || player.segments.length === 0) return;
	if (player.index > 0) {
		enterSegment(player.index - 1, settings);
	} else {
		enterSegment(0, settings);
	}
	if (player.status !== 'running') {
		player.status = 'running';
		startTimer();
	}
}

/** Skip to the next segment; on the last segment, finish. */
export function skip(): void {
	const settings = settingsSnapshot;
	if (!settings || player.segments.length === 0) return;
	if (player.index < player.segments.length - 1) {
		enterSegment(player.index + 1, settings);
	} else {
		finish(settings);
	}
}

/** Jump directly to a segment from the in-player routine map. */
export function jumpTo(index: number): void {
	const settings = settingsSnapshot;
	if (!settings || player.status === 'idle' || index < 0 || index >= player.segments.length) return;
	enterSegment(index, settings);
	if (player.status === 'finished') player.status = 'running';
	if (player.status === 'running') {
		startTimer();
		updateTitle();
	}
}

/** Restart the routine from the first segment (keeps playing). */
export function restart(): void {
	const settings = settingsSnapshot;
	if (!settings || player.segments.length === 0) return;
	enterSegment(0, settings);
	player.status = 'running';
	startTimer();
}

/** Stop playback and return to idle (also used when leaving the player). */
export function stopPlayer(): void {
	clearTimer();
	player.status = 'idle';
	player.routineId = null;
	player.routineName = '';
	player.segments = [];
	player.index = 0;
	player.remaining = 0;
	player.elapsed = 0;
	settingsSnapshot = null;
}

/** Convenience: current segment or null. */
export function currentSegment(): Segment | null {
	return player.segments[player.index] ?? null;
}
