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
/** Overall loudness multiplier for every cue. */
const VOLUME = 1.35;

export function beep({ freq = 880, duration = 0.12, gain = 0.12, type = 'sine', delay = 0 }: BeepOptions = {}): void {
	const c = getCtx();
	if (!c) return;
	const t0 = c.currentTime + delay;
	const osc = c.createOscillator();
	const amp = c.createGain();
	osc.type = type;
	osc.frequency.value = freq;
	amp.gain.setValueAtTime(0.0001, t0);
	amp.gain.exponentialRampToValueAtTime(Math.min(1, gain * VOLUME), t0 + 0.01);
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

/** Quiet rep-boundary tick: softer and lower than the countdown tick. */
export function beepRep(): void {
	beep({ freq: 520, duration: 0.05, type: 'sine', gain: 0.05 });
}

/** Metronome click: an accented click as a rep starts, a lower one at the turnaround. */
export function beepMetronome(accent: boolean): void {
	beep({ freq: accent ? 1320 : 740, duration: 0.03, type: 'triangle', gain: accent ? 0.09 : 0.07 });
}

/** Routine finish fanfare. */
export function beepFinish(): void {
	beep({ freq: 523.25, duration: 0.16, type: 'sine' });
	beep({ freq: 659.25, duration: 0.16, type: 'sine', delay: 0.18 });
	beep({ freq: 783.99, duration: 0.16, type: 'sine', delay: 0.36 });
	beep({ freq: 1046.5, duration: 0.5, type: 'sine', delay: 0.54 });
}

/** Say a short cue aloud, cutting off anything still being said. */
export function speak(text: string): void {
	if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
	window.speechSynthesis.cancel();
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.rate = 1.05;
	window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
	if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}

/** Buzz on phones that support it (ignored elsewhere, including iOS Safari). */
export function vibrate(pattern: number | number[]): void {
	if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
}

/** Play a named cue directly (used by Settings "test" buttons). */
export function playCue(kind: 'start' | 'side' | 'tick' | 'rep' | 'metronome' | 'finish'): void {
	if (kind === 'start') beepStart();
	else if (kind === 'side') beepSideSwitch();
	else if (kind === 'tick') beepTick(3);
	else if (kind === 'rep') beepRep();
	else if (kind === 'metronome') {
		beepMetronome(true);
		setTimeout(() => beepMetronome(false), 600);
	}
	else beepFinish();
}
