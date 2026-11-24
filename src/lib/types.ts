export type Side = 'left' | 'right';

export interface Stretch {
	id: string;
	name: string;
	description: string;
	/** one = single duration, two = left/right sides sharing this duration */
	sides: 'one' | 'two';
	durationSeconds: number;
	/** 'hold' (timed, the default when undefined) or 'reps' (count reps at a tempo) */
	mode?: 'hold' | 'reps';
	/** reps mode: number of reps (1-50) */
	reps?: number;
	/** reps mode: seconds per rep, i.e. tempo (1-20) */
	repSeconds?: number;
	/** reps mode: free-text load, e.g. 'red band' or '1 kg' */
	load?: string;
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
	/** rep-based move: default rep count (defaultSeconds is kept as a fallback) */
	defaultReps?: number;
	/** rep-based move: seconds per rep */
	repSeconds?: number;
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
	/** the if-then plan B for a busy or sore day: a 2-minute micro-break (the default) or the gentle version */
	fallback?: 'micro' | 'gentle';
	/** 'YYYY-MM-DD' the last "ready to progress?" prompt was answered, so it waits a fortnight */
	progressAnswered?: string;
	/** 'YYYY-MM-DD' the last "ease off?" prompt was answered (eased or dismissed), so it waits a week */
	easeAnswered?: string;
	/** dose changes made from the progress and ease prompts, oldest first, last ten only */
	history?: RoutineChange[];
}

export interface RoutineChange {
	/** 'YYYY-MM-DD' */
	date: string;
	/** 'progress' = longer holds / more reps, 'set' = an extra set, 'ease' = lighter */
	kind: 'progress' | 'set' | 'ease';
	note: string;
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
	/** where it hurts; missing on entries logged before areas existed */
	areas?: PainArea[];
}

export type PainArea = 'wrist-hand' | 'thumb' | 'forearm-elbow' | 'neck' | 'shoulder' | 'upper-back';

/**
 * Patient-Specific Functional Scale check-in: up to three activities the user finds hard,
 * each rated 0 (can't do it) to 10 (as well as before the problem).
 */
export interface FunctionCheck {
	/** 'YYYY-MM-DD' */
	date: string;
	at: number;
	items: { activity: string; score: number }[];
	/** answered yes to the red-flag question (new or spreading numbness, weakness, dropping things) */
	flag?: boolean;
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
	/** soft tick at each rep boundary on rep-based exercises */
	beepReps: boolean;
	/** rep metronome: a click as each rep starts and a lower click at the turnaround (halfway); off by default */
	metronome: boolean;
	beepFinish: boolean;
	/** spoken cues (move name, switch sides, rest, every fifth rep); off by default */
	voiceCues: boolean;
	/** short vibration as each move, side or rest starts; off by default */
	vibrate: boolean;
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
	/** 'YYYY-MM-DD' the "worth getting checked" card was dismissed; it stays quiet for four weeks */
	notImprovingDismissed?: string;
	/** 'YYYY-MM-DD' the task check-in card was put off ("Later"); it comes back the next day */
	functionSnoozed?: string;
	/** first-run setup finished or skipped */
	onboarded?: boolean;
	/** 'YYYY-MM-DD' the fresh-start card was closed (see freshStart in habits.ts) */
	freshStartDismissed?: string;
	/** Monday of the week whose tip card was dismissed */
	tipDismissed?: string;
	/* Optional features, all on by default; each can be switched off in Settings. */
	/** 0-10 pain score after routines, pain zones, and the pain chart on Stats */
	painTracking: boolean;
	/** Better / Same / Worse question the morning after a routine */
	morningCheck: boolean;
	/** card when pain rises week on week */
	painAlerts: boolean;
	/** "Ready to progress?" prompt in the routine editor */
	progressPrompts: boolean;
	/** last week's summary card on Home */
	weeklyReview: boolean;
	/** fortnightly "how are everyday tasks?" check-in (PSFS) on Home */
	functionChecks: boolean;
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
	/** reps segments: total reps */
	reps?: number;
	/** reps segments: seconds per rep */
	repSeconds?: number;
	/** 1-based set number when the routine repeats */
	set?: number;
	totalSets?: number;
}
