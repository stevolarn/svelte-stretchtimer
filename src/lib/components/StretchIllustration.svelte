<script lang="ts">
	import { resolveIconKey } from '$lib/stockStretches';

	let {
		iconKey,
		name,
		size = 64,
		rounded = 12
	}: {
		iconKey?: string;
		name?: string;
		size?: number | string;
		rounded?: number | string;
	} = $props();

	const key = $derived(resolveIconKey(iconKey, name));
</script>

<svg
	class="stretch-illustration"
	viewBox="0 0 100 80"
	style="width: {typeof size === 'number' ? `${size}px` : size}; height: auto; aspect-ratio: 5/4; border-radius: {typeof rounded === 'number' ? `${rounded}px` : rounded};"
	aria-hidden="true"
>
	<defs>
		<linearGradient id="ill-bg" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0%" stop-color="var(--ill-bg-a, #eaf3fd)" />
			<stop offset="100%" stop-color="var(--ill-bg-b, #c8e0f8)" />
		</linearGradient>
	</defs>

	<!-- Canvas Background -->
	<rect width="100" height="80" rx={typeof rounded === 'number' ? rounded : 12} fill="url(#ill-bg)" />

	{#if key === 'neck-release'}
		<!-- Head tilted gently with guide curve -->
		<circle cx="50" cy="24" r="9" fill="var(--ill-skin)" />
		<path d="M42 36c4-3 12-3 16 0l4 26H38z" fill="var(--ill-body)" />
		<path d="M30 20c8-8 26-8 36 0" fill="none" stroke="var(--ill-accent)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="3 3" />
		<path d="M68 22l-2-6 5 2" fill="none" stroke="var(--ill-accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
	{:else if key === 'shoulder-rolls'}
		<!-- Shoulders with circular motion arrows -->
		<circle cx="50" cy="24" r="8" fill="var(--ill-skin)" />
		<path d="M40 35c5-4 15-4 20 0l3 26H37z" fill="var(--ill-body)" />
		<path d="M30 36a10 10 0 1 1 5 12" fill="none" stroke="var(--ill-accent)" stroke-width="2.5" stroke-linecap="round" />
		<path d="M36 49l-2-5-4 4" fill="none" stroke="var(--ill-accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M70 36a10 10 0 1 0-5 12" fill="none" stroke="var(--ill-accent)" stroke-width="2.5" stroke-linecap="round" />
		<path d="M64 49l2-5 4 4" fill="none" stroke="var(--ill-accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
	{:else if key === 'chest-opener'}
		<!-- Clasp hands behind, open chest -->
		<circle cx="50" cy="22" r="8" fill="var(--ill-skin)" />
		<path d="M41 33c6-3 12-3 18 0l3 32H38z" fill="var(--ill-body)" />
		<path d="M41 37l-15 12 12 7" fill="none" stroke="var(--ill-skin)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M59 37l15 12-12 7" fill="none" stroke="var(--ill-skin)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
		<circle cx="50" cy="56" r="4" fill="var(--ill-gold)" />
	{:else if key === 'wrist-forearm'}
		<!-- Arm extended with hand pull -->
		<path d="M15 42h48" stroke="var(--ill-skin)" stroke-width="6" stroke-linecap="round" />
		<path d="M63 42l10-14" stroke="var(--ill-skin)" stroke-width="5" stroke-linecap="round" />
		<path d="M76 22l-6 18" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" />
		<circle cx="32" cy="42" r="3" fill="var(--ill-accent)" opacity=".8" />
	{:else if key === 'cross-body-shoulder'}
		<!-- Arm crossed over body -->
		<circle cx="50" cy="22" r="8" fill="var(--ill-skin)" />
		<path d="M42 33c5-3 11-3 16 0l3 32H39z" fill="var(--ill-body)" />
		<path d="M38 38h32" stroke="var(--ill-skin)" stroke-width="5" stroke-linecap="round" />
		<path d="M56 32v20" stroke="var(--ill-gold)" stroke-width="4" stroke-linecap="round" />
	{:else if key === 'overhead-triceps'}
		<!-- Arm bent overhead -->
		<circle cx="50" cy="26" r="8" fill="var(--ill-skin)" />
		<path d="M42 37c5-3 11-3 16 0l3 28H39z" fill="var(--ill-body)" />
		<path d="M58 38l6-20-14-3" fill="none" stroke="var(--ill-skin)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M42 38l-4-15 10-6" fill="none" stroke="var(--ill-gold)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
	{:else if key === 'cat-cow'}
		<!-- Cat Cow arched spine on four limbs -->
		<circle cx="26" cy="38" r="6" fill="var(--ill-skin)" />
		<path d="M26 44v18M38 48v14M72 48v14M78 44v18" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" />
		<path d="M26 44c12-16 36-16 52 0" fill="none" stroke="var(--ill-accent)" stroke-width="5" stroke-linecap="round" />
		<circle cx="52" cy="32" r="3" fill="var(--ill-gold)" />
	{:else if key === 'childs-pose'}
		<!-- Grounded child's pose -->
		<circle cx="75" cy="48" r="6" fill="var(--ill-skin)" />
		<path d="M72 52c-8-12-24-12-42 0" fill="none" stroke="var(--ill-body)" stroke-width="6" stroke-linecap="round" />
		<path d="M30 52H14" stroke="var(--ill-skin)" stroke-width="4.5" stroke-linecap="round" />
		<path d="M12 60h76" stroke="var(--ill-mat)" stroke-width="2.5" stroke-linecap="round" />
	{:else if key === 'cobra-stretch'}
		<!-- Prone chest lift -->
		<circle cx="28" cy="24" r="7" fill="var(--ill-skin)" />
		<path d="M28 31c2 12 16 18 52 24" fill="none" stroke="var(--ill-body)" stroke-width="6" stroke-linecap="round" />
		<path d="M26 36l8 19" stroke="var(--ill-skin)" stroke-width="4.5" stroke-linecap="round" />
		<path d="M14 58h74" stroke="var(--ill-mat)" stroke-width="2.5" stroke-linecap="round" />
	{:else if key === 'standing-side-bend'}
		<!-- Side reach overhead -->
		<circle cx="48" cy="18" r="7" fill="var(--ill-skin)" />
		<path d="M46 26c-8 12-4 22 2 36" fill="none" stroke="var(--ill-body)" stroke-width="6" stroke-linecap="round" />
		<path d="M48 26l-18-6c8-10 18-10 26-2" fill="none" stroke="var(--ill-accent)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M48 62v10M52 62v10" stroke="var(--ill-body)" stroke-width="4" stroke-linecap="round" />
	{:else if key === 'seated-twist'}
		<!-- Seated spinal twist -->
		<circle cx="50" cy="20" r="7" fill="var(--ill-skin)" />
		<path d="M45 28c5-2 10-2 14 2l-2 22-16 0z" fill="var(--ill-body)" />
		<path d="M40 52c-8 0-14 8 0 10h22c10-2 6-10-2-10z" fill="var(--ill-body)" />
		<path d="M38 36l18-4 6 16" fill="none" stroke="var(--ill-skin)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
	{:else if key === 'thoracic-rotation'}
		<!-- Quadruped elbow to sky -->
		<circle cx="34" cy="38" r="6" fill="var(--ill-skin)" />
		<path d="M34 44v18M72 44v18" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" />
		<path d="M34 44h38" stroke="var(--ill-body)" stroke-width="6" stroke-linecap="round" />
		<path d="M46 42l8-22-6 8" fill="none" stroke="var(--ill-accent)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
	{:else if key === 'low-lunge'}
		<!-- Deep lunge front knee bent, back knee grounded -->
		<circle cx="50" cy="18" r="7" fill="var(--ill-skin)" />
		<path d="M48 26v16" stroke="var(--ill-body)" stroke-width="6" stroke-linecap="round" />
		<path d="M48 42l18 4v16" fill="none" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M48 42l-22 8 8 12" fill="none" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M12 62h76" stroke="var(--ill-mat)" stroke-width="2.5" stroke-linecap="round" />
	{:else if key === 'pigeon-pose'}
		<!-- Pigeon / Figure 4 hip opener -->
		<circle cx="68" cy="30" r="7" fill="var(--ill-skin)" />
		<path d="M66 38l-22 8-12 12" fill="none" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M44 46l28 8 16 0" fill="none" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M14 62h74" stroke="var(--ill-mat)" stroke-width="2.5" stroke-linecap="round" />
	{:else if key === 'butterfly-stretch'}
		<!-- Butterfly seated knees wide -->
		<circle cx="50" cy="20" r="7" fill="var(--ill-skin)" />
		<path d="M44 28c4-2 8-2 12 0l2 24H42z" fill="var(--ill-body)" />
		<path d="M42 52L26 50l24 6 24-6-16 2" fill="none" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
		<circle cx="50" cy="56" r="3.5" fill="var(--ill-gold)" />
	{:else if key === 'quad-stretch'}
		<!-- Standing on one foot holding the other -->
		<circle cx="48" cy="16" r="7" fill="var(--ill-skin)" />
		<path d="M47 24v20" stroke="var(--ill-body)" stroke-width="5.5" stroke-linecap="round" />
		<path d="M47 44v24" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" />
		<path d="M47 44l-12 10 4-18" fill="none" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M47 30l-8 6" stroke="var(--ill-skin)" stroke-width="4" stroke-linecap="round" />
	{:else if key === 'hip-flexor-release'}
		<!-- Half kneeling hip squeeze -->
		<circle cx="48" cy="18" r="7" fill="var(--ill-skin)" />
		<path d="M48 26v16" stroke="var(--ill-body)" stroke-width="6" stroke-linecap="round" />
		<path d="M48 42l16 2v18" fill="none" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M48 42l-14 8v12" fill="none" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
		<circle cx="48" cy="42" r="3" fill="var(--ill-accent)" />
	{:else if key === 'happy-baby'}
		<!-- Reclined with knees wide -->
		<path d="M25 54h50" stroke="var(--ill-body)" stroke-width="6" stroke-linecap="round" />
		<circle cx="22" cy="54" r="6" fill="var(--ill-skin)" />
		<path d="M42 54l-8-22 14-2" fill="none" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M58 54l8-22-14-2" fill="none" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M34 32l14 0M66 32l-14 0" stroke="var(--ill-skin)" stroke-width="3" stroke-linecap="round" />
	{:else if key === 'forward-fold'}
		<!-- Standing or seated forward fold -->
		<circle cx="34" cy="44" r="7" fill="var(--ill-skin)" />
		<path d="M56 22l-18 20 8 18" fill="none" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M56 22v42" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" />
		<path d="M38 42l4 18" stroke="var(--ill-skin)" stroke-width="3.5" stroke-linecap="round" />
		<path d="M20 64h60" stroke="var(--ill-mat)" stroke-width="2.5" stroke-linecap="round" />
	{:else if key === 'standing-calf'}
		<!-- Wall calf press -->
		<circle cx="38" cy="20" r="7" fill="var(--ill-skin)" />
		<path d="M38 28l12 12-6 24" fill="none" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M50 40l-24 24" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" />
		<path d="M38 30l28-6" stroke="var(--ill-skin)" stroke-width="4" stroke-linecap="round" />
		<path d="M68 12v54" stroke="var(--ill-body)" stroke-width="3" stroke-linecap="round" />
	{:else if key === 'hamstring-fold'}
		<!-- Seated reach to toes -->
		<circle cx="34" cy="30" r="7" fill="var(--ill-skin)" />
		<path d="M34 38l22 10 24 0" fill="none" stroke="var(--ill-body)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M34 38l38 8" stroke="var(--ill-skin)" stroke-width="4" stroke-linecap="round" />
		<path d="M14 56h72" stroke="var(--ill-mat)" stroke-width="2.5" stroke-linecap="round" />
	{:else if key === 'worlds-greatest'}
		<!-- Dynamic lunge with arm reaching high -->
		<circle cx="46" cy="34" r="6" fill="var(--ill-skin)" />
		<path d="M46 40l18 4v18" fill="none" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M46 40l-26 12 10 10" fill="none" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M46 40L64 16" stroke="var(--ill-accent)" stroke-width="4.5" stroke-linecap="round" />
		<circle cx="66" cy="14" r="4" fill="var(--ill-gold)" />
		<path d="M12 64h76" stroke="var(--ill-mat)" stroke-width="2.5" stroke-linecap="round" />
	{:else if key === 'overhead-reach'}
		<!-- Full body reach -->
		<circle cx="50" cy="22" r="7" fill="var(--ill-skin)" />
		<path d="M50 30v26M50 56l-6 16M50 56l6 16" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" />
		<path d="M50 30l-12-18M50 30l12-18" stroke="var(--ill-accent)" stroke-width="4.5" stroke-linecap="round" />
		<circle cx="50" cy="10" r="3.5" fill="var(--ill-gold)" />
	{:else}
		<!-- General Pose Silhouette -->
		<circle cx="50" cy="22" r="8" fill="var(--ill-skin)" />
		<path d="M50 30v22M50 52l-10 18M50 52l10 18" stroke="var(--ill-body)" stroke-width="5.5" stroke-linecap="round" />
		<path d="M50 34L30 22M50 34l20-12" stroke="var(--ill-accent)" stroke-width="4.5" stroke-linecap="round" />
		<circle cx="30" cy="20" r="3.5" fill="var(--ill-gold)" /><circle cx="70" cy="20" r="3.5" fill="var(--ill-gold)" />
	{/if}
</svg>

<style>
	.stretch-illustration {
		display: inline-block;
		vertical-align: middle;
		flex-shrink: 0;
		--ill-bg-a: #eaf3fd;
		--ill-bg-b: #c8e0f8;
		--ill-body: #30415d;
		--ill-skin: #f8c8a6;
		--ill-accent: #2563eb;
		--ill-mat: #93c5fd;
		--ill-gold: #ffd66b;
	}
	:global(html.dark) .stretch-illustration {
		--ill-bg-a: #1e293b;
		--ill-bg-b: #334155;
		--ill-body: #ffffff;
		--ill-skin: #fed7aa;
		--ill-accent: #60a5fa;
		--ill-mat: #38bdf8;
		--ill-gold: #fde047;
	}
</style>
