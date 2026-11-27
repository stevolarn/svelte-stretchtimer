<script lang="ts">
	import { addRoutine, newRoutine, recentPainAreas, settings, updateSettings } from '$lib/stores.svelte';
	import {
		candidates,
		estimateSeconds,
		generateRoutine,
		goalBlurbs,
		goalLabels,
		goalPositions,
		goalTypes,
		intensityLabels,
		routineName,
		swapOptions,
		toStretch,
		typeLabels,
		type Goal,
		type Intensity,
		type MoveType,
		type Position,
		type WizardInput
	} from '$lib/generator';
	import { equipmentLabels, focusLabels, painAreaFocus, type Equipment, type Focus } from '$lib/stockTags';
	import { stretchDurationLabel } from '$lib/timeline';
	import type { Routine, StockStretch, Stretch } from '$lib/types';
	import Modal from './Modal.svelte';
	import MuscleChips from './MuscleChips.svelte';
	import StockStretchPicker from './StockStretchPicker.svelte';
	import StretchIllustration from './StretchIllustration.svelte';
	import StretchDetailModal from './StretchDetailModal.svelte';

	/** Step-by-step routine builder: answers in, generated routine out for review before saving. */
	let { onclose, onsave }: { onclose: () => void; onsave: (routine: Routine) => void } = $props();

	const steps = ['Goal', 'Focus', 'Length', 'Exercises', 'Setup', 'Review'] as const;
	let step = $state(0);

	const goals = Object.keys(goalLabels) as Goal[];
	const focuses = Object.keys(focusLabels) as Focus[];
	const moveTypes = Object.keys(typeLabels) as MoveType[];
	const kit = (Object.keys(equipmentLabels) as Equipment[]).filter((e) => e !== 'none');
	const positionLabels: Record<Position, string> = { standing: 'Standing', seated: 'Seated', floor: 'On the floor' };
	const allPositions = Object.keys(positionLabels) as Position[];
	const lengths = [5, 10, 15, 20, 30];

	const soreFocus = [...new Set(recentPainAreas().map((a) => painAreaFocus[a]))];

	let goal = $state<Goal>(soreFocus.length ? 'relief' : 'mobility');
	let focus = $state<Focus[]>(soreFocus);
	let minutes = $state(10);
	let types = $state<MoveType[]>([...goalTypes[soreFocus.length ? 'relief' : 'mobility']]);
	let equipment = $state<Equipment[]>([...((settings.wizardEquipment ?? []) as Equipment[])]);
	let positions = $state<Position[]>(goalPositions[soreFocus.length ? 'relief' : 'mobility'].length ? [...goalPositions[soreFocus.length ? 'relief' : 'mobility']] : [...allPositions]);
	let intensity = $state<Intensity>('normal');
	let seed = $state(Math.floor(Math.random() * 1e9));

	const breakSeconds = settings.breaksEnabled ? settings.breakSeconds : 0;
	const input = $derived<WizardInput>({ goal, focus, minutes, types, equipment, positions, intensity, breakSeconds, seed });
	const matching = $derived(candidates(input).length);

	function pickGoal(g: Goal): void {
		goal = g;
		types = [...goalTypes[g]];
		positions = goalPositions[g].length ? [...goalPositions[g]] : [...allPositions];
	}

	function toggle<T>(list: T[], value: T): T[] {
		return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
	}

	// Review state: the generated routine, editable before saving.
	let name = $state('');
	let stretches = $state<Stretch[]>([]);
	/** Library moves already swapped out, so ↻ keeps offering something new. */
	let rejected = $state<string[]>([]);
	let choosingFor = $state<number | null>(null);
	let viewing = $state<Stretch | null>(null);
	let swapNote = $state('');
	const total = $derived(estimateSeconds(stretches, breakSeconds));

	function generate(): void {
		const result = generateRoutine(input);
		name = result.name;
		stretches = result.stretches;
		rejected = [];
		swapNote = '';
	}

	function next(): void {
		if (step === 4) {
			updateSettings({ wizardEquipment: [...equipment] });
			generate();
		}
		step = Math.min(steps.length - 1, step + 1);
	}

	function shuffle(): void {
		seed = Math.floor(Math.random() * 1e9);
		const keepName = name !== routineName(input) ? name : null;
		generate();
		if (keepName) name = keepName;
	}

	function swap(i: number): void {
		const options = swapOptions(input, stretches, i);
		swapNote = options.length === 0 ? `No other matching move to swap for ${stretches[i].name}. Use ⋯ to pick any move.` : '';
		if (options.length === 0) return;
		const fresh = options.find((o) => !rejected.includes(o.name)) ?? options[0];
		if (!options.some((o) => !rejected.includes(o.name))) rejected = [];
		rejected = [...rejected, stretches[i].name];
		stretches[i] = replacement(i, fresh);
	}

	/** Replacement for move i that keeps the extra sets and longer holds the length top-up gave it. */
	function replacement(i: number, stock: StockStretch): Stretch {
		const old = stretches[i];
		const next = toStretch(stock, intensity);
		if (old.sets && old.sets > 1) next.sets = old.sets;
		if (old.mode !== 'reps' && next.mode !== 'reps') next.durationSeconds = Math.max(next.durationSeconds, old.durationSeconds);
		return next;
	}

	function choose(stock: StockStretch): void {
		if (choosingFor === null) return;
		stretches[choosingFor] = replacement(choosingFor, stock);
		choosingFor = null;
	}

	function remove(i: number): void {
		stretches = stretches.filter((_, j) => j !== i);
	}

	function save(): void {
		const routine = newRoutine(name.trim() || routineName(input), settings.breakSeconds);
		routine.stretches = $state.snapshot(stretches);
		addRoutine(routine);
		onsave(routine);
	}

	const minutesLabel = (seconds: number) => `${Math.max(1, Math.round(seconds / 60))} min`;
	const canNext = $derived(step !== 3 || types.length > 0);
