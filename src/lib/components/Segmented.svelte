<script lang="ts">
	export interface SegmentedOption {
		value: string;
		label: string;
	}

	let {
		value = $bindable(''),
		options,
		onchange
	}: {
		value?: string;
		options: SegmentedOption[];
		onchange?: (value: string) => void;
	} = $props();
</script>

<div class="segmented" role="tablist">
	{#each options as opt (opt.value)}
		<button
			type="button"
			role="tab"
			aria-selected={value === opt.value}
			class:active={value === opt.value}
			onclick={() => {
				value = opt.value;
				onchange?.(opt.value);
			}}
		>
			{opt.label}
		</button>
	{/each}
</div>

<style>
	.segmented {
		display: inline-flex;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.2rem;
		gap: 0.2rem;
	}
	.segmented button {
		border: none;
		background: transparent;
		color: var(--muted);
		padding: 0.4rem 0.9rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
	}
	.segmented button.active {
		background: var(--surface);
		color: var(--text);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
	}
</style>
