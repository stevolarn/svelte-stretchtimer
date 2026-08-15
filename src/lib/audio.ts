import type { Settings } from './types.ts';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (!ctx) {
		const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!AC) return null;
		ctx = new AC();
	}
	if (ctx.state === 'suspended') void ctx.resume();
	return ctx;
}

export interface BeepOptions {
	freq?: number;
	duration?: number;
	gain?: number;
	type?: OscillatorType;
	/** seconds from now to schedule the note */
	delay?: number;
}

/** Play a single short oscillator tone. Safe to call before any user gesture
 *  (it will simply be silent until the context can run). */
export function beep({ freq = 880, duration = 0.12, gain = 0.12, type = 'sine', delay = 0 }: BeepOptions = {}): void {
	const c = getCtx();
	if (!c) return;
	const t0 = c.currentTime + delay;
	const osc = c.createOscillator();
	const amp = c.createGain();
	osc.type = type;
	osc.frequency.value = freq;
	amp.gain.setValueAtTime(0.0001, t0);
	amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
	amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
	osc.connect(amp);
	amp.connect(c.destination);
	osc.start(t0);
	osc.stop(t0 + duration + 0.05);
}

/** Stretch start cue. */
export function beepStart(): void {
	beep({ freq: 880, duration: 0.16, type: 'sine' });
}

/** Side switch cue (Left -> Right). */
export function beepSideSwitch(): void {
	beep({ freq: 660, duration: 0.14, type: 'sine' });
	beep({ freq: 990, duration: 0.14, type: 'sine', delay: 0.16 });
}

/** Last-3-seconds tick; the final second is pitched higher. */
export function beepTick(secondsLeft: number): void {
	beep({ freq: secondsLeft <= 1 ? 1245 : 880, duration: 0.07, type: 'square', gain: 0.07 });
}

/** Routine finish fanfare. */
export function beepFinish(): void {
	beep({ freq: 523.25, duration: 0.16, type: 'sine' });
	beep({ freq: 659.25, duration: 0.16, type: 'sine', delay: 0.18 });
	beep({ freq: 783.99, duration: 0.16, type: 'sine', delay: 0.36 });
	beep({ freq: 1046.5, duration: 0.5, type: 'sine', delay: 0.54 });
}

/** Play a named cue directly (used by Settings "test" buttons). */
export function playCue(kind: 'start' | 'side' | 'tick' | 'finish'): void {
	if (kind === 'start') beepStart();
	else if (kind === 'side') beepSideSwitch();
	else if (kind === 'tick') beepTick(3);
	else beepFinish();
}
