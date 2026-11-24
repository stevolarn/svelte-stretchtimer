<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		addRoutine,
		deleteRoutineWithUndo,
		duplicateRoutine,
		newRoutine,
		routines,
		settings,
		starterRoutine,
		type StarterRoutineKind
	} from '$lib/stores.svelte';
	import { buildTimeline, timelineTotal } from '$lib/timeline';
	import { onMount } from 'svelte';
	import { frequencyLabel, goalProgress, scheduleLabel } from '$lib/frequency';
	import { formatSeconds } from '$lib/time';
	import { type Routine } from '$lib/types';
	import StarterArt from '$lib/components/StarterArt.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import StretchIllustration from '$lib/components/StretchIllustration.svelte';
	import PhotoThumb from '$lib/components/PhotoThumb.svelte';
	import { showToast } from '$lib/toast.svelte';

	const starterOptions: Array<{ kind: StarterRoutineKind; title: string; description: string }> = [
		{ kind: 'desk-reset', title: 'Desk reset', description: 'Neck, shoulders and wrists' },
		{ kind: 'typing-break', title: 'Typing break', description: 'A quick reset between keyboard sessions' },
		{ kind: 'rsi-upper-body', title: 'RSI circuit', description: 'Neck to fingertips in one go' },
		{ kind: 'elbow-relief', title: 'Elbow relief', description: 'Tennis and golfer’s elbow rehab' },
		{ kind: 'tennis-elbow-loading', title: 'Tennis elbow loading', description: 'A wrist hold, then 3 × 15 Tyler twists. Loading is the core treatment' },
		{ kind: 'golfers-elbow-loading', title: 'Golfer’s elbow loading', description: 'A wrist hold, then 3 × 15 reverse Tyler twists. Loading is the core treatment' },
		{ kind: 'neck-shoulder-wrist-stretch', title: 'Neck, shoulders & wrists', description: '24 short stretches, 15 seconds each: neck, shoulders, chest and wrists, standing or on a chair' },
		{ kind: 'loop-band-full-body', title: 'Loop band full body', description: '15 beginner moves with a loop band: arms, legs, glutes and core, 10 reps each' },
		{ kind: 'physio-wrist-shoulder', title: 'Physio programme', description: '16 moves for wrist, forearm and shoulder blades, 2–3 sets each' },
		{ kind: 'shoulder-rehab', title: 'Shoulder & upper back', description: 'Rotator cuff and posture work' },
		{ kind: 'neck-shoulder-strength', title: 'Neck & shoulder strength', description: 'About 3 minutes with a light band, most days. The kind of dose that helped office neck pain in trials' },
		{ kind: 'wrist-relief', title: 'Wrist & forearm', description: 'For RSI-prone hands and forearms' },
		{ kind: 'thoracic-outlet', title: 'Thoracic outlet', description: 'Open the neck, chest and collarbone' },
		{ kind: 'finger-band', title: 'Finger band', description: 'Extensor band: reps, holds and slow lowers' },
		{ kind: 'wrist-dumbbells', title: 'Wrist dumbbells', description: 'Six wrist movements, three rounds' },
		{ kind: 'wrist-forearm-strength', title: 'Wrist & forearm strength', description: 'Light dumbbell reps for extension, flexion and rotation, one round' },
		{ kind: 'wrist-dumbbell-holds', title: 'Dumbbell holds', description: 'Isometric holds for all six directions' },
		{ kind: 'nerve-glides', title: 'Nerve glides', description: 'Gentle arm nerve flossing, two rounds' },
		{ kind: 'neck-shoulder-release', title: 'Neck & shoulders', description: 'Ease tension from desk work' },
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
		const r = newRoutine('New routine', settings.breakSeconds);
		addRoutine(r);
		showNewModal = false;
		goto(`/routine/${r.id}`);
	}

	function play(r: Routine, gentle = false): void {
		goto(`/player/${r.id}${gentle ? '?gentle=1' : ''}`);
	}

	function edit(r: Routine): void {
		goto(`/routine/${r.id}`);
	}

	let query = $state('');
	let sort = $state<'recent' | 'name' | 'duration'>('recent');
	let menuFor = $state<string | null>(null);

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

	function remove(r: Routine): void {
		menuFor = null;
		deleteRoutineWithUndo(r.id);
	}

	async function duplicate(r: Routine): Promise<void> {
		menuFor = null;
		const copy = await duplicateRoutine(r.id);
		showToast(`Created “${copy.name}”`);
	}

	function routineMinutes(r: Routine): string {
		return formatSeconds(timelineTotal(buildTimeline(r, settings)));
	}

	/** Ticks each minute so goal pills roll over at midnight. */
	let now = $state(new Date());
	onMount(() => {
		const timer = setInterval(() => (now = new Date()), 60_000);
		return () => clearInterval(timer);
	});
