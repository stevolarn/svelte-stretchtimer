export type Side = 'left' | 'right';

export interface Stretch {
	id: string;
	name: string;
	description: string;
	/** one = single duration, two = left/right sides sharing this duration */
	sides: 'one' | 'two';
	durationSeconds: number;
	/** Legacy fields retained so older local data and backups remain readable. */
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
	breakSeconds?: number;
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
	testingMode: boolean;
	playbackSpeed: number;
	autoBackupOnFinish: boolean;
}

export interface StorageSnapshot {
	id: string;
	timestamp: number;
	routineCount: number;
	streakDays: number;
	routines: Routine[];
	streak: StreakState;
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
