<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import Stepper from '$lib/components/Stepper.svelte';
	import {
		PAIN_AREAS,
		addRoutine,
		settings,
		starterRoutine,
		updateSettings,
		type StarterRoutineKind
	} from '$lib/stores.svelte';
	import { buildTimeline, timelineTotal } from '$lib/timeline';
	import { todayKey } from '$lib/time';
	import type { PainArea, Routine } from '$lib/types';

	let { onclose }: { onclose: () => void } = $props();

	type Area = PainArea | 'general';

	const uid = $props.id();

	const areaOptions: { id: Area; label: string }[] = [
		...PAIN_AREAS,
		{ id: 'general', label: 'General prevention' }
	];

	const starterCopy: Partial<Record<StarterRoutineKind, { title: string; description: string }>> = {
		'wrist-relief': { title: 'Wrist & forearm', description: 'Gentle moves for RSI-prone hands' },
		'wrist-forearm-strength': { title: 'Wrist & forearm strength', description: 'Light dumbbell reps, one round' },
		'typing-break': { title: 'Typing break', description: 'A quick reset between keyboard sessions' },
		'finger-band': { title: 'Finger band', description: 'Extensor band: reps, holds and slow lowers' },
		'tennis-elbow-loading': { title: 'Tennis elbow loading', description: 'For outer elbow pain. A wrist hold, then Tyler twists' },
		'golfers-elbow-loading': { title: 'Golfer’s elbow loading', description: 'For inner elbow pain. A wrist hold, then reverse Tyler twists' },
		'elbow-relief': { title: 'Elbow relief', description: 'Tennis and golfer’s elbow rehab' },
		'neck-shoulder-strength': { title: 'Neck & shoulder strength', description: 'A few minutes with a light band' },
		'neck-shoulder-release': { title: 'Neck & shoulders', description: 'Ease tension from desk work' },
		'shoulder-rehab': { title: 'Shoulder & upper back', description: 'Rotator cuff and posture work' },
		'posture-fix': { title: 'Posture fix', description: 'Upper back, chest and neck' },
		'desk-reset': { title: 'Desk reset', description: 'Neck, shoulders and wrists' },
		'rsi-upper-body': { title: 'RSI circuit', description: 'Neck to fingertips in one go' },
		'thoracic-outlet': { title: 'Thoracic outlet', description: 'Open the neck, chest and collarbone' },
		'lower-back-relief': { title: 'Lower-back relief', description: 'Gentle floor release for the spine' },
		'core-isometrics': { title: 'Core isometrics', description: 'Two rounds of core holds' },
		'hip-opener': { title: 'Hip opener', description: 'Deep work for tight hips' },
		'lower-body-reset': { title: 'Lower-body reset', description: 'Hips, legs and calves' },
		'runner-recovery': { title: 'Runner’s recovery', description: 'Easy post-run release' }
	};

	const recommendations: Record<Area, StarterRoutineKind[]> = {
		'wrist-hand': ['wrist-relief', 'wrist-forearm-strength', 'typing-break'],
		thumb: ['finger-band', 'typing-break'],
		'forearm-elbow': ['tennis-elbow-loading', 'golfers-elbow-loading', 'elbow-relief'],
		neck: ['neck-shoulder-strength', 'neck-shoulder-release'],
		shoulder: ['neck-shoulder-strength', 'shoulder-rehab'],
		'upper-back': ['posture-fix', 'shoulder-rehab'],
		fingers: ['finger-band', 'wrist-relief'],
		chest: ['posture-fix', 'thoracic-outlet'],
		'lower-back': ['lower-back-relief', 'core-isometrics'],
		hip: ['hip-opener', 'lower-body-reset'],
		knee: ['lower-body-reset', 'runner-recovery'],
		'ankle-foot': ['runner-recovery', 'lower-body-reset'],
		general: ['desk-reset', 'typing-break', 'rsi-upper-body']
	};

	const MAX_SHOWN = 4;

	let step = $state<1 | 2 | 3>(1);
	let areas = $state<Area[]>([]);
	let selected = $state<StarterRoutineKind[]>([]);
	let times = $state(5);
	let cue = $state('');
	let fallback = $state<'micro' | 'gentle'>('micro');
	let added = $state<{ title: string }[]>([]);
	let committed = false;
	let body: HTMLDivElement | undefined = $state();

	/** Starters for the chosen areas, in catalogue order, without repeats. */
	const recommended = $derived.by(() => {
		const kinds: StarterRoutineKind[] = [];
		for (const area of areaOptions) {
			if (!areas.includes(area.id)) continue;
			for (const kind of recommendations[area.id]) {
				if (!kinds.includes(kind)) kinds.push(kind);
			}
		}
		return kinds.slice(0, MAX_SHOWN);
	});

	/** Minutes for each shown starter, from its real timeline. */
	const minutes = $derived.by(() => {
		const result: Partial<Record<StarterRoutineKind, number>> = {};
		for (const kind of recommended) {
			const seconds = timelineTotal(buildTimeline(starterRoutine(kind), settings));
			result[kind] = Math.max(1, Math.round(seconds / 60));
		}
		return result;
	});

	/** Chosen starters in the order they are listed, so the first one is the top row. */
	const chosen = $derived(recommended.filter((kind) => selected.includes(kind)));

	function titleOf(kind: StarterRoutineKind): string {
		return starterCopy[kind]?.title ?? kind;
	}

	function toggleArea(id: Area): void {
		areas = areas.includes(id) ? areas.filter((a) => a !== id) : [...areas, id];
	}

	function toggleStarter(kind: StarterRoutineKind): void {
		selected = selected.includes(kind) ? selected.filter((k) => k !== kind) : [...selected, kind];
	}

	function goTo(next: 1 | 2 | 3): void {
		step = next;
		body?.closest('.modal-sheet')?.scrollTo({ top: 0 });
	}

	function toStarters(): void {
		// Keep earlier picks that still apply; otherwise pre-select the first suggestion.
		const kept = selected.filter((kind) => recommended.includes(kind));
		selected = kept.length > 0 ? kept : recommended.slice(0, 1);
		goTo(2);
	}

	function addChosen(): void {
		if (committed || chosen.length === 0) return;
		committed = true;
		const note = cue.trim();
		added = chosen.map((kind, i) => {
			const routine: Routine = {
				...starterRoutine(kind),
				frequency: { per: 'week', times, since: todayKey() }
			};
			if (i === 0 && note) routine.cue = note;
			if (i === 0 && fallback === 'gentle') routine.fallback = 'gentle';
			addRoutine(routine);
			return { title: titleOf(kind) };
		});
		updateSettings({ onboarded: true });
		goTo(3);
	}

	function skip(): void {
		updateSettings({ onboarded: true });
		onclose();
	}

	/** ✕, Esc or a backdrop tap: close for now without marking setup done, unless routines were already added. */
	function dismiss(): void {
		if (committed) updateSettings({ onboarded: true });
		onclose();
	}
