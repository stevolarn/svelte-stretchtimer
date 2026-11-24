<script lang="ts" generics="T extends { kind: StarterRoutineKind; title: string; description: string }">
	import { recentPainAreas, routines, settings, starterRoutine, type StarterRoutineKind } from '$lib/stores.svelte';
	import { buildTimeline, timelineTotal } from '$lib/timeline';
	import {
		equipmentLabels,
		focusLabels,
		painAreaFocus,
		routineEquipment,
		routineFocus,
		type Equipment,
		type Focus
	} from '$lib/stockTags';
	import { musclesFor, muscleLabels } from '$lib/muscles';
	import StarterArt from './StarterArt.svelte';

	/** Ready-made routines with search and filters; picking one hands it back for preview. */
	let { options, onpick }: { options: T[]; onpick: (option: T) => void } = $props();

	const info = $derived(
		options.map((option) => {
			const r = starterRoutine(option.kind);
			const focus = routineFocus(r);
			const equipment = routineEquipment(r);
			const text = [
				option.title,
				option.description,
				...r.stretches.map((s) => s.name),
				...focus.map((f) => focusLabels[f]),
				...equipment.map((e) => equipmentLabels[e]),
				...r.stretches.flatMap((s) => musclesFor(s).map((m) => muscleLabels[m]))
			]
				.join(' ')
				.toLowerCase();
			return {
				option,
				seconds: timelineTotal(buildTimeline(r, settings)),
				focus,
				equipment,
				reps: r.stretches.some((s) => s.mode === 'reps'),
				added: routines.some((x) => x.name.trim().toLowerCase() === r.name.trim().toLowerCase()),
				text
			};
		})
	);

	let query = $state('');
	let chosenFocus = $state<Focus | 'all' | 'sore'>('all');
	let length = $state<'any' | 'short' | 'medium' | 'long'>('any');
	let kit = $state<Equipment | 'any'>('any');
	let sort = $state<'default' | 'shortest' | 'longest'>('default');

	const soreFocus = $derived(new Set(recentPainAreas().map((a) => painAreaFocus[a])));
	/** Sore spots can age out of the 14-day window while selected; fall back to All. */
	const focus = $derived(chosenFocus === 'sore' && soreFocus.size === 0 ? 'all' : chosenFocus);
	const focusOptions = $derived((Object.keys(focusLabels) as Focus[]).filter((f) => info.some((i) => i.focus.includes(f))));
	const kitOptions = $derived((Object.keys(equipmentLabels) as Equipment[]).filter((e) => e !== 'none' && info.some((i) => i.equipment.includes(e))));
	const lengths = [
		{ id: 'any', label: 'Any length' },
		{ id: 'short', label: '≤ 5 min' },
		{ id: 'medium', label: '5–10 min' },
		{ id: 'long', label: '> 10 min' }
	] as const;

	const visible = $derived(
		info
			.filter((i) => {
				const q = query.trim().toLowerCase();
				if (q && !q.split(/\s+/).every((w) => i.text.includes(w))) return false;
				if (focus === 'sore' && !i.focus.some((f) => soreFocus.has(f))) return false;
				if (focus !== 'all' && focus !== 'sore' && !i.focus.includes(focus)) return false;
				if (length === 'short' && i.seconds > 300) return false;
				if (length === 'medium' && (i.seconds <= 300 || i.seconds > 600)) return false;
				if (length === 'long' && i.seconds <= 600) return false;
				if (kit === 'none' && i.equipment.length > 0) return false;
				if (kit !== 'any' && kit !== 'none' && !i.equipment.includes(kit)) return false;
				return true;
			})
			.toSorted((a, b) => (sort === 'shortest' ? a.seconds - b.seconds : sort === 'longest' ? b.seconds - a.seconds : 0))
	);
	const filtered = $derived(query.trim() !== '' || focus !== 'all' || length !== 'any' || kit !== 'any');

	function clear(): void {
		query = '';
		chosenFocus = 'all';
		length = 'any';
		kit = 'any';
	}

	const minutes = (seconds: number) => `${Math.max(1, Math.round(seconds / 60))} min`;
