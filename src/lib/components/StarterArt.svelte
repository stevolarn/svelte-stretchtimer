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
			{:else if kind === 'posture-fix'}
				<stop offset="0%" stop-color="#60a5fa" stop-opacity="0.3" />
				<stop offset="100%" stop-color="#1d4ed8" stop-opacity="0.85" />
			{:else if kind === 'lower-back-relief'}
				<stop offset="0%" stop-color="#c4b5fd" stop-opacity="0.3" />
				<stop offset="100%" stop-color="#7c3aed" stop-opacity="0.85" />
			{:else if kind === 'hip-opener'}
				<stop offset="0%" stop-color="#fda4af" stop-opacity="0.3" />
				<stop offset="100%" stop-color="#db2777" stop-opacity="0.85" />
			{:else if kind === 'pre-workout-warmup'}
				<stop offset="0%" stop-color="#fdba74" stop-opacity="0.3" />
				<stop offset="100%" stop-color="#ea580c" stop-opacity="0.85" />
			{:else if kind === 'core-isometrics'}
				<stop offset="0%" stop-color="#94a3b8" stop-opacity="0.3" />
				<stop offset="100%" stop-color="#334155" stop-opacity="0.85" />
			{:else if kind === 'band-isometrics'}
				<stop offset="0%" stop-color="#bef264" stop-opacity="0.3" />
				<stop offset="100%" stop-color="#4d7c0f" stop-opacity="0.85" />
			{:else if kind === 'isometric-flexibility'}
				<stop offset="0%" stop-color="#67e8f9" stop-opacity="0.3" />
				<stop offset="100%" stop-color="#0e7490" stop-opacity="0.85" />
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
	{:else if kind === 'posture-fix'}
		<!-- Tall stance with shoulders drawn back in a goalpost -->
		<circle cx="50" cy="16" r="7" fill="#fde047" />
		<path d="M50 24v22M50 46l-8 18M50 46l8 18" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="5" />
		<path d="M50 30H36V16M50 30h14V16" fill="none" stroke="#fde047" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" />
		<path d="M24 24v34M76 24v34" stroke="#ffffff" stroke-dasharray="2 5" stroke-linecap="round" stroke-width="2.5" opacity=".7" />
		<path d="M14 64h72" stroke="#ffffff" stroke-linecap="round" stroke-width="2.5" opacity=".7" />
	{:else if kind === 'lower-back-relief'}
		<!-- Lying on back hugging knees -->
		<circle cx="24" cy="54" r="6.5" fill="#fde047" />
		<path d="M31 56h22" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="5.5" />
		<path d="M53 56l6-18 10 10" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="5" />
		<path d="M36 54l14-10" stroke="#fde047" stroke-linecap="round" stroke-width="4" />
		<path d="M14 64h72" stroke="#ffffff" stroke-linecap="round" stroke-width="2.5" opacity=".7" />
	{:else if kind === 'hip-opener'}
		<!-- Seated butterfly with knees open -->
		<circle cx="50" cy="18" r="7" fill="#fde047" />
		<path d="M50 26v24" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="5.5" />
		<path d="M50 50L26 44l20 14M50 50l24-6-20 14" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4.5" />
		<path d="M50 32l-8 16M50 32l8 16" stroke="#fde047" stroke-linecap="round" stroke-width="3.5" />
		<path d="M14 64h72" stroke="#ffffff" stroke-linecap="round" stroke-width="2.5" opacity=".7" />
	{:else if kind === 'pre-workout-warmup'}
		<!-- Jumping star with motion lines -->
		<circle cx="50" cy="16" r="7" fill="#fde047" />
		<path d="M50 24v20M50 44l-14 16M50 44l14 16M50 28L34 14M50 28l16-14" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="5" />
		<path d="M18 30h8M16 40h10M74 30h8M74 40h10" stroke="#fde047" stroke-linecap="round" stroke-width="3" />
		<path d="M14 64h72" stroke="#ffffff" stroke-linecap="round" stroke-width="2.5" opacity=".7" />
	{:else if kind === 'core-isometrics'}
		<!-- Forearm plank with brace lines -->
		<circle cx="22" cy="40" r="6.5" fill="#fde047" />
		<path d="M28 44l52 10" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="5.5" />
		<path d="M30 46l-2 14h10" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4.5" />
		<path d="M44 34v-6M56 36v-6M68 38v-6" stroke="#fde047" stroke-linecap="round" stroke-width="3" />
		<path d="M14 64h72" stroke="#ffffff" stroke-linecap="round" stroke-width="2.5" opacity=".7" />
	{:else if kind === 'band-isometrics'}
		<!-- Arms forward pulling a loop band apart -->
		<circle cx="38" cy="18" r="7" fill="#fde047" />
		<path d="M38 26v22M38 48l-8 16M38 48l8 16" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="5" />
		<path d="M38 32l30-6M38 34l30 10" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4.5" />
		<ellipse cx="68" cy="35" rx="5" ry="11" fill="none" stroke="#fde047" stroke-width="3.5" />
		<path d="M14 64h72" stroke="#ffffff" stroke-linecap="round" stroke-width="2.5" opacity=".7" />
	{:else if kind === 'isometric-flexibility'}
		<!-- Seated hamstring reach with press/relax arrows -->
		<circle cx="30" cy="26" r="7" fill="#fde047" />
		<path d="M32 33l10 23h34" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="5.5" />
		<path d="M36 38l30 10" stroke="#ffffff" stroke-linecap="round" stroke-width="4.5" />
		<path d="M66 64v-6M62 62l4-4 4 4" fill="none" stroke="#fde047" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" />
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
