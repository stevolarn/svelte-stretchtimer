<script lang="ts" module>
	/** Colour for a 0-10 pain score: grey at 0, yellow → red from 1 to 10. */
	export function painColor(score: number): string {
		if (score <= 0) return 'var(--ring-bg)';
		const t = (Math.min(10, score) - 1) / 9;
		return `hsl(${Math.round(48 - 48 * t)} 90% ${Math.round(58 - 10 * t)}%)`;
	}
</script>

<script lang="ts">
	import { mapMarks, PAIN_SPOTS, spotKey, spotLabel } from '$lib/painSpots';
	import type { PainSide } from '$lib/types';

	let {
		view = $bindable('front'),
		marks = {},
		selected = null,
		onpick,
		showToggle = true
	}: {
		view?: 'front' | 'back';
		/** spotKey ('elbow-outer:left', 'tailbone') → score 0-10 */
		marks?: Record<string, number>;
		/** spotKey to ring */
		selected?: string | null;
		/** tapping a spot; omit for a read-only map */
		onpick?: (spot: string, side?: PainSide) => void;
		showToggle?: boolean;
	} = $props();

	interface Target {
		key: string;
		spot: string;
		side?: PainSide;
		x: number;
		y: number;
		label: string;
	}

	/** Front view is mirrored: the person's left is on the viewer's right. */
	const targets = $derived.by(() => {
		const out: Target[] = [];
		const mirror = view === 'front' ? 1 : -1;
		for (const s of PAIN_SPOTS) {
			if (!s.map || s.map.view !== view) continue;
			const sides: (PainSide | undefined)[] = s.sided ? ['left', 'right'] : [undefined];
			for (const side of sides) {
				const dir = side === 'right' ? -1 : 1;
				out.push({
					key: spotKey(s.id, side),
					spot: s.id,
					side,
					x: 60 + mirror * dir * s.map.dx,
					y: s.map.y,
					label: spotLabel(s.id, side)
				});
			}
		}
		return out;
	});

	let svg: SVGSVGElement;

	/** Pick the nearest spot to a tap, so a fingertip doesn't need to hit a tiny dot. */
	function tap(event: MouseEvent): void {
		if (!onpick) return;
		const pt = svg.createSVGPoint();
		pt.x = event.clientX;
		pt.y = event.clientY;
		const m = svg.getScreenCTM();
		if (!m) return;
		const p = pt.matrixTransform(m.inverse());
		let best: Target | null = null;
		let bestD = 11;
		for (const t of targets) {
			const d = Math.hypot(t.x - p.x, t.y - p.y);
			if (d < bestD) {
				best = t;
				bestD = d;
			}
		}
		if (best) onpick(best.spot, best.side);
	}

	function key(event: KeyboardEvent, t: Target): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onpick?.(t.spot, t.side);
		}
	}

	const limbs = [1, -1];
	const drawn = $derived(mapMarks(marks));

	/** How many marked spots each view has (shown on the toggle). */
	const counts = $derived.by(() => {
		const c = { front: 0, back: 0 };
		for (const k of Object.keys(drawn)) {
			const v = PAIN_SPOTS.find((s) => s.id === k.split(':')[0])?.map?.view;
			if (v) c[v]++;
		}
		return c;
	});
</script>