</script>

<svelte:head>
	<title>Routines · Stretch Timer</title>
</svelte:head>

<svelte:window onclick={() => (menuFor = null)} />

<div class="spread routine-heading">
	<h1>Routines</h1>
	{#if routines.length > 0}
		<button class="btn primary" onclick={() => (showNewModal = true)}>＋ New</button>
	{/if}
</div>

{#if routines.length > 3}
	<div class="routine-tools">
		<input type="search" bind:value={query} placeholder="Search routines" aria-label="Search routines" />
		<select bind:value={sort} aria-label="Sort routines">
			<option value="recent">Newest</option>
			<option value="name">A–Z</option>
			<option value="duration">Longest</option>
		</select>
	</div>
{/if}

{#if routines.length === 0}
	<section class="card empty-routines-card">
		<div class="empty-state-header">
			<h2>Create your first routine</h2>
			<p class="muted small" style="margin: 0.25rem 0 0">
				Pick a ready-made flow below, or start from scratch.
			</p>
		</div>
		<button class="btn primary new-blank-button" onclick={createRoutine}>＋ Blank routine</button>
		<div class="section-label">Starter routines</div>
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
	<div class="routine-list">
		{#each visibleRoutines as r (r.id)}
			<article class="card routine-card">
				<a class="routine-card-main" href={`/routine/${r.id}`} aria-label={`Edit ${r.name || 'Untitled routine'}`}>
					<span class="routine-title">{r.name || 'Untitled routine'}</span>
					<span class="routine-meta muted small">
						{r.stretches.length} stretch{r.stretches.length === 1 ? '' : 'es'} · {routineMinutes(r)}{(r.sets ?? 1) > 1 ? ` · ${r.sets} sets` : ''}
					</span>
					{#if r.schedule || r.frequency?.per === 'week'}
						{@const progress = goalProgress(r, now)}
						<span class="goal-pill" class:met={!!progress && progress.done >= progress.target}>
							{r.schedule ? scheduleLabel(r.schedule) : frequencyLabel(r.frequency!)}{progress
								? ` · ${progress.done >= progress.target ? '✓ ' : ''}${Math.min(progress.done, progress.target)}/${progress.target} ${progress.period}`
								: ''}
						</span>
					{/if}
					{#if r.stretches.length > 0}
						<span class="routine-thumbs" aria-hidden="true">
							{#each r.stretches.slice(0, 5) as s (s.id)}
								<span class="routine-thumb">
									{#if s.photoId}
										<PhotoThumb photoId={s.photoId} size={44} />
									{:else}
										<StretchIllustration iconKey={s.iconKey} name={s.name} size={44} rounded={8} animated={false} />
									{/if}
								</span>
							{/each}
							{#if r.stretches.length > 5}
								<span class="routine-thumb more">+{r.stretches.length - 5}</span>
							{/if}
						</span>
					{:else}
						<span class="muted small">No stretches yet — tap to add some</span>
					{/if}
				</a>
				<div class="routine-card-side">
					<button
						class="play-fab"
						onclick={() => play(r)}
						disabled={r.stretches.length === 0}
						aria-label={`Play ${r.name || 'routine'}`}
						title="Play"
					>
						<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>
					</button>
					<div class="menu-wrap">
						<button
							class="icon-btn more-btn"
							aria-label="More actions"
							aria-haspopup="menu"
							aria-expanded={menuFor === r.id}
							onclick={(e) => {
								e.stopPropagation();
								menuFor = menuFor === r.id ? null : r.id;
							}}
						>
							⋯
						</button>
						{#if menuFor === r.id}
							<div class="popover-menu" role="menu">
								<button role="menuitem" onclick={() => edit(r)}>Edit</button>
								<button role="menuitem" onclick={() => duplicate(r)}>Duplicate</button>
								<button role="menuitem" class="danger" onclick={() => remove(r)}>Delete</button>
							</div>
						{/if}
					</div>
				</div>
			</article>
		{/each}
	</div>
{/if}
{#if showNewModal}
	<Modal title="New routine" subtitle="Start blank or from a ready-made flow" onclose={() => (showNewModal = false)}>
		<button class="btn primary new-blank-button" onclick={createRoutine} style="margin-top: 0">＋ Blank routine</button>
		<div class="section-label">Starter routines</div>
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
	</Modal>
{/if}
