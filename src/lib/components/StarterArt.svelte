<script lang="ts">
	let { kind }: { kind: string } = $props();
</script>

<svg class="starter-art" viewBox="0 0 96 72" aria-hidden="true">
	<defs>
		<linearGradient id="art-bg" x1="0" x2="1" y1="0" y2="1">
			<stop offset="0" stop-color="var(--art-a)" />
			<stop offset="1" stop-color="var(--art-b)" />
		</linearGradient>
	</defs>
	<rect width="96" height="72" rx="16" fill="url(#art-bg)" />

	{#if kind === 'desk-reset'}
		<circle cx="27" cy="24" r="7" fill="#f6c9a9" />
		<path d="M22 32c1-5 10-5 12 0l4 14H24z" fill="#30415d" />
		<path d="M36 37l14 5 7-8" fill="none" stroke="#f6c9a9" stroke-linecap="round" stroke-width="4" />
		<path d="M48 49h32M55 42v16" fill="none" stroke="#fff" stroke-linecap="round" stroke-width="3" opacity=".9" />
		<rect x="58" y="25" width="20" height="15" rx="2" fill="#fff" opacity=".9" />
		<path d="M63 29h10M63 33h7" stroke="#93a7c3" stroke-linecap="round" stroke-width="2" />
	{:else if kind === 'morning-mobility'}
		<circle cx="73" cy="19" r="9" fill="#ffd66b" />
		<path d="M10 52c12-14 24-18 37-16 11 1 20 7 38 1" fill="none" stroke="#fff" stroke-linecap="round" stroke-width="3" opacity=".8" />
		<circle cx="43" cy="25" r="6" fill="#f6c9a9" />
		<path d="M42 32l-4 14 12 7M40 36l-13 7M39 46l-10 9M48 52l13 4" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" />
	{:else if kind === 'bedtime-wind-down'}
		<path d="M69 13a16 16 0 1 0 9 25A14 14 0 1 1 69 13z" fill="#fff" opacity=".9" />
		<circle cx="25" cy="22" r="5" fill="#f6c9a9" />
		<path d="M30 30c8-4 17 0 21 7l7 9H30c-8 0-11-9 0-16z" fill="#fff" opacity=".92" />
		<path d="M28 46h45" stroke="#9e83bd" stroke-linecap="round" stroke-width="3" />
		<circle cx="80" cy="21" r="1.5" fill="#fff" /><circle cx="84" cy="31" r="1.5" fill="#fff" />
	{:else if kind === 'lower-body-reset'}
		<circle cx="48" cy="17" r="6" fill="#f6c9a9" />
		<path d="M47 24l-2 17M46 29l-16 10M45 40l-13 16M45 40l20 10 9-1M31 56l-7 4M74 49l8 4" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" />
		<path d="M15 58h66" stroke="#b6dbcf" stroke-linecap="round" stroke-width="3" opacity=".9" />
	{:else if kind === 'runner-recovery'}
		<circle cx="48" cy="16" r="6" fill="#f6c9a9" />
		<path d="M47 23l-5 15 12 8 12-10M43 31L28 28M54 45l-8 13M54 45l17 8M27 28l-7 6" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" />
		<path d="M13 58h70" stroke="#ffc46b" stroke-linecap="round" stroke-width="3" /><path d="M17 52l7-3M74 48l7-3" stroke="#fff" stroke-linecap="round" stroke-width="2" opacity=".8" />
	{:else}
		<circle cx="48" cy="17" r="6" fill="#f6c9a9" />
		<path d="M48 24v20M48 28L25 16M48 28l23-12M48 44L34 59M48 44l14 15" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" />
		<circle cx="24" cy="15" r="4" fill="#ffd66b" /><circle cx="72" cy="15" r="4" fill="#ffd66b" />
	{/if}
	</svg>

<style>
	.starter-art {
		--art-a: #d9ecff;
		--art-b: #8fc5e7;
		display: block;
		width: 100%;
		height: auto;
		border-radius: 0.9rem;
	}
	:global(html.dark) .starter-art {
		--art-a: #30445f;
		--art-b: #526f8c;
	}
</style>
