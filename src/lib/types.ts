export type Side = 'left' | 'right';

export interface Stretch {
	id: string;
	name: string;
	description: string;
	/** one = single duration, two = left/right sides with independent durations */
	sides: 'one' | 'two';
	durationSeconds: number;
	leftSeconds: number;
	rightSeconds: number;
	/** key into the IndexedDB photo store, null when no photo */
	photoId: string | null;
}

export interface Routine {
	id: string;
	name: string;
	stretches: Stretch[];
	createdAt: number;
}

export type Theme = 'light' | 'dark' | 'system';

export interface Settings {
	theme: Theme;
	beepStart: boolean;
	beepSideSwitch: boolean;
	beepCountdown: boolean;
	beepFinish: boolean;
	breaksEnabled: boolean;
	breakSeconds: number;
}

export interface StreakState {
	/** completed routine days as 'YYYY-MM-DD', sorted ascending */
	completedDates: string[];
	/** streak fixers already spent on repairs */
	fixersUsed: number;
}

export type SegmentKind = 'stretch' | 'break';

export interface Segment {
	kind: SegmentKind;
	stretch: Stretch | null;
	side: Side | null;
	seconds: number;
	label: string;
}