<div class="body-map">
	{#if showToggle}
		<div class="view-toggle" role="radiogroup" aria-label="Body view">
			<button type="button" role="radio" aria-checked={view === 'front'} class:on={view === 'front'} onclick={() => (view = 'front')}>Front{#if counts.front}<span class="count">{counts.front}</span>{/if}</button>
			<button type="button" role="radio" aria-checked={view === 'back'} class:on={view === 'back'} onclick={() => (view = 'back')}>Back{#if counts.back}<span class="count">{counts.back}</span>{/if}</button>
		</div>
	{/if}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<svg
		bind:this={svg}
		viewBox="0 -4 120 246"
		role={onpick ? 'group' : 'img'}
		aria-label="{view === 'front' ? 'Front' : 'Back'} of body{onpick ? ', tap where it hurts' : ''}"
		class:pickable={!!onpick}
		onclick={tap}
	>
		<g class="figure">
			<ellipse cx="60" cy="18" rx="11" ry="13" />
			<line x1="60" y1="30" x2="60" y2="44" stroke-width="11" />
			<path d="M38 47 Q60 41 82 47 L80 70 L76 100 L79 126 Q60 132 41 126 L44 100 L40 70 Z" />
			{#each limbs as d (d)}
				<line x1={60 + d * 23} y1="52" x2={60 + d * 30} y2="95" stroke-width="10" />
				<line x1={60 + d * 30} y1="95" x2={60 + d * 35} y2="132" stroke-width="8" />
				<ellipse cx={60 + d * 36.5} cy="147" rx="5" ry="10" />
				<line x1={60 + d * 11} y1="126" x2={60 + d * 13} y2="172" stroke-width="15" />
				<line x1={60 + d * 13} y1="172" x2={60 + d * 13} y2="219" stroke-width="11" />
				<ellipse cx={60 + d * 14.5} cy="230" rx="5.5" ry="5" />
			{/each}
		</g>
		<text class="side-label" x="6" y="8">{view === 'front' ? 'R' : 'L'}</text>
		<text class="side-label" x="114" y="8" text-anchor="end">{view === 'front' ? 'L' : 'R'}</text>
		{#each targets as t (t.key)}
			{@const score = drawn[t.key]}
			{#if onpick || score !== undefined}
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<circle
				class="spot"
				class:marked={score !== undefined}
				class:selected={selected === t.key}
				cx={t.x}
				cy={t.y}
				r={score !== undefined ? 4.6 : 2.4}
				style:fill={score !== undefined ? painColor(score) : undefined}
				role={onpick ? 'button' : undefined}
				tabindex={onpick ? 0 : undefined}
				aria-label={score !== undefined ? `${t.label}, ${score} out of 10` : t.label}
				onkeydown={(e) => key(e, t)}
			>
				<title>{t.label}{score !== undefined ? ` · ${score}/10` : ''}</title>
			</circle>
			{#if score !== undefined && score > 0}
				<text class="score" x={t.x} y={t.y + 1.7} text-anchor="middle">{score}</text>
			{/if}
			{/if}
		{/each}
	</svg>
</div>

<style>
	.body-map {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
	}
	.view-toggle {
		display: inline-flex;
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 2px;
		background: var(--surface-2);
	}
	.view-toggle button {
		border: 0;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		padding: 0.3rem 0.9rem;
		border-radius: 999px;
		cursor: pointer;
	}
	.view-toggle button.on {
		background: var(--surface);
		color: var(--text);
		box-shadow: var(--shadow);
	}
	.count {
		margin-left: 0.3rem;
		font-size: 0.7rem;
		background: var(--accent);
		color: #fff;
		border-radius: 999px;
		padding: 0 0.35rem;
	}
	svg {
		width: 100%;
		max-width: 260px;
		max-height: 52dvh;
		touch-action: manipulation;
		user-select: none;
	}
	svg.pickable {
		cursor: pointer;
	}
	.figure > * {
		fill: var(--surface-2);
		stroke: var(--surface-2);
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.figure > path,
	.figure > ellipse {
		stroke: var(--border);
		stroke-width: 0.6;
	}
	.side-label {
		font-size: 7px;
		font-weight: 700;
		fill: var(--muted);
	}
	.spot {
		fill: var(--border);
		stroke: none;
	}
	.spot.marked {
		stroke: var(--surface);
		stroke-width: 0.8;
	}
	.spot.selected {
		stroke: var(--text);
		stroke-width: 1.2;
	}
	.spot:focus-visible {
		outline: none;
		stroke: var(--accent);
		stroke-width: 1.5;
	}
	.score {
		font-size: 4.6px;
		font-weight: 800;
		fill: #1c1c1c;
		pointer-events: none;
	}
</style>
