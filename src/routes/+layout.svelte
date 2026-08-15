<script lang="ts">
		import { page } from '$app/state';
	import { settings } from '$lib/stores.svelte';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	$effect(() => {
		const theme = settings.theme;
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		const apply = (dark: boolean) => {
			document.documentElement.classList.toggle('dark', dark);
			document
				.querySelector('meta[name="theme-color"]')
				?.setAttribute('content', dark ? '#131316' : '#f4f4ef');
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

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#f4f4ef" />
</svelte:head>

{#if !inPlayer}
	<nav class="nav">
		<div class="nav-inner">
			<a class="brand" href="/"><span class="dot"></span>Stretch Timer</a>
			<a href="/" class:active={page.url.pathname === '/'}>Routines</a>
			<a href="/stats" class:active={page.url.pathname === '/stats'}>Streak</a>
			<a href="/settings" class:active={page.url.pathname === '/settings'}>Settings</a>
		</div>
	</nav>
{/if}

<main class="app">
	{@render children()}
</main>
