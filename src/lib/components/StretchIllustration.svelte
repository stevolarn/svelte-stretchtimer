<script lang="ts">
	import { onMount } from 'svelte';
	import { resolveIconKey } from '$lib/stockStretches';
	import { renderPose, type Layer } from '$lib/illustrations/figure';
	import { poses } from '$lib/illustrations/poses';

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

	// SVG ids are document-global, so prefix them per instance; otherwise every
	// illustration on the page resolves to the first one's (possibly hidden) defs.
	const uid = $props.id();
	/** Corner radius in viewBox units (100 wide); string sizes rely on the CSS clip instead. */
	const rx = $derived(typeof rounded === 'number' && typeof size === 'number' ? (rounded * 100) / size : 0);
	const ref = (v: string | undefined) => v?.replace('url(#', `url(#${uid}-`);

	let reducedMotion = $state(false);
	onMount(() => {
		const query = window.matchMedia('(prefers-reduced-motion: reduce)');
		reducedMotion = query.matches;
		const update = () => (reducedMotion = query.matches);
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	});

	const key = $derived(resolveIconKey(iconKey, name));
	const pose = $derived(renderPose(poses[key] ?? poses.stretch));
	const moving = $derived(animated && !reducedMotion);

	const keyTimes = $derived(pose.order.map((_, i) => (i / (pose.order.length - 1 || 1)).toFixed(3)).join(';'));
	const keySplines = $derived(
		pose.order
			.slice(1)
			.map(() => '0.45 0 0.55 1')
			.join(';')
	);

	/** Animated values for a per-frame attribute, or null when it never changes. */
	function series<T>(values: T[]): string | null {
		if (!moving || values.length < 2 || values.every((v) => v === values[0])) return null;
		return pose.order.map((i) => values[i]).join(';');
	}

	function at<T>(values: T[]): T {
		return values[moving ? 0 : Math.min(pose.still, values.length - 1)];
	}

	function pathValues(layer: Extract<Layer, { tag: 'path' }>) {
		return series(layer.d);
	}
</script>

<svg
	class="stretch-illustration"
	class:animated={moving}
	viewBox="0 0 100 80"
	style="width: {typeof size === 'number' ? `${size}px` : size}; height: auto; aspect-ratio: 5/4; border-radius: {typeof rounded === 'number' ? `${rounded}px` : rounded}; overflow: hidden;"
	aria-hidden="true"
>
	<defs>
		<linearGradient id="{uid}-ill-bg" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0%" stop-color="var(--ill-bg-a)" />
			<stop offset="100%" stop-color="var(--ill-bg-b)" />
		</linearGradient>
		<radialGradient id="{uid}-ill-glow">
			<stop offset="0%" stop-color="var(--ill-gold)" stop-opacity="0.95" />
			<stop offset="55%" stop-color="var(--ill-gold)" stop-opacity="0.45" />
			<stop offset="100%" stop-color="var(--ill-gold)" stop-opacity="0" />
		</radialGradient>
		<marker id="{uid}-motion-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
			<path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--ill-accent)" />
		</marker>
		<marker id="{uid}-motion-gold-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
			<path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--ill-gold)" />
		</marker>
	</defs>

	<rect width="100" height="80" {rx} fill="url(#{uid}-ill-bg)" />

	{#each pose.layers as layer, i (i)}
		{#if layer.tag === 'rect'}
			<rect x={layer.x} y={layer.y} width={layer.w} height={layer.h} rx={layer.rx} fill={layer.fill} opacity={layer.opacity} />
		{:else if layer.tag === 'circle'}
			{@const cx = series(layer.cx)}
			{@const cy = series(layer.cy)}
			<circle class={layer.cls} cx={at(layer.cx)} cy={at(layer.cy)} r={layer.r} fill={ref(layer.fill)} opacity={layer.opacity}>
				{#if cx}<animate attributeName="cx" values={cx} dur="{pose.dur}s" repeatCount="indefinite" calcMode="spline" {keyTimes} {keySplines} />{/if}
				{#if cy}<animate attributeName="cy" values={cy} dur="{pose.dur}s" repeatCount="indefinite" calcMode="spline" {keyTimes} {keySplines} />{/if}
			</circle>
		{:else}
			{@const d = pathValues(layer)}
			<path
				class={layer.cls}
				d={at(layer.d)}
				fill={ref(layer.fill) ?? 'none'}
				stroke={layer.stroke}
				stroke-width={layer.width}
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-dasharray={layer.dash}
				opacity={layer.opacity}
				marker-end={ref(layer.marker)}
			>
				{#if d}<animate attributeName="d" values={d} dur="{pose.dur}s" repeatCount="indefinite" calcMode="spline" {keyTimes} {keySplines} />{/if}
			</path>
		{/if}
	{/each}
</svg>

<style>
	.stretch-illustration {
		display: inline-block;
		vertical-align: middle;
		flex-shrink: 0;
		--ill-bg-a: #eef5fd;
		--ill-bg-b: #cfe3f8;
		--ill-shirt: #2f6fe0;
		--ill-shirt-far: #1d4fae;
		--ill-body: #2b3a55;
		--ill-body-far: #18233a;
		--ill-skin: #f4bf98;
		--ill-hair: #3b2a20;
		--ill-shoe: #0f172a;
		--ill-accent: #2563eb;
		--ill-mat: #8db8ea;
		--ill-wall: rgba(48, 65, 93, 0.16);
		--ill-band: #e2487a;
		--ill-gold: #ffc93c;
		--ill-shadow: rgba(15, 23, 42, 0.12);
	}
	:global(html.dark) .stretch-illustration {
		--ill-bg-a: #1e293b;
		--ill-bg-b: #334155;
		--ill-shirt: #60a5fa;
		--ill-shirt-far: #3b7bd6;
		--ill-body: #e2e8f0;
		--ill-body-far: #a3b1c6;
		--ill-skin: #fed7aa;
		--ill-hair: #9a6b4b;
		--ill-shoe: #0b1220;
		--ill-accent: #93c5fd;
		--ill-mat: #4a6a95;
		--ill-wall: rgba(226, 232, 240, 0.12);
		--ill-band: #fb7aa4;
		--ill-gold: #fde047;
		--ill-shadow: rgba(0, 0, 0, 0.28);
	}

	.animated .anim-dash-flow {
		animation: dashFlow 2s linear infinite;
	}
	@keyframes dashFlow {
		to {
			stroke-dashoffset: -20;
		}
	}

	.animated .glow-pulse {
		animation: glowPulse 2.4s ease-in-out infinite alternate;
	}
	@keyframes glowPulse {
		from {
			opacity: 0.45;
		}
		to {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.stretch-illustration * {
			animation: none !important;
		}
	}
</style>
