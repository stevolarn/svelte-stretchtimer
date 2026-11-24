<script lang="ts">
	import { muscleLabels, routineMuscles, type Muscle } from '$lib/muscles';
	import type { Routine } from '$lib/types';

	/** Either a single stretch's muscles, or a whole routine to summarise with counts. */
	let { muscles, routine, limit = 0 }: { muscles?: Muscle[]; routine?: Pick<Routine, 'stretches'>; limit?: number } =
		$props();

	const items = $derived(routine ? routineMuscles(routine) : (muscles ?? []).map((muscle) => ({ muscle, count: 0 })));
	let expanded = $state(false);
	const shown = $derived(limit > 0 && !expanded ? items.slice(0, limit) : items);
</script>

{#if items.length > 0}
	<ul class="muscle-chips" aria-label="Muscles worked">
		{#each shown as { muscle, count } (muscle)}
			<li class="muscle-chip">
				{muscleLabels[muscle]}{#if count > 1}<span class="muscle-count">×{count}</span>{/if}
			</li>
		{/each}
		{#if shown.length < items.length}
			<li>
				<button type="button" class="muscle-chip more" onclick={() => (expanded = true)}>+{items.length - shown.length} more</button>
			</li>
		{/if}
	</ul>
{/if}

<style>
	.muscle-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.muscle-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		color: var(--text);
		font-size: 0.78rem;
		line-height: 1.4;
	}
	.muscle-count {
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	button.muscle-chip {
		font: inherit;
		font-size: 0.78rem;
		color: var(--muted);
		cursor: pointer;
	}
</style>
