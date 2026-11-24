<script lang="ts">
	import { logPain, painLog, setLastPainAreas, undoLastPain } from '$lib/stores.svelte';
	import { todayKey } from '$lib/time';
	import type { PainArea } from '$lib/types';
	import PainAreaChips from './PainAreaChips.svelte';

	/** Quick 0–10 pain score outside a routine; tapping again replaces today's quick score. */
	let { label = 'Log pain now' }: { label?: string } = $props();

	const today = $derived(todayKey());
	const loggedToday = $derived(painLog.filter((p) => p.date === today && p.routineId === null).at(-1)?.score ?? null);
	/** Areas can only be edited while today's quick score is still the latest entry. */
	const quickEntry = $derived.by(() => {
		const last = painLog.at(-1);
		return last && last.routineId === null && last.date === today ? last : null;
	});

	function logPainNow(score: number): void {
		const keep = quickEntry?.areas;
		if (loggedToday !== null && quickEntry) undoLastPain();
		logPain(score, null, false, score > 0 ? keep : []);
	}

	function setQuickAreas(areas: PainArea[]): void {
		if (quickEntry) setLastPainAreas(areas);
	}
</script>

<div class="pain-now">
	<span class="small">{loggedToday === null ? label : `Logged ${loggedToday}/10 today — tap to change`}</span>
	<div class="pain-row">
		{#each Array.from({ length: 11 }, (_, i) => i) as n (n)}
			<button class="pain-btn" class:on={loggedToday === n} aria-label="Pain {n} out of 10" onclick={() => logPainNow(n)}>{n}</button>
		{/each}
	</div>
	{#if quickEntry && quickEntry.score > 0}
		<span class="small where-label">Where? (optional)</span>
		<PainAreaChips selected={quickEntry.areas ?? []} label="Where does it hurt?" onchange={setQuickAreas} />
	{/if}
</div>

<style>
	.pain-now {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.pain-row {
		display: grid;
		grid-template-columns: repeat(11, 1fr);
		gap: 0.2rem;
	}
	.pain-btn {
		aspect-ratio: 1;
		min-width: 0;
		padding: 0;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
	}
	.where-label {
		margin-top: 0.3rem;
	}
	.pain-btn.on {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}
</style>
