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
			.then((cache) => cache.addAll(ASSETS))
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

self.addEventListener('fetch', (event: FetchEvent) => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);

	// Only handle requests on the same origin (ignore chrome-extension://, external, etc.)
	if (url.origin !== self.origin) return;

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			if (cachedResponse) {
				return cachedResponse;
			}

			return fetch(event.request)
				.then((networkResponse) => {
					if (networkResponse.status === 200) {
						const responseClone = networkResponse.clone();
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(event.request, responseClone).catch(() => {});
						});
					}
					return networkResponse;
				})
				.catch(async () => {
					// If offline and navigating to a page, serve the cached root or cached match
					if (event.request.mode === 'navigate') {
						const cachedRoot = await caches.match('/');
						if (cachedRoot) return cachedRoot;
					}
					return new Response('Offline - please check your connection', {
						status: 503,
						statusText: 'Service Unavailable',
						headers: { 'Content-Type': 'text/plain' }
					});
				});
		})
	);
});
