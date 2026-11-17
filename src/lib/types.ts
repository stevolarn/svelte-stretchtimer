export type Side = 'left' | 'right';

export interface Stretch {
	id: string;
	name: string;
	description: string;
	/** one = single duration, two = left/right sides sharing this duration */
	sides: 'one' | 'two';
	durationSeconds: number;
	/** key into the IndexedDB photo store, null when no photo */
	photoId: string | null;
	/** key for stock illustration (e.g. 'cat-cow', 'childs-pose') */
	iconKey?: string;
}

export type MovementType =
	| 'all'
	| 'static'
	| 'dynamic'
	| 'isometrics'
	| 'calisthenics'
	| 'mobility'
	| 'yoga'
	| 'cardio';

export type MovementPosition = 'all' | 'standing' | 'seated' | 'floor';

export type BodyArea = 'all' | 'upper-body' | 'spine' | 'hips' | 'legs' | 'full-body';

export type StockCategory = BodyArea;

export interface StockStretch {
	id: string;
	name: string;
	type: 'static' | 'dynamic' | 'isometrics' | 'calisthenics' | 'mobility' | 'yoga' | 'cardio';
	position: 'standing' | 'seated' | 'floor';
	area: 'upper-body' | 'spine' | 'hips' | 'legs' | 'full-body';
	category?: 'upper-body' | 'spine' | 'hips' | 'legs' | 'full-body';
	description: string;
	sides: 'one' | 'two';
	defaultSeconds: number;
	iconKey: string;
}

export interface Routine {
	id: string;
	name: string;
	stretches: Stretch[];
	createdAt: number;
	breakSeconds?: number;
	/** how many times to play the full set; 1 (default) = once, no repeats */
	sets?: number;
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
	/** 1-based set number when the routine repeats */
	set?: number;
	totalSets?: number;
}
