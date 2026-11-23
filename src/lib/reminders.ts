import type { Settings, StreakState } from './types';
import { currentStreak } from './streak';
import { todayKey } from './time';

/** Shared with the service worker, which can't read localStorage. */
export const REMINDER_CACHE = 'stretch-reminder';
export const REMINDER_URL = '/__reminder-state.json';
export const REMINDER_TAG = 'daily-reminder';

export interface ReminderState {
	enabled: boolean;
	afterHour: number;
	/** the last few completed days, enough to tell whether today is done */
	recentDates: string[];
	streak: number;
	lastNotified?: string;
}

type PeriodicSyncRegistration = ServiceWorkerRegistration & {
	periodicSync?: {
		register(tag: string, options: { minInterval: number }): Promise<void>;
		unregister(tag: string): Promise<void>;
	};
};

export type ReminderSupport = 'supported' | 'needs-install' | 'unsupported';

export function reminderSupport(): ReminderSupport {
	if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) {
		return 'unsupported';
	}
	if (!('PeriodicSyncManager' in window)) return 'unsupported';
	const standalone = window.matchMedia('(display-mode: standalone)').matches;
	return standalone ? 'supported' : 'needs-install';
}

async function readState(): Promise<ReminderState | null> {
	try {
		const cache = await caches.open(REMINDER_CACHE);
		const res = await cache.match(REMINDER_URL);
		return res ? ((await res.json()) as ReminderState) : null;
	} catch {
		return null;
	}
}

/** Mirror the bits the reminder needs into Cache Storage, keeping the service worker's lastNotified. */
export async function syncReminderState(settings: Settings, streak: StreakState): Promise<void> {
	if (typeof caches === 'undefined') return;
	try {
		const previous = await readState();
		if (!settings.reminderEnabled && !previous?.enabled) return;
		const state: ReminderState = {
			enabled: settings.reminderEnabled,
			afterHour: settings.reminderHour,
			recentDates: streak.completedDates.slice(-3),
			streak: currentStreak(streak, todayKey()),
			lastNotified: previous?.lastNotified
		};
		const cache = await caches.open(REMINDER_CACHE);
		await cache.put(REMINDER_URL, new Response(JSON.stringify(state), { headers: { 'Content-Type': 'application/json' } }));
	} catch {
		// Storage unavailable; the reminder simply won't fire.
	}
}

/** Ask for notification permission and register the periodic check. Returns a message on failure. */
export async function enableReminder(): Promise<string | null> {
	if (reminderSupport() === 'unsupported') return 'This browser can’t run background reminders.';
	const permission = await Notification.requestPermission();
	if (permission !== 'granted') return 'Notifications are blocked. Allow them in your browser’s site settings.';
	try {
		const reg = (await navigator.serviceWorker.ready) as PeriodicSyncRegistration;
		const status = await navigator.permissions
			.query({ name: 'periodic-background-sync' as PermissionName })
			.catch(() => null);
		if (status && status.state !== 'granted') {
			return 'Install the app to your home screen first, then turn this on.';
		}
		// Check every few hours; the worker only notifies once, after the chosen hour.
		await reg.periodicSync?.register(REMINDER_TAG, { minInterval: 4 * 60 * 60 * 1000 });
		return null;
	} catch {
		return 'Install the app to your home screen first, then turn this on.';
	}
}

export async function disableReminder(): Promise<void> {
	try {
		const reg = (await navigator.serviceWorker.ready) as PeriodicSyncRegistration;
		await reg.periodicSync?.unregister(REMINDER_TAG);
	} catch {
		// nothing registered
	}
}
