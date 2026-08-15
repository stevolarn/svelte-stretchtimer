<script lang="ts">
	let {
		value = $bindable(30),
		min = 5,
		max = 3600,
		step = 5,
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
		const remainder = value % step;
		const next = remainder !== 0 ? value - remainder : value - step;
		value = Math.max(min, next);
		onchange?.();
	}
	function inc(): void {
		const remainder = value % step;
		const next = remainder !== 0 ? value + (step - remainder) : value + step;
		value = Math.min(max, next);
		onchange?.();
	}
</script>

<div class="stepper">
	<button type="button" onclick={dec} disabled={value <= min} aria-label="Decrease">−</button>
	<span class="value">{value}{suffix}</span>
	<button type="button" onclick={inc} disabled={value >= max} aria-label="Increase">+</button>
</div>

<style>
	.stepper {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 0.25rem 0.4rem;
	}
	.stepper button {
		width: 2.4rem;
		height: 2.4rem;
		border-radius: 9px;
		border: none;
		background: var(--surface-2);
		color: var(--text);
		font-size: 1.2rem;
		font-weight: 700;
		cursor: pointer;
		line-height: 1;
		display: grid;
		place-items: center;
		touch-action: manipulation;
		transition: background 0.12s, transform 0.06s;
	}
	.stepper button:hover:not(:disabled) {
		background: var(--accent);
		color: #fff;
	}
	.stepper button:active:not(:disabled) {
		transform: scale(0.95);
	}
	.stepper button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.stepper .value {
		min-width: 3.4rem;
		text-align: center;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		font-size: 1.05rem;
	}
</style>
