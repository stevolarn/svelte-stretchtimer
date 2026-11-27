import type { Routine, Segment, Settings } from './types.ts';
import { beepFinish, beepMetronome, beepRep, beepSideSwitch, beepStart, beepTick, speak, stopSpeaking, vibrate } from './audio.ts';
import { buildTimeline } from './timeline.ts';
import { creditToday, logSession, recordCompletion } from './stores.svelte.ts';
import { formatSeconds } from './time.ts';
import { autoSaveToFileHandle, isFileAutoBackupConnected } from './backup.ts';

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
	/** reps segments: the rep currently in progress (1-based); 0 on holds and breaks */
	rep: number;
	speed: number;
	/** seconds actually played (skips don't add to it), in routine time */
	played: number;
	/** ended early but counted */
	partial: boolean;
}

export const player = $state<PlayerUiState>({
	status: 'idle',
	routineId: null,
	routineName: '',
	segments: [],
	index: 0,
	remaining: 0,
	elapsed: 0,
	rep: 0,
	speed: 1,
	played: 0,
	partial: false
});

/* ------------------------- engine internals ------------------------- */

let timer: ReturnType<typeof setInterval> | null = null;
let endAt = 0;
let lastTick = 0;
/** last rep announced on the current reps segment (0 when not a reps segment) */
let lastRep = 0;
/** last half-rep (0 = first lift, 1 = first lower, ...) the metronome clicked on */
let lastHalf = 0;
let finished = false;
let gentleRun = false;
/** wall-clock time of the last tick while running, for counting played time */
let lastNow = 0;
let settingsSnapshot: Settings | null = null;
/** Planned segment lengths, so restart drops any +15s extensions. */
let baseSeconds: number[] = [];

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
		const paused = player.status === 'paused' ? 'Paused · ' : '';
		const rep = seg.reps ? `Rep ${player.rep}/${seg.reps} · ` : '';
		document.title = `${paused}${formatSeconds(player.remaining)} ${side ? side + ' · ' : ''}${rep}${seg.label} · ${player.routineName}`;
	} else {
		restoreTitle();
	}
}

/** Back to the player page's own title (svelte:head won't rewrite it while its value is unchanged). */
function restoreTitle(): void {
	if (typeof document === 'undefined') return;
	document.title = `${player.routineName || 'Routine'} · Stretch Timer`;
}

function enterSegment(index: number, settings: Settings): void {
	player.index = index;
	const seg = player.segments[index];
	player.remaining = seg.seconds;
	player.elapsed = 0;
	lastTick = 0;
	// Reps segments open on rep 1 (the start beep already marks it).
	player.rep = seg.reps ? 1 : 0;
	lastRep = player.rep;
	lastHalf = 0;
	const speed = player.speed || settings.playbackSpeed || 1;
	endAt = Date.now() + (seg.seconds / speed) * 1000;

	// Audible cues on segment entry.
	if (seg.kind === 'stretch' && seg.side === 'right') {
		if (settings.beepSideSwitch) beepSideSwitch();
	} else if (seg.kind === 'stretch') {
		if (settings.beepStart) beepStart();
	}
	// Without a start/side beep, the metronome marks rep 1 itself.
	if (seg.reps && settings.metronome && !(seg.side === 'right' ? settings.beepSideSwitch : settings.beepStart)) beepMetronome(true);
	if (settings.voiceCues) speak(spokenCue(seg));
	if (settings.vibrate) vibrate(seg.kind === 'break' ? 60 : [80, 60, 80]);
	updateTitle();
}

/** What the voice says as a segment starts. */
function spokenCue(seg: Segment): string {
	if (seg.intro) return 'Get ready';
	if (seg.kind === 'break') return 'Rest';
	if (seg.side === 'right') return 'Switch sides';
	const name = seg.stretch?.name ?? seg.label;
	const side = seg.side === 'left' ? ', left side' : '';
	return seg.reps ? `${name}${side}, ${seg.reps} reps` : `${name}${side}`;
}

