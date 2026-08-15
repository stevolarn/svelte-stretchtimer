<script lang="ts">
	let {
		value = $bindable(30),
		min = 1,
		max = 3600,
		step = 1,
		suffix = 's',
		onchange
	}: {
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		suffix?: string;
		onchange?: () => void;
	} = $props();

	function dec(): void {
		value = Math.max(min, value - step);
		onchange?.();
	}
	function inc(): void {
		value = Math.min(max, value + step);
		onchange?.();
	}
</script>

<div class="stepper">
	<button type="button" onclick={dec} aria-label="Decrease">−</button>
	<span class="value">{value}{suffix}</span>
	<button type="button" onclick={inc} aria-label="Increase">+</button>
</div>

<style>
	.stepper {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.25rem 0.4rem;
	}
	.stepper button {
		width: 2rem;
		height: 2rem;
		border-radius: 8px;
		border: none;
		background: var(--surface-2);
		color: var(--text);
		font-size: 1.1rem;
		font-weight: 700;
		cursor: pointer;
		line-height: 1;
	}
	.stepper button:hover {
		background: var(--accent);
		color: #fff;
	}
	.stepper .value {
		min-width: 3.2rem;
		text-align: center;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}
</style>
