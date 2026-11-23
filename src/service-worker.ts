/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';
import { addDays, todayKey } from '$lib/time';
import { REMINDER_CACHE, REMINDER_TAG, REMINDER_URL, type ReminderState } from '$lib/reminders';

const CACHE_NAME = `stretch-cache-${version}`;
const ASSETS = [...build, ...files];

self.addEventListener('install', (event: ExtendableEvent) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll([...ASSETS, '/']))
			.then(() => (self as unknown as ServiceWorkerGlobalScope).skipWaiting())
	);
});

self.addEventListener('activate', (event: ExtendableEvent) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== CACHE_NAME && key !== REMINDER_CACHE).map((key) => caches.delete(key)))
			)
			.then(() => (self as unknown as ServiceWorkerGlobalScope).clients.claim())
	);
});

const sw = self as unknown as ServiceWorkerGlobalScope;
const PRECACHED = new Set(ASSETS);
/** Every route renders the same client-side shell, so any cached page can stand in offline. */
const SHELL = '/';

async function networkFirst(request: Request): Promise<Response> {
	const cache = await caches.open(CACHE_NAME);
	try {
		const response = await fetch(request);
		if (response.ok && response.type === 'basic' && !response.redirected) {
			cache.put(request.mode === 'navigate' ? SHELL : request, response.clone()).catch(() => {});
		}
		return response;
	} catch {
		const cached = (await cache.match(request)) ?? (request.mode === 'navigate' ? await cache.match(SHELL) : undefined);
		if (cached) return cached;
		return new Response('You’re offline and this page isn’t saved yet.', {
			status: 503,
			headers: { 'Content-Type': 'text/plain; charset=utf-8' }
		});
	}
}

sw.addEventListener('fetch', (event: FetchEvent) => {
	// Vite serves source modules in development; never shadow them with a cache.
	if (import.meta.env.DEV) return;
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);
	if (url.origin !== sw.location.origin) return;

	// Hashed build files and static assets never change within a version: cache first.
	if (PRECACHED.has(url.pathname)) {
		event.respondWith(caches.match(url.pathname).then((cached) => cached ?? fetch(event.request)));
		return;
	}

	// Pages and anything else: fresh when online, cached when offline.
	event.respondWith(networkFirst(event.request));
});

async function maybeRemind(): Promise<void> {
	const cache = await caches.open(REMINDER_CACHE);
	const res = await cache.match(REMINDER_URL);
	if (!res) return;
	const state = (await res.json()) as ReminderState;
	const now = new Date();
	const today = todayKey(now);
	if (!state.enabled || now.getHours() < state.afterHour) return;
	if (state.recentDates.includes(today) || state.lastNotified === today) return;

	const yesterday = addDays(today, -1);
	const alive = state.streak > 0 && state.recentDates.includes(yesterday);
	await sw.registration.showNotification(alive ? `Keep your ${state.streak}-day streak going` : 'Time for a stretch', {
		body: alive ? 'A quick routine today keeps the streak alive.' : 'A few minutes of stretching is all it takes.',
		icon: '/icon-192.png',
		badge: '/icon-192.png',
		tag: REMINDER_TAG
	});
	await cache.put(
		REMINDER_URL,
		new Response(JSON.stringify({ ...state, lastNotified: today }), { headers: { 'Content-Type': 'application/json' } })
	);
}

sw.addEventListener('periodicsync', ((event: ExtendableEvent & { tag: string }) => {
	if (event.tag === REMINDER_TAG) event.waitUntil(maybeRemind().catch(() => {}));
}) as EventListener);

sw.addEventListener('notificationclick', (event: NotificationEvent) => {
	event.notification.close();
	event.waitUntil(
		sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
			const open = windows[0];
			return open ? open.focus() : sw.clients.openWindow('/');
		})
	);
});
