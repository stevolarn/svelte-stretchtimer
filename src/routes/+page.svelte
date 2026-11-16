<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		addRoutine,
		applyFixer,
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
	import { currentStreak, fixersAvailable, fixerProgress, repairGap, canRepairStreak } from '$lib/streak';
	import { formatSeconds } from '$lib/time';
	import { type Routine } from '$lib/types';
	import StarterArt from '$lib/components/StarterArt.svelte';

	const starterOptions: Array<{ kind: StarterRoutineKind; title: string; description: string }> = [
		{ kind: 'desk-reset', title: 'Desk reset', description: 'Neck, shoulders and wrists' },
		{ kind: 'morning-mobility', title: 'Morning mobility', description: 'Wake up your whole body' },
		{ kind: 'bedtime-wind-down', title: 'Bedtime wind-down', description: 'Slow, gentle evening movement' },
		{ kind: 'lower-body-reset', title: 'Lower-body reset', description: 'Hips, legs and calves' },
		{ kind: 'runner-recovery', title: 'Runner’s recovery', description: 'Easy post-run release' },
		{ kind: 'full-body-mobility', title: 'Full-body mobility', description: 'A balanced daily flow' },
		{ kind: 'posture-fix', title: 'Posture fix', description: 'Upper back, chest and neck' },
		{ kind: 'lower-back-relief', title: 'Lower-back relief', description: 'Gentle floor release for the spine' },
		{ kind: 'hip-opener', title: 'Hip opener', description: 'Deep work for tight hips' },
		{ kind: 'pre-workout-warmup', title: 'Pre-workout warm-up', description: 'Raise heart rate and loosen up' },
		{ kind: 'core-isometrics', title: 'Core isometrics', description: 'Two rounds of core holds' },
		{ kind: 'band-isometrics', title: 'Mini-band isometrics', description: 'Arms and shoulders with a loop band' },
		{ kind: 'isometric-flexibility', title: 'Isometric flexibility', description: 'Contract-relax to gain range' }
	];

	/** Rounded minutes for a starter, computed from its actual timeline. */
	function starterDuration(kind: StarterRoutineKind): string {
		const seconds = timelineTotal(buildTimeline(starterRoutine(kind), settings));
		return `${Math.max(1, Math.round(seconds / 60))} min`;
	}

	let showNewModal = $state(false);

	function createRoutine(): void {
		const r = newRoutine('New routine');
		addRoutine(r);
		showNewModal = false;
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
		showNewModal = false;
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
	const gap = $derived(repairGap(streak));
	const canRepair = $derived(gap.length > 0 && fixers >= gap.length);

	function handleRepairStreak(): void {
		if (gap.length === 0 || fixers < gap.length) return;
		const dateDesc = gap.length === 1 ? gap[0] : `${gap.length} missed days (${gap[0]} to ${gap[gap.length - 1]})`;
		const fixerDesc = gap.length === 1 ? '1 streak fixer' : `${gap.length} streak fixers`;
		if (confirm(`Use ${fixerDesc} to fill in ${dateDesc} and completely restore your streak?`)) {
			applyFixer();
		}
	}
</script>

<svelte:head>
	<title>Stretch Timer</title>
</svelte:head>

<section class="card streak-banner" style="margin-bottom: 0.9rem">
	<div class="spread" style="align-items: center">
		<div>
			<h2 style="font-size: 1.15rem">🔥 {streakNow} day streak</h2>
			<p class="muted small" style="margin: 0.25rem 0 0">
				{fixers} streak fixer{fixers === 1 ? '' : 's'} · {fixerProgress(streak)}/7 days to next
			</p>
		</div>
		<div class="row" style="gap: 0.4rem">
			{#if canRepair}
				<button
					class="btn primary small"
					onclick={handleRepairStreak}
					title={`Repair broken streak (${gap.length} fixer${gap.length === 1 ? '' : 's'})`}
				>
					🩹 Fix streak ({gap.length})
				</button>
			{/if}
			<a class="btn small" href="/stats">Details</a>
		</div>
	</div>
</section>

<div class="spread routine-heading" style="margin-bottom: 0.9rem">
	<h1 style="font-size: 1.3rem">Routines</h1>
	<div class="row routine-heading-actions">
		<button class="btn small" onclick={downloadBackup} title="Export routines as backup">⇩ Back up</button>
		<label class="btn small" class:disabled={importing} title="Import routines from backup">
			⇧ Restore
			<input class="sr-only" type="file" accept="application/json,.json" onchange={restoreBackup} disabled={importing} />
		</label>
		<button class="btn primary" onclick={() => (showNewModal = true)}>
			＋ New routine
		</button>
	</div>
</div>

{#if routines.length > 0}
	<div class="routine-tools">
		<input type="text" bind:value={query} placeholder="Search routines..." aria-label="Search routines" />
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
	<section class="card empty-routines-card">
		<div class="empty-state-header">
			<h2>Create your first routine</h2>
			<p class="muted small" style="margin: 0.25rem 0 0.75rem">
				Start with a blank routine or choose a ready-to-go stretching flow.
			</p>
		</div>
		<button class="btn primary new-blank-button" onclick={createRoutine} style="margin-bottom: 1rem">
			＋ Create blank routine
		</button>
		<div class="muted small" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem">
			Or choose a starter routine
		</div>
		<div class="starter-grid">
			{#each starterOptions as option (option.kind)}
				<button class="starter-option" onclick={() => addTemplate(option.kind)}>
					<StarterArt kind={option.kind} />
					<span class="starter-option-copy">
						<strong>{option.title}</strong>
						<span class="muted small">{option.description}</span>
						<span class="starter-duration">{starterDuration(option.kind)}</span>
					</span>
				</button>
			{/each}
		</div>
	</section>
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
				<p class="routine-stretch-summary muted small">
					{r.stretches.map((s) => (s.sides === 'two' ? `${s.name || 'Stretch'} (L/R)` : (s.name || 'Stretch'))).join(' · ')}
				</p>
			{/if}
			<div class="row routine-card-actions">
				<button class="btn primary small play-btn" onclick={() => play(r)} disabled={r.stretches.length === 0}>
					▶ Play
				</button>
				<button class="btn small" onclick={() => edit(r)}>Edit</button>
				<button class="btn small" onclick={() => duplicate(r)}>Duplicate</button>
				<button class="btn small danger" onclick={() => remove(r)}>Delete</button>
			</div>
		</div>
	{/each}
{/if}

{#if showNewModal}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={() => (showNewModal = false)}>
		<div class="modal-sheet" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<div>
					<h2 style="font-size: 1.15rem">Add Routine</h2>
					<p class="muted small" style="margin: 0.15rem 0 0">Choose a quick start or create from scratch</p>
				</div>
				<button class="icon-btn close-modal-btn" onclick={() => (showNewModal = false)} aria-label="Close">✕</button>
			</div>
			<button class="btn primary new-blank-button" onclick={createRoutine} style="margin-bottom: 0.75rem">
				＋ Create blank routine
			</button>
			<div class="muted small" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem">
				Or choose a quick start routine
			</div>
			<div class="starter-grid modal-starter-grid">
				{#each starterOptions as option (option.kind)}
					<button class="starter-option" onclick={() => addTemplate(option.kind)}>
						<StarterArt kind={option.kind} />
						<span class="starter-option-copy">
							<strong>{option.title}</strong>
							<span class="muted small">{option.description}</span>
							<span class="starter-duration">{starterDuration(option.kind)}</span>
						</span>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}