</script>

<Modal title="Build a routine" subtitle={`Step ${step + 1} of ${steps.length} · ${steps[step]}`} {onclose} class="wizard-sheet">
	<div class="wizard-progress" aria-hidden="true">
		{#each steps as s, i (s)}<span class:done={i <= step}></span>{/each}
	</div>

	{#if step === 0}
		<p class="wizard-q">What's this routine for?</p>
		<div class="wizard-options">
			{#each goals as g (g)}
				<button class="wizard-option" class:on={goal === g} aria-pressed={goal === g} onclick={() => pickGoal(g)}>
					<strong>{goalLabels[g]}</strong>
					<span class="muted small">{goalBlurbs[g]}</span>
				</button>
			{/each}
		</div>
	{:else if step === 1}
		<p class="wizard-q">Which areas should it focus on?</p>
		{#if soreFocus.length}<p class="muted small wizard-hint">Your recent sore spots are ticked.</p>{/if}
		<div class="wizard-chips">
			<button class="wizard-chip" class:on={focus.length === 0} aria-pressed={focus.length === 0} onclick={() => (focus = [])}>Full body</button>
			{#each focuses as f (f)}
				<button class="wizard-chip" class:on={focus.includes(f)} aria-pressed={focus.includes(f)} onclick={() => (focus = toggle(focus, f))}>
					{focusLabels[f]}{#if soreFocus.includes(f)}<span class="sore-dot" title="Recent sore spot"></span>{/if}
				</button>
			{/each}
		</div>
		{#if focus.length > 1}<p class="muted small wizard-hint">Time is split evenly between them.</p>{/if}
	{:else if step === 2}
		<p class="wizard-q">How long have you got?</p>
		<div class="wizard-chips">
			{#each lengths as m (m)}
				<button class="wizard-chip big" class:on={minutes === m} aria-pressed={minutes === m} onclick={() => (minutes = m)}>{m} min</button>
			{/each}
		</div>
		<p class="muted small wizard-hint">
			{breakSeconds > 0 ? `Includes ${breakSeconds}s rests between moves.` : 'Breaks are off in Settings, so moves run back to back.'}
		</p>
	{:else if step === 3}
		<p class="wizard-q">What kind of exercises?</p>
		<p class="muted small wizard-hint">Picked for {goalLabels[goal].toLowerCase()}; change any.</p>
		<div class="wizard-chips">
			{#each moveTypes as t (t)}
				<button class="wizard-chip" class:on={types.includes(t)} aria-pressed={types.includes(t)} onclick={() => (types = toggle(types, t))}>{typeLabels[t]}</button>
			{/each}
		</div>
		<p class="muted small wizard-hint">{types.length ? `${matching} moves match so far.` : 'Pick at least one.'}</p>
	{:else if step === 4}
		<p class="wizard-q">What do you have with you?</p>
		<div class="wizard-chips">
			<button class="wizard-chip" class:on={equipment.length === 0} aria-pressed={equipment.length === 0} onclick={() => (equipment = [])}>Nothing</button>
			{#each kit as e (e)}
				<button class="wizard-chip" class:on={equipment.includes(e)} aria-pressed={equipment.includes(e)} onclick={() => (equipment = toggle(equipment, e))}>{equipmentLabels[e]}</button>
			{/each}
		</div>
		<p class="wizard-q">Where can you do it?</p>
		<div class="wizard-chips">
			{#each allPositions as p (p)}
				<button class="wizard-chip" class:on={positions.includes(p)} aria-pressed={positions.includes(p)} onclick={() => (positions = positions.includes(p) && positions.length === 1 ? positions : toggle(positions, p))}>{positionLabels[p]}</button>
			{/each}
		</div>
		<p class="wizard-q">How hard?</p>
		<div class="wizard-chips">
			{#each Object.keys(intensityLabels) as Intensity[] as level (level)}
				<button class="wizard-chip" class:on={intensity === level} aria-pressed={intensity === level} onclick={() => (intensity = level)}>{intensityLabels[level]}</button>
			{/each}
		</div>
		<p class="muted small wizard-hint">{matching} moves match.{matching < 4 ? ' Try more exercise types, positions or equipment.' : ''}</p>
	{:else}
		<label class="field wizard-name">
			<span class="small muted">Name</span>
			<input type="text" bind:value={name} />
		</label>
		<div class="wizard-summary">
			<span><strong>{minutesLabel(total)}</strong> · {stretches.length} move{stretches.length === 1 ? '' : 's'}</span>
			<button class="btn small" onclick={shuffle}>🔀 Shuffle all</button>
		</div>
		{#if stretches.length === 0}
			<p class="muted">Nothing matched those choices. Go back and allow more exercise types, positions or equipment.</p>
		{:else}
			{#if total < minutes * 60 - 90}
				<p class="muted small wizard-hint">Only enough matching moves for about {minutesLabel(total)}. Go back and allow more exercise types, positions or focus areas for a longer routine.</p>
			{/if}
			{#if swapNote}<p class="muted small wizard-hint" role="status">{swapNote}</p>{/if}
			<MuscleChips routine={{ stretches }} limit={6} />
			<ol class="wizard-list">
				{#each stretches as s, i (s.id)}
					<li>
						<button class="wizard-open" aria-label="Show {s.name}" onclick={() => (viewing = s)}>
							<span class="wizard-thumb"><StretchIllustration iconKey={s.iconKey} name={s.name} size="100%" rounded={10} animated={false} /></span>
							<span class="wizard-move">
								<strong>{s.name}</strong>
								<span class="muted small">{stretchDurationLabel(s)}</span>
							</span>
						</button>
						<span class="wizard-actions">
							<button class="icon-btn" aria-label="Swap {s.name} for a similar move" title="Swap for a similar move" onclick={() => swap(i)}>↻</button>
							<button class="icon-btn" aria-label="Choose a replacement for {s.name}" title="Choose…" onclick={() => (choosingFor = i)}>⋯</button>
							<button class="icon-btn" aria-label="Remove {s.name}" title="Remove" onclick={() => remove(i)}>✕</button>
						</span>
					</li>
				{/each}
			</ol>
		{/if}
	{/if}

	<div class="wizard-nav">
		{#if step > 0}<button class="btn" onclick={() => (step -= 1)}>Back</button>{:else}<span></span>{/if}
		{#if step < steps.length - 1}
			<button class="btn primary" disabled={!canNext} onclick={next}>{step === 4 ? 'Build it' : 'Next'}</button>
		{:else}
			<button class="btn primary" disabled={stretches.length === 0} onclick={save}>Save routine</button>
		{/if}
	</div>
</Modal>

{#if viewing}
	<StretchDetailModal stretch={viewing} onclose={() => (viewing = null)} />
{/if}

{#if choosingFor !== null}
	<StockStretchPicker existing={stretches} onselect={choose} oncustom={() => (choosingFor = null)} onclose={() => (choosingFor = null)} />
{/if}

<style>
	.wizard-progress {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.25rem;
		margin-bottom: 0.9rem;
	}
	.wizard-progress span {
		height: 4px;
		border-radius: 2px;
		background: var(--border);
	}
	.wizard-progress span.done {
		background: var(--accent);
	}
	.wizard-q {
		font-weight: 700;
		margin: 0.6rem 0 0.5rem;
	}
	.wizard-q:first-of-type {
		margin-top: 0;
	}
	.wizard-hint {
		margin: 0.4rem 0 0;
	}
	.wizard-options {
		display: grid;
		gap: 0.45rem;
	}
	.wizard-option {
		display: grid;
		gap: 0.15rem;
		text-align: left;
		padding: 0.65rem 0.8rem;
		border-radius: 12px;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text);
		font: inherit;
		cursor: pointer;
	}
	.wizard-option.on {
		border-color: var(--accent);
		box-shadow: inset 0 0 0 1px var(--accent);
	}
	.wizard-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.wizard-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.4rem 0.75rem;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: 0.88rem;
		cursor: pointer;
	}
	.wizard-chip.big {
		padding: 0.55rem 0.95rem;
		font-weight: 700;
	}
	.wizard-chip.on {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}
	.sore-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--danger);
	}
	.wizard-name {
		display: grid;
		gap: 0.2rem;
		margin-bottom: 0.6rem;
	}
	.wizard-summary {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	.wizard-list {
		list-style: none;
		margin: 0.6rem 0 0;
		padding: 0;
		display: grid;
		gap: 0.4rem;
	}
	.wizard-list li {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 0.3rem;
		padding: 0.35rem;
		border: 1px solid var(--border);
		border-radius: 12px;
		background: var(--surface);
	}
	.wizard-open {
		display: grid;
		grid-template-columns: 52px 1fr;
		align-items: center;
		gap: 0.55rem;
		min-width: 0;
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
		border-radius: 10px;
	}
	.wizard-open:active {
		opacity: 0.7;
	}
	.wizard-thumb {
		width: 52px;
		height: 42px;
		display: block;
	}
	.wizard-move {
		display: grid;
		min-width: 0;
	}
	.wizard-move strong {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.9rem;
	}
	.wizard-actions {
		display: flex;
		gap: 0.1rem;
	}
	.wizard-nav {
		position: sticky;
		bottom: 0;
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 1rem;
		padding: 0.6rem 0 0.2rem;
		background: var(--surface);
	}
	.wizard-nav .btn {
		min-width: 6.5rem;
	}
</style>
