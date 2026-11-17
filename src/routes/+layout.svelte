<script lang="ts">
	import { page } from '$app/state';
	import { settings } from '$lib/stores.svelte';
	import ToastHost from '$lib/components/ToastHost.svelte';
	import '../app.css';

	let { children } = $props();

	$effect(() => {
		const theme = settings.theme;
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		const apply = (dark: boolean) => {
			document.documentElement.classList.toggle('dark', dark);
			document
				.querySelectorAll('meta[name="theme-color"]')
				.forEach((meta) => meta.setAttribute('content', dark ? '#131316' : '#f4f4ef'));
		};
		if (theme === 'system') {
			apply(mq.matches);
			mq.addEventListener('change', onChange);
			return () => mq.removeEventListener('change', onChange);
		}
		apply(theme === 'dark');
		function onChange() {
			apply(mq.matches);
		}
	});

	const inPlayer = $derived(page.url.pathname.startsWith('/player'));
</script>

{#if !inPlayer}
	<header class="app-header">
		<div class="app-header-inner">
			<a class="brand" href="/"><img class="brand-logo" src="/icon.svg" alt="" width="26" height="26" />Stretch Timer</a>
			<div class="desktop-nav-links">
				<a href="/" class:active={page.url.pathname === '/' || page.url.pathname.startsWith('/routine')}>Routines</a>
				<a href="/stats" class:active={page.url.pathname === '/stats'}>Streak</a>
				<a href="/settings" class:active={page.url.pathname === '/settings'}>Settings</a>
			</div>
		</div>
	</header>
{/if}

<main class="app" class:in-player={inPlayer}>
	{@render children()}
</main>

{#if !inPlayer}
	<nav class="mobile-tab-bar" aria-label="Main Navigation">
		<a href="/" class="tab-item" class:active={page.url.pathname === '/' || page.url.pathname.startsWith('/routine')}>
			<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
			</svg>
			<span class="tab-label">Routines</span>
		</a>
		<a href="/stats" class="tab-item" class:active={page.url.pathname === '/stats'}>
			<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
			</svg>
			<span class="tab-label">Streak</span>
		</a>
		<a href="/settings" class="tab-item" class:active={page.url.pathname === '/settings'}>
			<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
				<circle cx="12" cy="12" r="3" />
			</svg>
			<span class="tab-label">Settings</span>
		</a>
	</nav>
{/if}

<ToastHost raised={!inPlayer} />
