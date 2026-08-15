<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		addRoutine,
		deleteRoutine,
		duplicateRoutine,
		newRoutine,
		routines,
		settings,
		streak
	} from '$lib/stores.svelte';
	import { buildTimeline, timelineTotal } from '$lib/timeline';
	import { currentStreak, fixersAvailable, fixerProgress } from '$lib/streak';
	import { formatSeconds } from '$lib/time';
	import { type Routine } from '$lib/types';

	function createRoutine(): void {
		const r = newRoutine('New routine');
		addRoutine(r);
		goto(`/routine/${r.id}`);
	}

	function play(r: Routine): void {
		goto(`/player/${r.id}`);
	}

	function edit(r: Routine): void {
		goto(`/routine/${r.id}`);
	}

	function remove(r: Routine): void {
		if (confirm(`Delete "${r.name}"? This cannot be undone.`)) {
			deleteRoutine(r.id);
		}
	}

	async function duplicate(r: Routine): Promise<void> {
		await duplicateRoutine(r.id);
	}

	const streakNow = $derived(currentStreak(streak));
	const fixers = $derived(fixersAvailable(streak));
</script>

<svelte:head>
	<title>Stretch Timer</title>
</svelte:head>

<section class="card" style="margin-bottom: 0.9rem">
	<div class="spread">
		<div>
			<h2>🔥 {streakNow} day streak</h2>
			<p class="muted small" style="margin: 0.2rem 0 0">
				{fixers} streak fixer{fixers === 1 ? '' : 's'} · {fixerProgress(streak)}/7 days to the next
			</p>
		</div>
		<a class="btn small" href="/stats">Streak details</a>
	</div>
</section>

<div class="spread" style="margin-bottom: 0.9rem">
	<h1 style="font-size: 1.3rem">Routines</h1>
	<button class="btn primary" onclick={createRoutine}>＋ New routine</button>
</div>

{#if routines.length === 0}
	<div class="card">
		<p class="muted" style="margin: 0">No routines yet. Create one to start timing your stretches.</p>
	</div>
{:else}
	{#each routines as r (r.id)}
		<div class="card routine-card">
			<div class="spread">
				<span class="routine-title">{r.name}</span>
				<span class="stat-row">
					<span class="badge">{r.stretches.length} stretch{r.stretches.length === 1 ? '' : 'es'}</span>
					<span class="badge">⏱ {formatSeconds(timelineTotal(buildTimeline(r, settings)))}</span>
				</span>
			</div>
			{#if r.stretches.length > 0}
				<p class="muted small" style="margin: 0">
					{r.stretches.map((s) => (s.sides === 'two' ? `${s.name} (L/R)` : s.name)).join(' · ')}
				</p>
			{/if}
			<div class="row">
				<button class="btn primary small" onclick={() => play(r)} disabled={r.stretches.length === 0}>
					▶ Play
				</button>
				<button class="btn small" onclick={() => edit(r)}>Edit</button>
				<button class="btn small" onclick={() => duplicate(r)}>Duplicate</button>
				<button class="btn small danger" onclick={() => remove(r)}>Delete</button>
			</div>
		</div>
	{/each}
{/if}
