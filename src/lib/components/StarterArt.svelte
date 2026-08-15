<script lang="ts">
	let { kind }: { kind: string } = $props();
</script>

<svg class="starter-art {kind}" viewBox="0 0 100 75" aria-hidden="true">
	<defs>
		<linearGradient id="grad-{kind}" x1="0" x2="1" y1="0" y2="1">
			{#if kind === 'desk-reset'}
				<stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25" />
				<stop offset="100%" stop-color="#0284c7" stop-opacity="0.85" />
			{:else if kind === 'morning-mobility'}
				<stop offset="0%" stop-color="#fbbf24" stop-opacity="0.3" />
				<stop offset="100%" stop-color="#f97316" stop-opacity="0.8" />
			{:else if kind === 'bedtime-wind-down'}
				<stop offset="0%" stop-color="#a855f7" stop-opacity="0.25" />
				<stop offset="100%" stop-color="#6366f1" stop-opacity="0.85" />
			{:else if kind === 'lower-body-reset'}
				<stop offset="0%" stop-color="#34d399" stop-opacity="0.25" />
				<stop offset="100%" stop-color="#059669" stop-opacity="0.8" />
			{:else if kind === 'runner-recovery'}
				<stop offset="0%" stop-color="#f43f5e" stop-opacity="0.25" />
				<stop offset="100%" stop-color="#e11d48" stop-opacity="0.8" />
			{:else}
				<stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.25" />
				<stop offset="100%" stop-color="#0d9488" stop-opacity="0.85" />
			{/if}
		</linearGradient>
	</defs>

	<!-- Rounded Cover Box -->
	<rect width="100" height="75" rx="14" fill="url(#grad-{kind})" />

	{#if kind === 'desk-reset'}
		<!-- Sitting at desk, neck/shoulder release -->
		<circle cx="32" cy="24" r="8" fill="#fde047" />
		<path d="M26 34c3-4 10-4 13 0l3 16H23z" fill="#0f172a" />
		<path d="M38 38l14 4 6-6" fill="none" stroke="#fde047" stroke-linecap="round" stroke-width="4" />
		<path d="M46 54h36M54 44v22" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-width="3" opacity=".95" />
		<rect x="58" y="27" width="22" height="15" rx="3" fill="#ffffff" opacity=".95" />
		<path d="M63 32h12M63 36h8" stroke="#38bdf8" stroke-linecap="round" stroke-width="2" />
	{:else if kind === 'morning-mobility'}
		<!-- Sunrise morning stretch -->
		<circle cx="78" cy="18" r="10" fill="#fde047" />
		<path d="M12 56c14-14 26-18 40-16 12 1 22 7 40 1" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-width="3.5" opacity=".85" />
		<circle cx="44" cy="24" r="7" fill="#fde047" />
		<path d="M44 32l-5 16 14 8M42 36l-14 8M41 48l-12 10M50 56l14 4" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4.5" />
	{:else if kind === 'bedtime-wind-down'}
		<!-- Crescent moon and child's pose -->
		<path d="M74 12a15 15 0 1 0 10 24A13 13 0 1 1 74 12z" fill="#ffffff" opacity=".95" />
		<circle cx="86" cy="20" r="1.5" fill="#fde047" /><circle cx="90" cy="30" r="1.5" fill="#fde047" />
		<circle cx="28" cy="46" r="6" fill="#fde047" />
		<path d="M34 50c12-10 24-8 38 0H18" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="5" />
		<path d="M14 62h72" stroke="#ffffff" stroke-linecap="round" stroke-width="2.5" opacity=".7" />
	{:else if kind === 'lower-body-reset'}
		<!-- Deep lunge / leg stretch -->
		<circle cx="50" cy="18" r="7" fill="#fde047" />
		<path d="M49 26v16" stroke="#ffffff" stroke-linecap="round" stroke-width="5.5" />
		<path d="M49 42l20 4v16" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="5" />
		<path d="M49 42l-22 8 8 12" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="5" />
		<path d="M14 62h74" stroke="#ffffff" stroke-linecap="round" stroke-width="3" opacity=".8" />
	{:else if kind === 'runner-recovery'}
		<!-- Runner standing quad/hamstring stretch -->
		<circle cx="48" cy="16" r="7" fill="#fde047" />
		<path d="M48 24v20M48 44v20" stroke="#ffffff" stroke-linecap="round" stroke-width="5.5" />
		<path d="M48 44l-14 10 4-18" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="5" />
		<path d="M48 30l-10 6" stroke="#fde047" stroke-linecap="round" stroke-width="4.5" />
		<path d="M14 64h72" stroke="#ffffff" stroke-linecap="round" stroke-width="2.5" opacity=".7" />
	{:else}
		<!-- Full body reach star -->
		<circle cx="50" cy="20" r="7" fill="#fde047" />
		<path d="M50 28v20M50 48L32 66M50 48l18 18" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="5" />
		<path d="M50 32L24 16M50 32l26-16" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="5" />
		<circle cx="22" cy="14" r="4.5" fill="#fde047" /><circle cx="78" cy="14" r="4.5" fill="#fde047" />
	{/if}
</svg>

<style>
	.starter-art {
		display: block;
		width: 100%;
		height: auto;
		border-radius: 0.9rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}
</style>