</script>

{#snippet header()}
	<p class="step-label muted small">Step {step} of 3</p>
	<h2 class="step-title">
		{#if step === 1}Where do you want help?{:else if step === 2}Start with one or two{:else}You’re set{/if}
	</h2>
{/snippet}

<Modal onclose={dismiss} {header}>
	<div class="body" bind:this={body}>
		{#if step === 1}
			<p class="muted small lead">Pick any that apply. You can change everything later.</p>
			<div class="chips" role="group" aria-label="Areas to help">
				{#each areaOptions as area (area.id)}
					<button
						type="button"
						class="chip"
						class:on={areas.includes(area.id)}
						aria-pressed={areas.includes(area.id)}
						onclick={() => toggleArea(area.id)}
					>
						{area.label}
					</button>
				{/each}
			</div>
			<div class="footer">
				<button type="button" class="btn ghost" onclick={skip}>Skip</button>
				<span class="spacer"></span>
				<button type="button" class="btn primary" disabled={areas.length === 0} onclick={toStarters}>Next</button>
			</div>
		{:else if step === 2}
			<div class="rows" role="group" aria-label="Starter routines">
				{#each recommended as kind (kind)}
					{@const on = selected.includes(kind)}
					<button type="button" class="row" class:on aria-pressed={on} onclick={() => toggleStarter(kind)}>
						<span class="box" aria-hidden="true">{on ? '✓' : ''}</span>
						<span class="row-copy">
							<strong>{titleOf(kind)}</strong>
							<span class="muted small">{starterCopy[kind]?.description ?? ''}</span>
						</span>
						<span class="mins">{minutes[kind] ?? 1} min</span>
					</button>
				{/each}
			</div>

			<div class="block">
				<div class="block-head">
					<span class="block-label" id="{uid}-days">How many days a week?</span>
					<Stepper
						bind:value={times}
						min={1}
						max={7}
						step={1}
						label="Days a week"
						format={(v) => (v === 1 ? '1 day' : `${v} days`)}
					/>
				</div>
				<p class="muted small hint">Short sessions most days beat long ones now and then.</p>
			</div>

			{#if chosen.length > 0}
				<div class="block">
					<label class="block-label" for="{uid}-cue">After I… <span class="muted">({titleOf(chosen[0])})</span></label>
					<input
						id="{uid}-cue"
						type="text"
						maxlength="60"
						placeholder="pour my morning coffee"
						bind:value={cue}
					/>
					<div class="fallback">
						<span class="block-label" id="{uid}-fallback">If I can’t, I’ll do:</span>
						<div class="toggle" role="group" aria-labelledby="{uid}-fallback">
							<button
								type="button"
								class="btn small"
								class:primary={fallback === 'micro'}
								aria-pressed={fallback === 'micro'}
								onclick={() => (fallback = 'micro')}
							>
								2-min break
							</button>
							<button
								type="button"
								class="btn small"
								class:primary={fallback === 'gentle'}
								aria-pressed={fallback === 'gentle'}
								onclick={() => (fallback = 'gentle')}
							>
								Gentle version
							</button>
						</div>
					</div>
				</div>
			{/if}

			<div class="footer">
				<button type="button" class="btn ghost" onclick={skip}>Skip</button>
				<span class="spacer"></span>
				<button type="button" class="btn" onclick={() => goTo(1)}>Back</button>
				<button type="button" class="btn primary" disabled={chosen.length === 0} onclick={addChosen}>Add routines</button>
			</div>
		{:else}
			<p class="muted small lead">
				Added to your routines, aiming for {times === 1 ? '1 day' : `${times} days`} a week:
			</p>
			<ul class="added">
				{#each added as item (item.title)}
					<li>{item.title}</li>
				{/each}
			</ul>
			<p class="note">Home will ask you to rate a few everyday tasks. That’s your starting point, so you can see progress later.</p>
			<p class="note">After each session, a quick pain score (0–10) lets the app suggest when to step up or ease off.</p>
			<div class="footer">
				<span class="spacer"></span>
				<button type="button" class="btn primary" onclick={onclose}>Go to Home</button>
			</div>
		{/if}
	</div>
</Modal>

<style>
	.step-label {
		margin: 0 0 0.1rem;
		font-weight: 600;
	}
	.step-title {
		font-size: 1.15rem;
		margin: 0;
	}
	.lead {
		margin: 0 0 0.75rem;
	}

	/* step 1 */
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}
	.chip {
		min-height: 2.5rem;
		padding: 0.3rem 0.9rem;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: 0.92rem;
		font-weight: 600;
		cursor: pointer;
		touch-action: manipulation;
	}
	.chip.on {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}

	/* step 2 */
	.rows {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		width: 100%;
		padding: 0.5rem 0.7rem;
		border-radius: 12px;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text);
		font: inherit;
		text-align: left;
		cursor: pointer;
		touch-action: manipulation;
	}
	.row.on {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 8%, var(--surface));
	}
	.box {
		flex: none;
		display: grid;
		place-items: center;
		width: 1.35rem;
		height: 1.35rem;
		border-radius: 6px;
		border: 2px solid var(--border);
		font-size: 0.85rem;
		font-weight: 800;
		line-height: 1;
		color: #fff;
	}
	.row.on .box {
		background: var(--accent);
		border-color: var(--accent);
	}
	.row-copy {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.row-copy strong {
		font-size: 0.92rem;
	}
	.row-copy .small {
		font-size: 0.78rem;
		line-height: 1.3;
	}
	.mins {
		flex: none;
		color: var(--accent-strong);
		font-size: 0.78rem;
		font-weight: 800;
		white-space: nowrap;
	}
	.block {
		margin-top: 0.85rem;
	}
	.block-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.block-label {
		display: block;
		font-weight: 600;
		font-size: 0.85rem;
		margin-bottom: 0.35rem;
	}
	.block-head .block-label {
		margin-bottom: 0;
	}
	.hint {
		margin: 0.35rem 0 0;
	}
	.fallback {
		margin-top: 0.7rem;
	}
	.toggle {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	/* step 3 */
	.added {
		margin: 0 0 0.85rem;
		padding-left: 1.2rem;
		font-weight: 600;
	}
	.added li {
		margin-bottom: 0.2rem;
	}
	.note {
		margin: 0 0 0.6rem;
		font-size: 0.9rem;
		line-height: 1.45;
	}

	/* shared */
	.footer {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 1.1rem;
	}
	.spacer {
		flex: 1;
	}
</style>