/** The rep in progress (1-based) after `elapsed` seconds of a reps segment. */
function repAt(seg: Segment, elapsed: number): number {
	if (!seg.reps || !seg.repSeconds) return 0;
	return Math.min(seg.reps, Math.floor(elapsed / seg.repSeconds) + 1);
}

/** Half-reps completed after `elapsed` seconds: even = lifting phase of a rep, odd = lowering. */
function halfAt(seg: Segment, elapsed: number): number {
	if (!seg.reps || !seg.repSeconds) return 0;
	return Math.min(seg.reps * 2 - 1, Math.floor(elapsed / (seg.repSeconds / 2)));
}

function tick(): void {
	const now = Date.now();
	const speed = player.speed || settingsSnapshot?.playbackSpeed || 1;
	const remainingRealMs = Math.max(0, endAt - now);
	if (lastNow) player.played += ((Math.min(now, endAt) - lastNow) / 1000) * speed;
	lastNow = now;
	player.remaining = (remainingRealMs / 1000) * speed;
	player.elapsed = Math.max(0, player.segments[player.index].seconds - player.remaining);

	// Rep counter: tick softly as each new rep begins (rep 1 is covered by the start beep).
	const seg = player.segments[player.index];
	if (seg.reps && seg.repSeconds) {
		const rep = repAt(seg, player.elapsed);
		if (rep !== lastRep) {
			const advanced = rep > lastRep;
			lastRep = rep;
			player.rep = rep;
			// With the metronome on, its accented click marks the rep start instead.
			if (advanced && rep > 1 && settingsSnapshot?.beepReps && !settingsSnapshot?.metronome) beepRep();
			if (advanced && rep % 5 === 0 && settingsSnapshot?.voiceCues) speak(String(rep));
		}
		// Metronome: click at each rep start (rep 1 is covered by the start beep) and a lower click at the turnaround.
		const half = halfAt(seg, player.elapsed);
		if (half !== lastHalf) {
			const advanced = half > lastHalf;
			lastHalf = half;
			if (advanced && settingsSnapshot?.metronome) beepMetronome(half % 2 === 0);
		}
	}

	// Last-3-seconds countdown ticks (holds and breaks; reps segments have their own rep ticks).
	const ceil = Math.ceil(player.remaining);
	if (!seg.reps && settingsSnapshot && ceil <= 3 && ceil >= 1 && ceil !== lastTick && player.remaining > 0) {
		lastTick = ceil;
		if (settingsSnapshot.beepCountdown) beepTick(ceil);
	}

	if (remainingRealMs <= 0) {
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

function finish(settings: Settings, partial = false): void {
	clearTimer();
	player.status = 'finished';
	player.partial = partial;
	if (!partial) {
		player.remaining = 0;
		player.elapsed = player.segments[player.index]?.seconds ?? 0;
	}
	if (settings.beepFinish) beepFinish();
	if (settings.voiceCues) speak('All done');
	if (settings.vibrate) vibrate([100, 60, 100, 60, 200]);
	if (!finished) {
		finished = true;
		if (player.routineId && Math.round(player.played) > 0) {
			logSession({
				routineId: player.routineId,
				name: player.routineName || 'Routine',
				seconds: Math.round(player.played),
				gentle: gentleRun || undefined,
				partial: partial || undefined
			});
		}
		if (player.routineId) recordCompletion(player.routineId);
		creditToday();
		if (settings.autoBackupOnFinish && isFileAutoBackupConnected()) {
			void autoSaveToFileHandle().catch(() => {});
		}
	}
}

function startTimer(): void {
	if (timer !== null) clearInterval(timer);
	lastNow = Date.now();
	timer = setInterval(tick, 100);
}

/* ----------------------------- public API ----------------------------- */

/** Begin playback of a routine (call from a user-gesture handler so the
 *  AudioContext is allowed to run). */
export function startPlayer(routine: Routine, currentSettings: Settings, gentle = false): void {
	gentleRun = gentle;
	clearTimer();
	settingsSnapshot = { ...currentSettings };
	player.speed = currentSettings.playbackSpeed || 1;
	finished = false;
	player.played = 0;
	player.partial = false;
	const segments = buildTimeline(routine, currentSettings);
	player.status = segments.length > 0 ? 'running' : 'idle';
	player.routineId = routine.id;
	player.routineName = routine.name;
	player.segments = segments;
	baseSeconds = segments.map((seg) => seg.seconds);
	if (segments.length === 0) return;
	enterSegment(0, currentSettings);
	startTimer();
}

export function setPlaybackSpeed(speed: number): void {
	player.speed = speed;
	if (player.status === 'running') {
		endAt = Date.now() + (player.remaining / speed) * 1000;
	}
}

export function togglePause(): void {
	const speed = player.speed || settingsSnapshot?.playbackSpeed || 1;
	if (player.status === 'running') {
		player.remaining = Math.max(0, ((endAt - Date.now()) / 1000) * speed);
		player.status = 'paused';
		clearTimer();
		stopSpeaking();
		updateTitle();
	} else if (player.status === 'paused') {
		player.status = 'running';
		endAt = Date.now() + (player.remaining / speed) * 1000;
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

/** Add time to the current hold or rest (not reps, whose length is set by the tempo). */
export function extend(seconds: number): void {
	const seg = player.segments[player.index];
	if (!seg || seg.reps || (player.status !== 'running' && player.status !== 'paused')) return;
	const speed = player.speed || settingsSnapshot?.playbackSpeed || 1;
	seg.seconds += seconds;
	player.remaining += seconds;
	if (player.status === 'running') endAt += (seconds / speed) * 1000;
	lastTick = 0;
}

/** End now but count it as done, like reaching the end. */
export function finishEarly(): void {
	if (settingsSnapshot && (player.status === 'running' || player.status === 'paused')) finish(settingsSnapshot, true);
}

/** Testing Mode Helper: Jump current segment remaining time directly to 3s to test countdown ticks. */
export function jumpToCountdown(seconds = 3): void {
	if (player.status === 'idle' || player.status === 'finished') return;
	const speed = player.speed || settingsSnapshot?.playbackSpeed || 1;
	player.remaining = seconds;
	endAt = Date.now() + (seconds / speed) * 1000;
	lastTick = 0;
	// Re-sync the rep counter to the new position silently (no tick for the jump itself).
	const seg = player.segments[player.index];
	if (seg?.reps) {
		player.elapsed = Math.max(0, seg.seconds - seconds);
		player.rep = repAt(seg, player.elapsed);
		lastRep = player.rep;
		lastHalf = halfAt(seg, player.elapsed);
	}
	if (player.status === 'paused') {
		player.status = 'running';
		startTimer();
	}
	updateTitle();
}

/** Testing Mode Helper: Instant complete entire routine. */
export function instantComplete(): void {
	if (settingsSnapshot) {
		finish(settingsSnapshot);
	}
}

/** Restart the routine from the first segment (keeps playing). */
export function restart(): void {
	const settings = settingsSnapshot;
	if (!settings || player.segments.length === 0) return;
	finished = false;
	player.played = 0;
	player.partial = false;
	player.segments.forEach((seg, i) => (seg.seconds = baseSeconds[i] ?? seg.seconds));
	enterSegment(0, settings);
	player.status = 'running';
	startTimer();
}

/** Stop playback and return to idle (also used when leaving the player). */
export function stopPlayer(): void {
	clearTimer();
	stopSpeaking();
	player.status = 'idle';
	player.routineId = null;
	player.routineName = '';
	player.segments = [];
	player.index = 0;
	player.remaining = 0;
	player.elapsed = 0;
	player.rep = 0;
	lastRep = 0;
	lastHalf = 0;
	player.speed = 1;
	player.played = 0;
	player.partial = false;
	settingsSnapshot = null;
}

/** Convenience: current segment or null. */
export function currentSegment(): Segment | null {
	return player.segments[player.index] ?? null;
}
