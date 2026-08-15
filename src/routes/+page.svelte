<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		addRoutine,
		deleteRoutine,
		duplicateRoutine,
		exportBackup,
		importBackup,
		newRoutine,
		routines,
		settings,
		streak,
		starterRoutine,
		type StarterRoutineKind
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

	let query = $state('');
	let sort = $state<'recent' | 'name' | 'duration'>('recent');
	let importStatus = $state('');
	let importing = $state(false);

	const visibleRoutines = $derived(
		routines
			.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()))
			.toSorted((a, b) => {
				if (sort === 'name') return a.name.localeCompare(b.name);
				if (sort === 'duration') return timelineTotal(buildTimeline(b, settings)) - timelineTotal(buildTimeline(a, settings));
				return b.createdAt - a.createdAt;
			})
	);

	function addTemplate(kind: StarterRoutineKind): void {
		const routine = starterRoutine(kind);
		addRoutine(routine);
		goto(`/routine/${routine.id}`);
	}

	async function downloadBackup(): Promise<void> {
		const blob = new Blob([await exportBackup()], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `stretch-timer-backup-${new Date().toISOString().slice(0, 10)}.json`;
		link.click();
		URL.revokeObjectURL(url);
		importStatus = 'Backup downloaded.';
	}

	async function restoreBackup(event: Event): Promise<void> {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		importing = true;
		try {
			const result = await importBackup(await file.text());
			importStatus = `${result.added} routine${result.added === 1 ? '' : 's'} restored${result.skipped ? ` · ${result.skipped} skipped` : ''}.`;
		} catch (error) {
			importStatus = error instanceof Error ? error.message : 'Could not restore that backup.';
		} finally {
			importing = false;
			input.value = '';
		}
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
	<div class="row">
		<button class="btn small" onclick={downloadBackup}>⇩ Back up</button>
		<label class="btn small" class:disabled={importing}>
			⇧ Restore
			<input class="sr-only" type="file" accept="application/json,.json" onchange={restoreBackup} disabled={importing} />
		</label>
		<button class="btn primary" onclick={createRoutine}>＋ New routine</button>
	</div>
</div>

<section class="card quick-start" style="margin-bottom: 0.9rem">
	<div class="spread">
		<div>
			<h2>Quick starts</h2>
			<p class="muted small" style="margin: 0.15rem 0 0">Start with a guided routine, then customize it.</p>
		</div>
		<div class="row">
			<button class="btn small" onclick={() => addTemplate('desk-reset')}>Desk reset · 3 min</button>
			<button class="btn small" onclick={() => addTemplate('morning-mobility')}>Morning mobility · 5 min</button>
		</div>
	</div>
</section>

{#if routines.length > 0}
	<div class="routine-tools">
		<input type="text" bind:value={query} placeholder="Search routines" aria-label="Search routines" />
		<select bind:value={sort} aria-label="Sort routines">
			<option value="recent">Recently created</option>
			<option value="name">Name</option>
			<option value="duration">Longest first</option>
		</select>
	</div>
{/if}

{#if importStatus}
	<p class="muted small import-status" role="status">{importStatus}</p>
{/if}

{#if routines.length === 0}
	<div class="card">
		<p class="muted" style="margin: 0">No routines yet. Create one to start timing your stretches.</p>
	</div>
{:else if visibleRoutines.length === 0}
	<div class="card">
		<p class="muted" style="margin: 0">No routines match “{query}”.</p>
	</div>
{:else}
	{#each visibleRoutines as r (r.id)}
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
