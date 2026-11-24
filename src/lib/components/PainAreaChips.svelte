<script lang="ts">
	import { PAIN_AREAS } from '$lib/stores.svelte';
	import type { PainArea } from '$lib/types';

	let {
		selected = $bindable([]),
		label = 'Where?',
		onchange
	}: {
		selected?: PainArea[];
		label?: string;
		onchange?: (areas: PainArea[]) => void;
	} = $props();

	function toggle(id: PainArea): void {
		selected = selected.includes(id) ? selected.filter((a) => a !== id) : [...selected, id];
		onchange?.(selected);
	}
</script>

<div class="area-chips" role="group" aria-label={label}>
	{#each PAIN_AREAS as area (area.id)}
		<button type="button" class="area-chip" class:on={selected.includes(area.id)} aria-pressed={selected.includes(area.id)} onclick={() => toggle(area.id)}>
			{area.label}
		</button>
	{/each}
</div>

<style>
	.area-chips {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.35rem;
	}
	.area-chip {
		min-height: 2.1rem;
		padding: 0.25rem 0.7rem;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}
	.area-chip.on {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}
</style>
