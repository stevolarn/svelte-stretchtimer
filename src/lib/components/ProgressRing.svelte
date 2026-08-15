<script lang="ts">
	let {
		progress = 1,
		size = 280,
		stroke = 16,
		children
	}: {
		progress?: number;
		size?: number;
		stroke?: number;
		children?: import('svelte').Snippet;
	} = $props();

	const r = $derived((size - stroke) / 2);
	const c = $derived(2 * Math.PI * r);
	const clamped = $derived(Math.max(0, Math.min(1, progress)));
	const offset = $derived(c * (1 - clamped));
</script>

<div class="ring-wrap" style="--size: {size}px">
	<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} class="ring">
		<circle class="ring-bg" cx={size / 2} cy={size / 2} r={r} stroke-width={stroke} fill="none" />
		<circle
			class="ring-fg"
			cx={size / 2}
			cy={size / 2}
			r={r}
			stroke-width={stroke}
			fill="none"
			stroke-dasharray={c}
			stroke-dashoffset={offset}
			stroke-linecap="round"
			transform={`rotate(-90 ${size / 2} ${size / 2})`}
		/>
	</svg>
	{#if children}
		<div class="ring-center">{@render children()}</div>
	{/if}
</div>

<style>
	.ring-wrap {
		position: relative;
		width: var(--size);
		height: var(--size);
	}
	.ring {
		display: block;
		transform: scale(1);
	}
	.ring-bg {
		stroke: var(--ring-bg);
	}
	.ring-fg {
		stroke: var(--accent);
		transition: stroke-dashoffset 0.2s linear;
	}
	.ring-center {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		text-align: center;
		padding: 1rem;
		overflow: hidden;
	}
</style>