</script>

<div class="starter-tools">
	<input type="search" bind:value={query} placeholder="Search starters, stretches, muscles" aria-label="Search starter routines" />
	<div class="routine-filter-pills" role="group" aria-label="Starter focus">
		<button class="routine-filter-pill" class:active={focus === 'all'} aria-pressed={focus === 'all'} onclick={() => (chosenFocus = 'all')}>All</button>
		{#if soreFocus.size > 0}
			<button class="routine-filter-pill" class:active={focus === 'sore'} aria-pressed={focus === 'sore'} onclick={() => (chosenFocus = 'sore')}>My sore spots</button>
		{/if}
		{#each focusOptions as f (f)}
			<button class="routine-filter-pill" class:active={focus === f} aria-pressed={focus === f} onclick={() => (chosenFocus = f)}>{focusLabels[f]}</button>
		{/each}
	</div>
	<div class="routine-filter-pills" role="group" aria-label="Starter length">
		{#each lengths as l (l.id)}
			<button class="routine-filter-pill" class:active={length === l.id} aria-pressed={length === l.id} onclick={() => (length = l.id)}>{l.label}</button>
		{/each}
	</div>
	<div class="starter-selects">
		<select bind:value={kit} aria-label="Filter by equipment">
			<option value="any">Any equipment</option>
			<option value="none">No equipment</option>
			{#each kitOptions as e (e)}
				<option value={e}>{equipmentLabels[e]}</option>
			{/each}
		</select>
		<select bind:value={sort} aria-label="Sort starters">
			<option value="default">Suggested order</option>
			<option value="shortest">Shortest first</option>
			<option value="longest">Longest first</option>
		</select>
	</div>
	<div class="starter-count muted small">
		{visible.length} of {info.length} starters
		{#if filtered}<button class="link-btn" onclick={clear}>Clear filters</button>{/if}
	</div>
</div>

{#if visible.length === 0}
	<p class="muted small" style="margin: 0.5rem 0">No starters match. Try fewer filters.</p>
{:else}
	<div class="starter-grid">
		{#each visible as i (i.option.kind)}
			<button class="starter-option" onclick={() => onpick(i.option)}>
				<StarterArt kind={i.option.kind} />
				<span class="starter-option-copy">
					<strong>{i.option.title}</strong>
					<span class="muted small">{i.option.description}</span>
					<span class="starter-meta">
						<span class="starter-duration">{minutes(i.seconds)}</span>
						{#if i.added}<span class="starter-tag added">✓ Added</span>{/if}
						{#each i.focus.slice(0, 2) as f (f)}<span class="starter-tag">{focusLabels[f]}</span>{/each}
						{#if i.equipment.length}<span class="starter-tag">{i.equipment.map((e) => equipmentLabels[e]).join(', ')}</span>{/if}
						{#if i.reps}<span class="starter-tag">Reps</span>{/if}
					</span>
				</span>
			</button>
		{/each}
	</div>
{/if}

<style>
	.starter-tools {
		display: grid;
		gap: 0.45rem;
		margin-bottom: 0.7rem;
	}
	.starter-tools input {
		width: 100%;
		box-sizing: border-box;
	}
	.starter-selects {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.4rem;
	}
	.starter-selects select {
		min-width: 0;
		background: var(--surface);
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: 11px;
		padding: 0.35rem 0.5rem;
		font: inherit;
		font-size: 0.82rem;
	}
	.starter-count {
		display: flex;
		gap: 0.6rem;
		align-items: center;
	}
	.starter-count .link-btn {
		padding: 0;
	}
	.starter-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem;
		margin-top: 0.15rem;
	}
	.starter-tag {
		padding: 0.05rem 0.45rem;
		border-radius: 999px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		font-size: 0.72rem;
		color: var(--muted);
	}
	.starter-tag.added {
		color: var(--ok);
		border-color: var(--ok);
	}
</style>
