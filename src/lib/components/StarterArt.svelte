<script lang="ts">
	import { renderPose } from '$lib/illustrations/figure';
	import { poses } from '$lib/illustrations/poses';

	let { kind }: { kind: string } = $props();

	/** Each starter gets the logo treatment: a warm gradient tile, the stopwatch ring and a white figure. */
	const looks: Record<string, { from: string; to: string; pose: string }> = {
		'desk-reset': { from: '#ff8a66', to: '#e5484d', pose: 'neck-release' },
		'typing-break': { from: '#5fd3a0', to: '#1f9468', pose: 'wrist-flexor' },
		'wrist-relief': { from: '#f7c35f', to: '#dc7f1c', pose: 'prayer-stretch' },
		'thoracic-outlet': { from: '#56b8de', to: '#22679a', pose: 'scalene' },
		'finger-band': { from: '#5ad0f0', to: '#1f8fc4', pose: 'finger-band' },
		'wrist-dumbbells': { from: '#8c9cf8', to: '#4b58c8', pose: 'db-wrist-extension' },
		'wrist-dumbbell-holds': { from: '#7fb0c8', to: '#36667e', pose: 'db-forearm-rotation' },
		'rsi-upper-body': { from: '#ff8f7a', to: '#c43d5c', pose: 'wall-pec' },
		'elbow-relief': { from: '#f2a65a', to: '#b85d1e', pose: 'elbow-glide' },
		'shoulder-rehab': { from: '#6fc3b2', to: '#2a7d74', pose: 'wall-slide' },
		'nerve-glides': { from: '#e47ff2', to: '#9b2bb0', pose: 'nerve-glide' },
		'neck-shoulder-release': { from: '#f39a86', to: '#c24a52', pose: 'upper-trap' },
		'morning-mobility': { from: '#ffb547', to: '#f2702e', pose: 'standing-side-bend' },
		'bedtime-wind-down': { from: '#8f82f7', to: '#5443c9', pose: 'childs-pose' },
		'lower-body-reset': { from: '#3fcfa8', to: '#0f8f86', pose: 'low-lunge' },
		'runner-recovery': { from: '#ff7f9c', to: '#d2336a', pose: 'quad-stretch' },
		'full-body-mobility': { from: '#62bbff', to: '#2f6fe0', pose: 'worlds-greatest' },
		'posture-fix': { from: '#80a6ff', to: '#4a59d4', pose: 'wall-angels' },
		'lower-back-relief': { from: '#c58bfb', to: '#8238cc', pose: 'knees-to-chest' },
		'hip-opener': { from: '#ff92c6', to: '#d0448a', pose: 'pigeon-pose' },
		'pre-workout-warmup': { from: '#ffa45e', to: '#e4561b', pose: 'jumping-jacks' },
		'core-isometrics': { from: '#8d9db8', to: '#46546f', pose: 'plank-hold' },
		'band-isometrics': { from: '#9fd860', to: '#4b9128', pose: 'band-pull-apart' },
		'isometric-flexibility': { from: '#52d2e2', to: '#1b87a8', pose: 'hamstring-press' },
		'neck-shoulder-strength': { from: '#7bd88f', to: '#2d8f5a', pose: 'band-lateral-raise' },
		'tennis-elbow-loading': { from: '#ffb15e', to: '#c4571a', pose: 'db-wrist-extension' },
		'golfers-elbow-loading': { from: '#f08f9c', to: '#b73a55', pose: 'db-wrist-flexion' },
		'wrist-forearm-strength': { from: '#9aa8ff', to: '#5a4fc9', pose: 'db-forearm-rotation' }
	};

	const uid = $props.id();
	const look = $derived(looks[kind] ?? looks['desk-reset']);
	const pose = $derived(renderPose(poses[look.pose] ?? poses.stretch));
	/** Static frame only; glows and motion arrows belong to the full illustrations. */
	const layers = $derived(pose.layers.filter((l) => !('cls' in l && l.cls)));
	const frame = <T,>(values: T[]): T => values[Math.min(pose.still, values.length - 1)];
</script>

<svg class="starter-art" viewBox="0 0 100 75" style="--tile: {look.to}" aria-hidden="true">
	<defs>
		<linearGradient id="{uid}-bg" x1="0" x2="1" y1="0" y2="1">
			<stop offset="0%" stop-color={look.from} />
			<stop offset="100%" stop-color={look.to} />
		</linearGradient>
	</defs>
	<rect width="100" height="75" rx="14" fill="url(#{uid}-bg)" />

	<!-- Stopwatch ring from the app icon -->
	<g fill="none" stroke="#fff" stroke-linecap="round">
		<rect x="45" y="2.5" width="10" height="5" rx="2" fill="#fff" stroke="none" opacity="0.9" />
		<circle cx="50" cy="38" r="28" stroke-width="4" opacity="0.18" />
		<path d="M50 10 A28 28 0 1 1 22 38" stroke-width="4" opacity="0.5" />
	</g>

	<g transform="translate(11 11.4) scale(0.78)">
		{#each layers as layer, i (i)}
			{#if layer.tag === 'rect'}
				<rect x={layer.x} y={layer.y} width={layer.w} height={layer.h} rx={layer.rx} fill={layer.fill} opacity={layer.opacity} />
			{:else if layer.tag === 'circle'}
				<circle cx={frame(layer.cx)} cy={frame(layer.cy)} r={layer.r} fill={layer.fill} opacity={layer.opacity} />
			{:else}
				<path
					d={frame(layer.d)}
					fill={layer.fill ?? 'none'}
					stroke={layer.stroke}
					stroke-width={layer.width}
					stroke-linecap="round"
					stroke-linejoin="round"
					opacity={layer.opacity}
				/>
			{/if}
		{/each}
	</g>
</svg>

<style>
	.starter-art {
		display: block;
		width: 100%;
		height: auto;
		border-radius: 0.9rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		/* White figure in the icon's style; far limbs pick up a little of the tile colour. */
		--ill-shirt: #fff;
		--ill-shirt-far: color-mix(in srgb, #fff 72%, var(--tile));
		--ill-body: #fff;
		--ill-body-far: color-mix(in srgb, #fff 72%, var(--tile));
		--ill-skin: #fff;
		--ill-hair: #fff;
		--ill-shoe: #fff;
		--ill-mat: rgba(255, 255, 255, 0.45);
		--ill-wall: rgba(255, 255, 255, 0.16);
		--ill-band: #ffe08a;
		--ill-weight: #fff;
		--ill-shadow: rgba(0, 0, 0, 0.12);
	}
</style>
