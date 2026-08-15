<script lang="ts">
	import { resolveIconKey } from '$lib/stockStretches';

	let {
		iconKey,
		name,
		size = 64,
		rounded = 12,
		animated = true
	}: {
		iconKey?: string;
		name?: string;
		size?: number | string;
		rounded?: number | string;
		animated?: boolean;
	} = $props();

	const key = $derived(resolveIconKey(iconKey, name));
</script>

<svg
	class="stretch-illustration"
	class:animated
	viewBox="0 0 100 80"
	style="width: {typeof size === 'number' ? `${size}px` : size}; height: auto; aspect-ratio: 5/4; border-radius: {typeof rounded === 'number' ? `${rounded}px` : rounded};"
	aria-hidden="true"
>
	<defs>
		<linearGradient id="ill-bg" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0%" stop-color="var(--ill-bg-a, #eaf3fd)" />
			<stop offset="100%" stop-color="var(--ill-bg-b, #c8e0f8)" />
		</linearGradient>

		<!-- Arrow markers for motion paths -->
		<marker id="motion-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
			<path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--ill-accent)" />
		</marker>
		<marker id="motion-gold-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
			<path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--ill-gold)" />
		</marker>
	</defs>

	<!-- Canvas Background -->
	<rect width="100" height="80" rx={typeof rounded === 'number' ? rounded : 12} fill="url(#ill-bg)" />

	{#if key === 'neck-release'}
		<!-- Head tilted gently with guide curve -->
		<g class="anim-neck">
			<circle cx="50" cy="24" r="9" fill="var(--ill-skin)" />
			<path d="M42 36c4-3 12-3 16 0l4 26H38z" fill="var(--ill-body)" />
		</g>
		<!-- Motion Trajectory Arc -->
		<path class="anim-dash-flow" d="M30 18c8-8 26-8 36 0" fill="none" stroke="var(--ill-accent)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="4 3" marker-end="url(#motion-arrow)" />
		<path class="motion-pulse" d="M26 22c3-4 8-6 14-6" fill="none" stroke="var(--ill-gold)" stroke-width="2" stroke-linecap="round" />

	{:else if key === 'shoulder-rolls'}
		<!-- Shoulders with circular motion arrows -->
		<circle cx="50" cy="24" r="8" fill="var(--ill-skin)" />
		<path class="anim-shrug" d="M40 35c5-4 15-4 20 0l3 26H37z" fill="var(--ill-body)" />
		<g class="anim-spin-slow">
			<path d="M28 36a10 10 0 1 1 5 12" fill="none" stroke="var(--ill-accent)" stroke-width="2.5" stroke-linecap="round" marker-end="url(#motion-arrow)" />
		</g>
		<g class="anim-spin-slow-rev">
			<path d="M72 36a10 10 0 1 0-5 12" fill="none" stroke="var(--ill-accent)" stroke-width="2.5" stroke-linecap="round" marker-end="url(#motion-arrow)" />
		</g>

	{:else if key === 'arm-circles'}
		<!-- Arms with orbiting motion rings -->
		<circle cx="50" cy="24" r="7" fill="var(--ill-skin)" />
		<path d="M50 32v24M50 56l-8 16M50 56l8 16" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" />
		<g class="anim-arm-swing">
			<path d="M50 36H16M50 36h34" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" />
		</g>
		<g class="anim-spin-fast">
			<circle cx="16" cy="36" r="10" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-dasharray="8 6" />
			<path d="M16 26l3 3-3 3" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" />
		</g>
		<g class="anim-spin-fast-rev">
			<circle cx="84" cy="36" r="10" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-dasharray="8 6" />
			<path d="M84 26l-3 3 3 3" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" />
		</g>

	{:else if key === 'chest-opener'}
		<!-- Clasp hands behind, open chest -->
		<g class="anim-chest">
			<circle cx="50" cy="22" r="8" fill="var(--ill-skin)" />
			<path d="M41 33c6-3 12-3 18 0l3 32H38z" fill="var(--ill-body)" />
			<path d="M41 37l-15 12 12 7" fill="none" stroke="var(--ill-skin)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M59 37l15 12-12 7" fill="none" stroke="var(--ill-skin)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
			<circle cx="50" cy="56" r="4" fill="var(--ill-gold)" />
		</g>
		<!-- Chest expansion radiating rays -->
		<path class="motion-pulse" d="M50 20v-6M42 22l-4-4M58 22l4-4" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" />

	{:else if key === 'wrist-forearm'}
		<!-- Arm extended with hand pull -->
		<path d="M15 42h48" stroke="var(--ill-skin)" stroke-width="6" stroke-linecap="round" />
		<path d="M63 42l10-14" stroke="var(--ill-skin)" stroke-width="5" stroke-linecap="round" />
		<g class="anim-wrist-pull">
			<path d="M76 22l-6 18" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" />
		</g>
		<path class="anim-dash-flow" d="M76 18c-6 4-8 12-4 18" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" marker-end="url(#motion-arrow)" />
		<circle cx="32" cy="42" r="3" fill="var(--ill-accent)" opacity=".8" />

	{:else if key === 'cross-body-shoulder'}
		<!-- Arm crossed over body -->
		<circle cx="50" cy="22" r="8" fill="var(--ill-skin)" />
		<path d="M42 33c5-3 11-3 16 0l3 32H39z" fill="var(--ill-body)" />
		<g class="anim-cross-pull">
			<path d="M38 38h32" stroke="var(--ill-skin)" stroke-width="5" stroke-linecap="round" />
			<path d="M56 32v20" stroke="var(--ill-gold)" stroke-width="4" stroke-linecap="round" />
		</g>
		<path class="anim-dash-flow" d="M68 34H44" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" marker-end="url(#motion-arrow)" />

	{:else if key === 'overhead-triceps'}
		<!-- Arm bent overhead -->
		<circle cx="50" cy="26" r="8" fill="var(--ill-skin)" />
		<path d="M42 37c5-3 11-3 16 0l3 28H39z" fill="var(--ill-body)" />
		<g class="anim-tricep-pull">
			<path d="M58 38l6-20-14-3" fill="none" stroke="var(--ill-skin)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M42 38l-4-15 10-6" fill="none" stroke="var(--ill-gold)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
		</g>
		<path class="anim-dash-flow" d="M54 12c-4 2-6 8-4 12" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" marker-end="url(#motion-arrow)" />

	{:else if key === 'cat-cow'}
		<!-- Cat Cow arched spine waving in motion -->
		<circle cx="26" cy="38" r="6" fill="var(--ill-skin)" />
		<path d="M26 44v18M38 48v14M72 48v14M78 44v18" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" />
		<path class="anim-cat-cow-spine" d="M26 44c12-16 36-16 52 0" fill="none" stroke="var(--ill-accent)" stroke-width="5.5" stroke-linecap="round" />
		<path class="anim-cat-cow-wave" d="M38 30c8-6 18-6 26 0" fill="none" stroke="var(--ill-gold)" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" />
		<circle cx="52" cy="32" r="3" fill="var(--ill-gold)" />

	{:else if key === 'childs-pose'}
		<!-- Grounded child's pose with soothing stretch pulse -->
		<g class="anim-childs-pose">
			<circle cx="75" cy="48" r="6" fill="var(--ill-skin)" />
			<path d="M72 52c-8-12-24-12-42 0" fill="none" stroke="var(--ill-body)" stroke-width="6" stroke-linecap="round" />
			<path d="M30 52H14" stroke="var(--ill-skin)" stroke-width="4.5" stroke-linecap="round" />
		</g>
		<path class="anim-dash-flow" d="M68 44c-14-8-28-8-44 0" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 3" marker-end="url(#motion-arrow)" />
		<path d="M12 60h76" stroke="var(--ill-mat)" stroke-width="2.5" stroke-linecap="round" />

	{:else if key === 'cobra-stretch'}
		<!-- Cobra chest lift -->
		<g class="anim-cobra-lift">
			<circle cx="28" cy="24" r="7" fill="var(--ill-skin)" />
			<path d="M28 31c2 12 16 18 52 24" fill="none" stroke="var(--ill-body)" stroke-width="6" stroke-linecap="round" />
			<path d="M26 36l8 19" stroke="var(--ill-skin)" stroke-width="4.5" stroke-linecap="round" />
		</g>
		<path class="anim-dash-flow" d="M38 42c-8-6-10-14-8-22" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" marker-end="url(#motion-arrow)" />
		<path d="M14 58h74" stroke="var(--ill-mat)" stroke-width="2.5" stroke-linecap="round" />

	{:else if key === 'standing-side-bend'}
		<!-- Side reach overhead swaying into curve -->
		<g class="anim-side-sway">
			<circle cx="48" cy="18" r="7" fill="var(--ill-skin)" />
			<path d="M46 26c-8 12-4 22 2 36" fill="none" stroke="var(--ill-body)" stroke-width="6" stroke-linecap="round" />
			<path d="M48 26l-18-6c8-10 18-10 26-2" fill="none" stroke="var(--ill-accent)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
		</g>
		<path class="anim-dash-flow" d="M60 16c-10-8-24-6-32 2" fill="none" stroke="var(--ill-gold)" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" marker-end="url(#motion-gold-arrow)" />
		<path d="M48 62v10M52 62v10" stroke="var(--ill-body)" stroke-width="4" stroke-linecap="round" />

	{:else if key === 'seated-twist'}
		<!-- Seated spinal twist oscillating -->
		<g class="anim-twist">
			<circle cx="50" cy="20" r="7" fill="var(--ill-skin)" />
			<path d="M45 28c5-2 10-2 14 2l-2 22-16 0z" fill="var(--ill-body)" />
			<path d="M40 52c-8 0-14 8 0 10h22c10-2 6-10-2-10z" fill="var(--ill-body)" />
			<path d="M38 36l18-4 6 16" fill="none" stroke="var(--ill-skin)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
		</g>
		<path class="anim-dash-flow" d="M30 36c6-6 26-6 34 0" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" marker-end="url(#motion-arrow)" />

	{:else if key === 'thoracic-rotation'}
		<circle cx="34" cy="38" r="6" fill="var(--ill-skin)" />
		<path d="M34 44v18M72 44v18" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" />
		<path d="M34 44h38" stroke="var(--ill-body)" stroke-width="6" stroke-linecap="round" />
		<g class="anim-thoracic-arm">
			<path d="M46 42l8-22-6 8" fill="none" stroke="var(--ill-accent)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
		</g>
		<path class="anim-dash-flow" d="M42 36c4-12 12-18 18-18" fill="none" stroke="var(--ill-gold)" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" marker-end="url(#motion-gold-arrow)" />

	{:else if key === 'low-lunge'}
		<!-- Deep lunge front knee bent, back knee grounded -->
		<g class="anim-lunge-sink">
			<circle cx="50" cy="18" r="7" fill="var(--ill-skin)" />
			<path d="M48 26v16" stroke="var(--ill-body)" stroke-width="6" stroke-linecap="round" />
			<path d="M48 42l18 4v16" fill="none" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M48 42l-22 8 8 12" fill="none" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
		</g>
		<path class="anim-dash-flow" d="M38 34c6 6 16 8 26 6" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" marker-end="url(#motion-arrow)" />
		<path d="M12 62h76" stroke="var(--ill-mat)" stroke-width="2.5" stroke-linecap="round" />

	{:else if key === 'pigeon-pose'}
		<g class="anim-pigeon-sink">
			<circle cx="68" cy="30" r="7" fill="var(--ill-skin)" />
			<path d="M66 38l-22 8-12 12" fill="none" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M44 46l28 8 16 0" fill="none" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
		</g>
		<path class="anim-dash-flow" d="M62 48c-8 6-18 6-24 2" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" marker-end="url(#motion-arrow)" />
		<path d="M14 62h74" stroke="var(--ill-mat)" stroke-width="2.5" stroke-linecap="round" />

	{:else if key === 'butterfly-stretch'}
		<circle cx="50" cy="20" r="7" fill="var(--ill-skin)" />
		<path d="M44 28c4-2 8-2 12 0l2 24H42z" fill="var(--ill-body)" />
		<g class="anim-butterfly-knees">
			<path d="M42 52L26 50l24 6 24-6-16 2" fill="none" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
		</g>
		<path class="anim-dash-flow" d="M22 46v8" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 2" marker-end="url(#motion-arrow)" />
		<path class="anim-dash-flow" d="M78 46v8" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 2" marker-end="url(#motion-arrow)" />
		<circle cx="50" cy="56" r="3.5" fill="var(--ill-gold)" />

	{:else if key === 'quad-stretch'}
		<circle cx="48" cy="16" r="7" fill="var(--ill-skin)" />
		<path d="M47 24v20" stroke="var(--ill-body)" stroke-width="5.5" stroke-linecap="round" />
		<path d="M47 44v24" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" />
		<g class="anim-quad-pull">
			<path d="M47 44l-12 10 4-18" fill="none" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M47 30l-8 6" stroke="var(--ill-skin)" stroke-width="4" stroke-linecap="round" />
		</g>
		<path class="anim-dash-flow" d="M30 52c-4-6-2-12 4-16" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" marker-end="url(#motion-arrow)" />

	{:else if key === 'forward-fold'}
		<g class="anim-fold-deepen">
			<circle cx="34" cy="44" r="7" fill="var(--ill-skin)" />
			<path d="M56 22l-18 20 8 18" fill="none" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M38 42l4 18" stroke="var(--ill-skin)" stroke-width="3.5" stroke-linecap="round" />
		</g>
		<path d="M56 22v42" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" />
		<path class="anim-dash-flow" d="M48 20c-12 4-18 14-18 24" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" marker-end="url(#motion-arrow)" />
		<path d="M20 64h60" stroke="var(--ill-mat)" stroke-width="2.5" stroke-linecap="round" />

	{:else if key === 'standing-calf'}
		<circle cx="38" cy="20" r="7" fill="var(--ill-skin)" />
		<g class="anim-calf-drive">
			<path d="M38 28l12 12-6 24" fill="none" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M50 40l-24 24" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" />
			<path d="M38 30l28-6" stroke="var(--ill-skin)" stroke-width="4" stroke-linecap="round" />
		</g>
		<path class="anim-dash-flow" d="M42 46l10-4" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 2" marker-end="url(#motion-arrow)" />
		<path d="M68 12v54" stroke="var(--ill-body)" stroke-width="3" stroke-linecap="round" />

	{:else if key === 'hamstring-fold'}
		<g class="anim-hamstring-reach">
			<circle cx="34" cy="30" r="7" fill="var(--ill-skin)" />
			<path d="M34 38l22 10 24 0" fill="none" stroke="var(--ill-body)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M34 38l38 8" stroke="var(--ill-skin)" stroke-width="4" stroke-linecap="round" />
		</g>
		<path class="anim-dash-flow" d="M44 32c8 4 18 4 26 2" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" marker-end="url(#motion-arrow)" />
		<path d="M14 56h72" stroke="var(--ill-mat)" stroke-width="2.5" stroke-linecap="round" />

	{:else if key === 'worlds-greatest'}
		<circle cx="46" cy="34" r="6" fill="var(--ill-skin)" />
		<path d="M46 40l18 4v18" fill="none" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M46 40l-26 12 10 10" fill="none" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
		<g class="anim-world-arm">
			<path d="M46 40L64 16" stroke="var(--ill-accent)" stroke-width="4.5" stroke-linecap="round" />
			<circle cx="66" cy="14" r="4" fill="var(--ill-gold)" />
		</g>
		<path class="anim-dash-flow" d="M48 36c4-12 12-18 18-20" fill="none" stroke="var(--ill-gold)" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" marker-end="url(#motion-gold-arrow)" />
		<path d="M12 64h76" stroke="var(--ill-mat)" stroke-width="2.5" stroke-linecap="round" />

	{:else if key === 'plank-hold'}
		<!-- Straight plank hold with tension stability rays -->
		<g class="anim-plank-breath">
			<circle cx="20" cy="32" r="6" fill="var(--ill-skin)" />
			<path d="M22 36l58 14" stroke="var(--ill-body)" stroke-width="6.5" stroke-linecap="round" />
			<path d="M30 40v18" stroke="var(--ill-skin)" stroke-width="4.5" stroke-linecap="round" />
			<path d="M78 50v8" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" />
		</g>
		<!-- Stability pulse marks -->
		<path class="motion-pulse" d="M40 34l-2-6M52 38l0-6M64 42l2-6" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" />
		<path d="M12 60h76" stroke="var(--ill-mat)" stroke-width="2.5" stroke-linecap="round" />

	{:else if key === 'wall-sit'}
		<!-- Wall sit 90 degree knees with hold pulse -->
		<circle cx="36" cy="20" r="7" fill="var(--ill-skin)" />
		<g class="anim-wall-pulse">
			<path d="M36 28v20" stroke="var(--ill-body)" stroke-width="6" stroke-linecap="round" />
			<path d="M36 48h22v22" fill="none" stroke="var(--ill-body)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" />
		</g>
		<path class="motion-pulse" d="M42 42l4-4M50 42l4-4" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" />
		<path d="M26 12v60" stroke="var(--ill-mat)" stroke-width="4" stroke-linecap="round" />
		<path d="M24 72h54" stroke="var(--ill-mat)" stroke-width="2.5" stroke-linecap="round" />

	{:else if key === 'squat'}
		<!-- Squat pose descending and rising -->
		<g class="anim-squat-cycle">
			<circle cx="50" cy="22" r="7" fill="var(--ill-skin)" />
			<path d="M50 30v14" stroke="var(--ill-body)" stroke-width="6" stroke-linecap="round" />
			<path d="M50 44l-18 8 10 18M50 44l18 8-10 18" fill="none" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M50 34l-14 8M50 34l14 8" stroke="var(--ill-skin)" stroke-width="4" stroke-linecap="round" />
		</g>
		<path class="anim-dash-flow" d="M50 14v10" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 2" marker-end="url(#motion-arrow)" />

	{:else if key === 'push-up'}
		<!-- Push-up horizontal body lowering & pushing up -->
		<g class="anim-pushup-cycle">
			<circle cx="22" cy="38" r="6" fill="var(--ill-skin)" />
			<path d="M24 42l56 10" stroke="var(--ill-body)" stroke-width="6" stroke-linecap="round" />
			<path d="M34 44l-6 14" stroke="var(--ill-skin)" stroke-width="4.5" stroke-linecap="round" />
			<path d="M78 52v6" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" />
		</g>
		<path class="anim-dash-flow" d="M34 36v10" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 2" marker-end="url(#motion-arrow)" />
		<path d="M12 60h76" stroke="var(--ill-mat)" stroke-width="2.5" stroke-linecap="round" />

	{:else if key === 'bridge-hold'}
		<!-- Glute bridge lift pulsing up -->
		<circle cx="22" cy="54" r="6" fill="var(--ill-skin)" />
		<g class="anim-bridge-pulse">
			<path d="M24 56l28-18 22 18" fill="none" stroke="var(--ill-body)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
			<circle cx="52" cy="34" r="3.5" fill="var(--ill-gold)" />
		</g>
		<path d="M74 56v8" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" />
		<path class="anim-dash-flow" d="M52 46v-10" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 2" marker-end="url(#motion-arrow)" />
		<path d="M12 64h76" stroke="var(--ill-mat)" stroke-width="2.5" stroke-linecap="round" />

	{:else if key === 'downward-dog'}
		<!-- Inverted V yoga pose with heel pedal wave -->
		<circle cx="34" cy="46" r="6" fill="var(--ill-skin)" />
		<g class="anim-dog-pedal">
			<path d="M54 22L28 54M54 22L76 56" stroke="var(--ill-body)" stroke-width="6" stroke-linecap="round" />
		</g>
		<path d="M28 54H16M76 56h8" stroke="var(--ill-body)" stroke-width="3" stroke-linecap="round" />
		<path class="anim-dash-flow" d="M44 32c4-12 12-16 16-16" fill="none" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" marker-end="url(#motion-arrow)" />
		<path d="M12 60h76" stroke="var(--ill-mat)" stroke-width="2.5" stroke-linecap="round" />

	{:else if key === 'warrior-two'}
		<!-- Warrior 2 stance with power pulse -->
		<circle cx="50" cy="20" r="7" fill="var(--ill-skin)" />
		<g class="anim-warrior-pulse">
			<path d="M50 28v18" stroke="var(--ill-body)" stroke-width="6" stroke-linecap="round" />
			<path d="M50 46l-22 4v18M50 46l26 12-4 10" fill="none" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M50 32H20M50 32h30" stroke="var(--ill-accent)" stroke-width="4.5" stroke-linecap="round" />
		</g>
		<path class="motion-pulse" d="M14 32h4M82 32h4" stroke="var(--ill-gold)" stroke-width="2.5" stroke-linecap="round" />

	{:else if key === 'triangle-pose'}
		<!-- Triangle yoga reach with extension line -->
		<g class="anim-triangle-reach">
			<circle cx="44" cy="22" r="6" fill="var(--ill-skin)" />
			<path d="M44 28l-14 26M44 28l26 26" stroke="var(--ill-body)" stroke-width="5.5" stroke-linecap="round" />
			<path d="M30 54L18 36M30 54L48 14" stroke="var(--ill-accent)" stroke-width="4.5" stroke-linecap="round" />
			<circle cx="48" cy="12" r="3.5" fill="var(--ill-gold)" />
		</g>
		<path class="anim-dash-flow" d="M42 22l6-10" fill="none" stroke="var(--ill-gold)" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 2" marker-end="url(#motion-gold-arrow)" />

	{:else if key === 'tree-pose'}
		<!-- Tree pose balance equilibrium sway -->
		<g class="anim-tree-sway">
			<circle cx="50" cy="18" r="7" fill="var(--ill-skin)" />
			<path d="M50 26v22M50 48v22" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" />
			<path d="M50 52l-14-6 14-8" fill="none" stroke="var(--ill-body)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M50 32L34 24M50 32l16-8" stroke="var(--ill-skin)" stroke-width="4" stroke-linecap="round" />
			<circle cx="50" cy="10" r="3.5" fill="var(--ill-gold)" />
		</g>
		<circle class="motion-pulse" cx="50" cy="10" r="7" fill="none" stroke="var(--ill-gold)" stroke-width="1.5" stroke-dasharray="2 3" />

	{:else if key === 'jumping-jacks'}
		<!-- Star jumping jack dynamic opening & closing -->
		<g class="anim-jack-jump">
			<circle cx="50" cy="20" r="7" fill="var(--ill-skin)" />
			<path d="M50 28v20M50 48L30 68M50 48l20 20" stroke="var(--ill-body)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M50 34L26 18M50 34l24-18" stroke="var(--ill-accent)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
			<circle cx="24" cy="16" r="3.5" fill="var(--ill-gold)" /><circle cx="76" cy="16" r="3.5" fill="var(--ill-gold)" />
		</g>
		<!-- Jump motion indicators -->
		<path class="motion-pulse" d="M18 12l6 4M82 12l-6 4M24 74l6-4M76 74l-6-4" stroke="var(--ill-gold)" stroke-width="2" stroke-linecap="round" />

	{:else if key === 'mountain-climbers'}
		<!-- Mountain climber running plank with driving knee -->
		<circle cx="24" cy="34" r="6" fill="var(--ill-skin)" />
		<path d="M26 38l54 12" stroke="var(--ill-body)" stroke-width="6" stroke-linecap="round" />
		<g class="anim-climber-knee">
			<path d="M44 42l-12 12 16 2" fill="none" stroke="var(--ill-accent)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
		</g>
		<path d="M30 42v16" stroke="var(--ill-skin)" stroke-width="4" stroke-linecap="round" />
		<path class="anim-dash-flow" d="M48 48L34 44" fill="none" stroke="var(--ill-gold)" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 2" marker-end="url(#motion-gold-arrow)" />
		<path d="M12 60h76" stroke="var(--ill-mat)" stroke-width="2.5" stroke-linecap="round" />

	{:else if key === 'leg-swings'}
		<!-- Standing leg swing oscillating smoothly -->
		<circle cx="45" cy="18" r="7" fill="var(--ill-skin)" />
		<path d="M45 26v22M45 48v22" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" />
		<g class="anim-leg-pendulum">
			<path d="M45 48l22-12" stroke="var(--ill-accent)" stroke-width="5" stroke-linecap="round" />
		</g>
		<path class="anim-dash-flow" d="M67 36a12 12 0 0 1-18 20" fill="none" stroke="var(--ill-gold)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="3 3" marker-end="url(#motion-gold-arrow)" />

	{:else if key === 'deep-squat-pry'}
		<!-- Malasana deep squat pry with shifting knees -->
		<g class="anim-pry-shift">
			<circle cx="50" cy="28" r="7" fill="var(--ill-skin)" />
			<path d="M50 36v12" stroke="var(--ill-body)" stroke-width="6" stroke-linecap="round" />
			<path d="M50 48L28 56l12 12M50 48l22 8-12 12" fill="none" stroke="var(--ill-body)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M38 46h24" stroke="var(--ill-skin)" stroke-width="4.5" stroke-linecap="round" />
		</g>
		<path class="anim-dash-flow" d="M32 44h-6M68 44h6" stroke="var(--ill-accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 2" />

	{:else}
		<!-- General Pose Silhouette with breathing reach -->
		<g class="anim-general-reach">
			<circle cx="50" cy="22" r="8" fill="var(--ill-skin)" />
			<path d="M50 30v22M50 52l-10 18M50 52l10 18" stroke="var(--ill-body)" stroke-width="5.5" stroke-linecap="round" />
			<path d="M50 34L30 22M50 34l20-12" stroke="var(--ill-accent)" stroke-width="4.5" stroke-linecap="round" />
			<circle cx="30" cy="20" r="3.5" fill="var(--ill-gold)" /><circle cx="70" cy="20" r="3.5" fill="var(--ill-gold)" />
		</g>
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

	/* ==========================================================================
	   SMOOTH VECTOR MOTION ANIMATIONS
	   ========================================================================== */

	/* Traveling Dash Lines */
	.animated .anim-dash-flow {
		animation: dashFlow 2s linear infinite;
	}
	@keyframes dashFlow {
		to {
			stroke-dashoffset: -20;
		}
	}

	/* Pulsing Indicators */
	.animated .motion-pulse {
		animation: pulseGlow 1.8s ease-in-out infinite alternate;
	}
	@keyframes pulseGlow {
		0% {
			opacity: 0.3;
			transform: scale(0.96);
		}
		100% {
			opacity: 1;
			transform: scale(1.04);
		}
	}

	/* Spine Cat-Cow Flexion */
	.animated .anim-cat-cow-spine {
		animation: catCowSpine 2.8s ease-in-out infinite alternate;
		transform-origin: 52px 44px;
	}
	@keyframes catCowSpine {
		0% {
			transform: scaleY(1);
		}
		100% {
			transform: scaleY(-0.7) translateY(8px);
		}
	}
	.animated .anim-cat-cow-wave {
		animation: catCowWave 2.8s ease-in-out infinite alternate;
	}
	@keyframes catCowWave {
		0% {
			opacity: 0.2;
			transform: translateY(0);
		}
		100% {
			opacity: 0.9;
			transform: translateY(-4px);
		}
	}

	/* Squat Lowering & Ascending */
	.animated .anim-squat-cycle {
		animation: squatMove 2.4s ease-in-out infinite alternate;
		transform-origin: 50px 70px;
	}
	@keyframes squatMove {
		0% {
			transform: translateY(0) scaleY(1);
		}
		100% {
			transform: translateY(6px) scaleY(0.85);
		}
	}

	/* Push-Up Pressing */
	.animated .anim-pushup-cycle {
		animation: pushUpMove 2.2s ease-in-out infinite alternate;
		transform-origin: 78px 52px;
	}
	@keyframes pushUpMove {
		0% {
			transform: translateY(0) rotate(0deg);
		}
		100% {
			transform: translateY(6px) rotate(-3deg);
		}
	}

	/* Jumping Jack Star Jump */
	.animated .anim-jack-jump {
		animation: jackJump 1.4s ease-in-out infinite alternate;
		transform-origin: 50px 48px;
	}
	@keyframes jackJump {
		0% {
			transform: scale(0.92) translateY(2px);
		}
		100% {
			transform: scale(1.04) translateY(-2px);
		}
	}

	/* Rotational Spins */
	.animated .anim-spin-fast {
		animation: spinClockwise 2.5s linear infinite;
		transform-origin: 16px 36px;
	}
	.animated .anim-spin-fast-rev {
		animation: spinCounterClockwise 2.5s linear infinite;
		transform-origin: 84px 36px;
	}
	.animated .anim-spin-slow {
		animation: spinClockwise 4s linear infinite;
		transform-origin: 30px 40px;
	}
	.animated .anim-spin-slow-rev {
		animation: spinCounterClockwise 4s linear infinite;
		transform-origin: 70px 40px;
	}
	@keyframes spinClockwise {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes spinCounterClockwise {
		to {
			transform: rotate(-360deg);
		}
	}

	/* Neck Release Tilt */
	.animated .anim-neck {
		animation: neckTilt 2.8s ease-in-out infinite alternate;
		transform-origin: 50px 36px;
	}
	@keyframes neckTilt {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(12deg);
		}
	}

	/* Shoulder Shrug */
	.animated .anim-shrug {
		animation: shrugMove 2.4s ease-in-out infinite alternate;
		transform-origin: 50px 50px;
	}
	@keyframes shrugMove {
		0% {
			transform: translateY(0);
		}
		100% {
			transform: translateY(-3px) scaleY(1.06);
		}
	}

	/* Side Bend Sway */
	.animated .anim-side-sway {
		animation: sideSway 2.6s ease-in-out infinite alternate;
		transform-origin: 50px 62px;
	}
	@keyframes sideSway {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(-8deg);
		}
	}

	/* Seated Twist */
	.animated .anim-twist {
		animation: seatedTwist 3s ease-in-out infinite alternate;
		transform-origin: 50px 52px;
	}
	@keyframes seatedTwist {
		0% {
			transform: scaleX(1);
		}
		100% {
			transform: scaleX(0.85) skewY(2deg);
		}
	}

	/* Chest Opener Expansion */
	.animated .anim-chest {
		animation: chestExpand 2.8s ease-in-out infinite alternate;
		transform-origin: 50px 33px;
	}
	@keyframes chestExpand {
		0% {
			transform: scale(0.97);
		}
		100% {
			transform: scale(1.05) translateY(-2px);
		}
	}

	/* Leg Swings Pendulum */
	.animated .anim-leg-pendulum {
		animation: legSwing 1.8s ease-in-out infinite alternate;
		transform-origin: 45px 48px;
	}
	@keyframes legSwing {
		0% {
			transform: rotate(-25deg);
		}
		100% {
			transform: rotate(25deg);
		}
	}

	/* Mountain Climber Knee Drive */
	.animated .anim-climber-knee {
		animation: climberKnee 1.2s ease-in-out infinite alternate;
		transform-origin: 44px 42px;
	}
	@keyframes climberKnee {
		0% {
			transform: translateX(6px) scaleX(0.8);
		}
		100% {
			transform: translateX(-6px) scaleX(1.1);
		}
	}

	/* Glute Bridge Elevation */
	.animated .anim-bridge-pulse {
		animation: bridgeLift 2.2s ease-in-out infinite alternate;
		transform-origin: 24px 56px;
	}
	@keyframes bridgeLift {
		0% {
			transform: translateY(0);
		}
		100% {
			transform: translateY(-5px);
		}
	}

	/* Deep Squat Pry Shift */
	.animated .anim-pry-shift {
		animation: pryShift 2.6s ease-in-out infinite alternate;
		transform-origin: 50px 48px;
	}
	@keyframes pryShift {
		0% {
			transform: translateX(-3px);
		}
		100% {
			transform: translateX(3px);
		}
	}

	/* Butterfly Knees Pulse */
	.animated .anim-butterfly-knees {
		animation: butterflyPulse 2.2s ease-in-out infinite alternate;
		transform-origin: 50px 52px;
	}
	@keyframes butterflyPulse {
		0% {
			transform: scaleY(0.9);
		}
		100% {
			transform: scaleY(1.1);
		}
	}

	/* Quad Pull */
	.animated .anim-quad-pull {
		animation: quadPull 2.5s ease-in-out infinite alternate;
		transform-origin: 47px 44px;
	}
	@keyframes quadPull {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(-8deg);
		}
	}

	/* Forward Fold Deepening */
	.animated .anim-fold-deepen {
		animation: foldDeepen 2.8s ease-in-out infinite alternate;
		transform-origin: 56px 22px;
	}
	@keyframes foldDeepen {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(6deg);
		}
	}

	/* Cobra Lift */
	.animated .anim-cobra-lift {
		animation: cobraLift 2.6s ease-in-out infinite alternate;
		transform-origin: 52px 55px;
	}
	@keyframes cobraLift {
		0% {
			transform: translateY(0) rotate(0deg);
		}
		100% {
			transform: translateY(-4px) rotate(-4deg);
		}
	}

	/* Child's Pose Stretch */
	.animated .anim-childs-pose {
		animation: childsStretch 3s ease-in-out infinite alternate;
		transform-origin: 75px 48px;
	}
	@keyframes childsStretch {
		0% {
			transform: scaleX(0.96);
		}
		100% {
			transform: scaleX(1.04);
		}
	}

	/* World's Greatest Reach */
	.animated .anim-world-arm {
		animation: worldArmSweep 2.5s ease-in-out infinite alternate;
		transform-origin: 46px 40px;
	}
	@keyframes worldArmSweep {
		0% {
			transform: rotate(-10deg);
		}
		100% {
			transform: rotate(8deg);
		}
	}

	/* General Reach Pulse */
	.animated .anim-general-reach {
		animation: generalReach 2.6s ease-in-out infinite alternate;
		transform-origin: 50px 52px;
	}
	@keyframes generalReach {
		0% {
			transform: scale(0.96);
		}
		100% {
			transform: scale(1.03) translateY(-1px);
		}
	}

	/* Respect accessibility */
	@media (prefers-reduced-motion: reduce) {
		.stretch-illustration * {
			animation: none !important;
		}
	}
</style>
