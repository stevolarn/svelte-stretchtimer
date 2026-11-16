/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

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
				Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
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
