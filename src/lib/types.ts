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
	| 'eccentrics'
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
	type: 'static' | 'dynamic' | 'isometrics' | 'eccentrics' | 'calisthenics' | 'mobility' | 'yoga' | 'cardio';
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
	/** fixed weekdays (and optional times) to do this routine */
	schedule?: RoutineSchedule;
	/** flexible goal: N plays a week on any days ('day' is migrated into schedule on load) */
	frequency?: RoutineFrequency;
	/** 'YYYY-MM-DD' for each finished play, one entry per play, last four weeks only */
	completions?: string[];
	/** if-then habit cue: the existing habit this routine follows, e.g. 'pour my morning coffee' */
	cue?: string;
	/** 'YYYY-MM-DD' the last "ready to progress?" prompt was answered, so it waits a fortnight */
	progressAnswered?: string;
}

export interface RoutineSchedule {
	/** Date.getDay() values: 0 = Sunday */
	days: number[];
	/** 'HH:MM' local times, sorted; empty = once, any time of day */
	times: string[];
	/** 'YYYY-MM-DD' the schedule was set up, so reviews skip days before it */
	since?: string;
}

export interface RoutineFrequency {
	per: 'day' | 'week';
	times: number;
	/** 'YYYY-MM-DD' the goal was set, so reviews skip weeks before it */
	since?: string;
}

export interface PainEntry {
	/** 'YYYY-MM-DD' */
	date: string;
	/** 0 = no pain, 10 = worst */
	score: number;
	routineId: string | null;
	at: number;
	/** logged after the gentle version, so it doesn't count toward progressing */
	gentle?: boolean;
}

/** Next-morning check after a session (pain-monitoring model): how it compares with before. */
export interface MorningCheck {
	/** 'YYYY-MM-DD' of the morning */
	date: string;
	verdict: 'better' | 'same' | 'worse';
	at: number;
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
	/** daily Android reminder via Periodic Background Sync */
	reminderEnabled: boolean;
	/** earliest hour of the day (0-23) to remind */
	reminderHour: number;
	/** legacy one-routine-per-weekday plan (Sunday first); moved into routine schedules on load */
	weekPlan?: (string | null)[];
	/** Monday of the week whose review card was dismissed */
	reviewDismissed?: string;
	/** Monday of the week whose rising-pain card was dismissed */
	trendDismissed?: string;
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
