<script lang="ts">
	import { untrack } from 'svelte';
	import { deletePainEntry, forgetCustomTag, savePainEntry, settings } from '$lib/stores.svelte';
	import {
		PAIN_AREAS,
		PAIN_CAUSES,
		PAIN_HELPED,
		PAIN_SPOTS,
		PAIN_TYPES,
		painSpot,
		spotKey,
		spotLabel,
		tagLabel,
		type PainSpot
	} from '$lib/painSpots';
	import type { PainArea, PainEntry, PainSide, PainSpotEntry, PainType } from '$lib/types';
	import { showToast } from '$lib/toast.svelte';
	import Modal from './Modal.svelte';
	import BodyMap, { painColor } from './BodyMap.svelte';

	/** Add or edit one pain-journal entry. `entry` null = new entry (now). */
	let {
		entry = null,
		onclose,
		ondone
	}: {
		entry?: PainEntry | null;
		onclose: () => void;
		/** after saving (the saved entry's `at`) or deleting (null) */
		ondone?: (at: number | null) => void;
	} = $props();

	// The form is a snapshot of the entry when the editor opened.
	const start = untrack(() => (entry ? $state.snapshot(entry) : null));

	function localInput(ms: number): string {
		const d = new Date(ms);
		const p = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
	}

	let when = $state(localInput(start?.at ?? Date.now()));
	const maxWhen = localInput(Date.now() + 60_000);
	let spots = $state<PainSpotEntry[]>(start?.spots ? structuredClone(start.spots) : []);
	/** Old entries without spots keep their coarse areas + overall score until spots are added. */
	let legacyAreas = $state<PainArea[]>(start && !start.spots?.length ? [...(start.areas ?? [])] : []);
	let overall = $state(start && !start.spots?.length ? start.score : 0);
	let causes = $state<string[]>([...(start?.causes ?? [])]);
	let helped = $state<string[]>([...(start?.helped ?? [])]);
	let note = $state(start?.note ?? '');
	let selected = $state<string | null>(null);
	let view = $state<'front' | 'back'>('front');
	let query = $state('');
	let customCause = $state('');
	let customHelp = $state('');
	let addingCause = $state(false);
	let addingHelp = $state(false);

	const marks = $derived(Object.fromEntries(spots.map((p) => [spotKey(p.spot, p.side), p.score])));
	const peak = $derived(spots.length ? Math.max(...spots.map((p) => p.score)) : overall);
	let lastScore = 5;

	function pick(spot: string, side?: PainSide): void {
		const key = spotKey(spot, side);
		if (!spots.some((p) => spotKey(p.spot, p.side) === key)) {
			spots.push({ spot, ...(side && { side }), score: lastScore });
		}
		selected = key;
		query = '';
	}

	function removeSpot(key: string): void {
		spots = spots.filter((p) => spotKey(p.spot, p.side) !== key);
		if (selected === key) selected = null;
	}

	function setScore(p: PainSpotEntry, n: number): void {
		p.score = n;
		lastScore = n;
	}

	function toggleType(p: PainSpotEntry, t: PainType): void {
		const list = p.types ?? [];
		p.types = list.includes(t) ? list.filter((x) => x !== t) : [...list, t];
	}

	const results = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return [] as PainSpot[];
		const words = q.split(/\s+/);
		const areaLabel = (a: PainArea) => PAIN_AREAS.find((x) => x.id === a)?.label ?? '';
		return PAIN_SPOTS.filter((s) => {
			const hay = `${s.label} ${s.region} ${areaLabel(s.area)}`.toLowerCase();
			return words.every((w) => hay.includes(w));
		}).slice(0, 12);
	});

	function toggleTag(list: string[], value: string): string[] {
		return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
	}

	/** Presets, then remembered custom chips, then any custom text only this entry has. */
	function chipList(presets: { id: string }[], custom: string[] | undefined, chosen: string[]): string[] {
		const out = [...presets.map((p) => p.id), ...(custom ?? [])];
		for (const v of chosen) if (!out.includes(v)) out.push(v);
		return out;
	}
	const causeChips = $derived(chipList(PAIN_CAUSES, settings.customCauses, causes));
	const helpChips = $derived(chipList(PAIN_HELPED, settings.customHelped, helped));

	function addCustom(kind: 'cause' | 'help'): void {
		const text = (kind === 'cause' ? customCause : customHelp).trim().slice(0, 40);
		if (text) {
			const presets = kind === 'cause' ? PAIN_CAUSES : PAIN_HELPED;
			const preset = presets.find((p) => p.label.toLowerCase() === text.toLowerCase());
			const value = preset?.id ?? text;
			if (kind === 'cause') causes = causes.includes(value) ? causes : [...causes, value];
			else helped = helped.includes(value) ? helped : [...helped, value];
		}
		if (kind === 'cause') {
			customCause = '';
			addingCause = false;
		} else {
			customHelp = '';
			addingHelp = false;
		}
	}

	function isCustom(value: string, presets: { id: string }[]): boolean {
		return !presets.some((p) => p.id === value);
	}

	function save(): void {
		// Unchanged time keeps the exact original timestamp (seconds included), so backups still de-dupe.
		const at = start && when === localInput(start.at) ? start.at : new Date(when).getTime();
		if (!Number.isFinite(at)) {
			showToast('Pick a valid date and time');
			return;
		}
		if (at > Date.now() + 60_000) {
			showToast('That time is in the future');
			return;
		}
		if (customCause.trim()) addCustom('cause');
		if (customHelp.trim()) addCustom('help');
		const savedAt = savePainEntry(start?.at ?? null, {
			date: '',
			score: overall,
			routineId: start?.routineId ?? null,
			at,
			...(start?.gentle && { gentle: true }),
			areas: legacyAreas,
			spots: $state.snapshot(spots),
			causes: $state.snapshot(causes),
			helped: $state.snapshot(helped),
			note
		});
		showToast(start ? 'Entry updated' : 'Entry saved');
		ondone?.(savedAt);
		onclose();
	}

	function remove(): void {
		if (!start) return;
		if (!confirm('Delete this entry? This can’t be undone.')) return;
		deletePainEntry(start.at);
		showToast('Entry deleted');
		ondone?.(null);
		onclose();
	}
</script>

<Modal title={start ? 'Edit pain entry' : 'New pain entry'} subtitle={peak > 0 ? `Worst: ${peak}/10` : undefined} {onclose} class="pain-editor">
	<div class="field">
		<label for="pain-when">When</label>
		<input id="pain-when" class="when" type="datetime-local" bind:value={when} max={maxWhen} />
	</div>

	<div class="field">
		<span class="flabel">Where does it hurt?</span>
		<p class="muted small hint">Tap the body, or search for small spots like a finger.</p>
		<BodyMap bind:view {marks} {selected} onpick={pick} />
		<input class="spot-search" type="search" placeholder="Search spots (thumb, little finger, jaw…)" bind:value={query} aria-label="Search spots" />
		{#if results.length}
			<ul class="results">
				{#each results as r (r.id)}
					<li>
						<span>{r.label}</span>
						<span class="result-btns">
							{#if r.sided}
								<button type="button" class="btn small" onclick={() => pick(r.id, 'left')}>Left</button>
								<button type="button" class="btn small" onclick={() => pick(r.id, 'right')}>Right</button>
							{:else}
								<button type="button" class="btn small" onclick={() => pick(r.id)}>Add</button>
							{/if}
						</span>
					</li>
				{/each}
			</ul>
		{:else if query.trim()}
			<p class="muted small">No spot matches “{query.trim()}”.</p>
		{/if}
	</div>

	{#if spots.length}
		<ul class="spots">
			{#each spots as p (spotKey(p.spot, p.side))}
				{@const key = spotKey(p.spot, p.side)}
				{@const open = selected === key}
				<li class="spot-row" class:open>
					<div class="spot-head">
						<button type="button" class="spot-name" aria-expanded={open} onclick={() => (selected = open ? null : key)}>
							<span class="badge" style:background={painColor(p.score)}>{p.score}</span>
							<span>{spotLabel(p.spot, p.side)}</span>
							{#if !open && p.types?.length}
								<span class="muted small">· {p.types.map((t) => PAIN_TYPES.find((x) => x.id === t)?.label).join(', ')}</span>
							{/if}
						</button>
						<button type="button" class="icon-btn" aria-label="Remove {spotLabel(p.spot, p.side)}" onclick={() => removeSpot(key)}>✕</button>
					</div>
					{#if open}
						<div class="score-row" role="group" aria-label="Pain at {spotLabel(p.spot, p.side)}">
							{#each Array.from({ length: 11 }, (_, i) => i) as n (n)}
								<button type="button" class="score-btn" class:on={p.score === n} aria-pressed={p.score === n} onclick={() => setScore(p, n)}>{n}</button>
							{/each}
						</div>
						<div class="chips" role="group" aria-label="What it feels like">
							{#each PAIN_TYPES as t (t.id)}
								<button type="button" class="chip" class:on={p.types?.includes(t.id)} aria-pressed={p.types?.includes(t.id) ?? false} onclick={() => toggleType(p, t.id)}>{t.label}</button>
							{/each}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<div class="field">
			<span class="flabel">{legacyAreas.length ? `Overall pain (${legacyAreas.map((a) => PAIN_AREAS.find((x) => x.id === a)?.label).join(', ')})` : 'Overall pain (or pick spots above)'}</span>
			<div class="score-row" role="group" aria-label="Overall pain">
				{#each Array.from({ length: 11 }, (_, i) => i) as n (n)}
					<button type="button" class="score-btn" class:on={overall === n} aria-pressed={overall === n} onclick={() => (overall = n)}>{n}</button>
				{/each}
			</div>
		</div>
	{/if}

	<div class="field">
		<span class="flabel">What caused it?</span>
		<div class="chips" role="group" aria-label="Causes">
			{#each causeChips as c (c)}
				<span class="chip-wrap">
					<button type="button" class="chip" class:on={causes.includes(c)} aria-pressed={causes.includes(c)} onclick={() => (causes = toggleTag(causes, c))}>{tagLabel(c)}</button>
					{#if isCustom(c, PAIN_CAUSES) && settings.customCauses?.includes(c) && !causes.includes(c)}
						<button type="button" class="forget" aria-label="Forget {c}" onclick={() => forgetCustomTag('customCauses', c)}>✕</button>
					{/if}
				</span>
			{/each}
			{#if addingCause}
				<input
					class="custom-input"
					type="text"
					placeholder="Other cause"
					maxlength="40"
					bind:value={customCause}
					onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom('cause'))}
					onblur={() => addCustom('cause')}
					aria-label="Other cause"
				/>
			{:else}
				<button type="button" class="chip add" onclick={() => (addingCause = true)}>+ Other</button>
			{/if}
		</div>
	</div>

	<div class="field">
		<span class="flabel">What helped?</span>
		<div class="chips" role="group" aria-label="What helped">
			{#each helpChips as c (c)}
				<span class="chip-wrap">
					<button type="button" class="chip" class:on={helped.includes(c)} aria-pressed={helped.includes(c)} onclick={() => (helped = toggleTag(helped, c))}>{tagLabel(c)}</button>
					{#if isCustom(c, PAIN_HELPED) && settings.customHelped?.includes(c) && !helped.includes(c)}
						<button type="button" class="forget" aria-label="Forget {c}" onclick={() => forgetCustomTag('customHelped', c)}>✕</button>
					{/if}
				</span>
			{/each}
			{#if addingHelp}
				<input
					class="custom-input"
					type="text"
					placeholder="Something else"
					maxlength="40"
					bind:value={customHelp}
					onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom('help'))}
					onblur={() => addCustom('help')}
					aria-label="Something else that helped"
				/>
			{:else}
				<button type="button" class="chip add" onclick={() => (addingHelp = true)}>+ Other</button>
			{/if}
		</div>
	</div>

	<div class="field">
		<label for="pain-note">Notes</label>
		<textarea id="pain-note" rows="3" maxlength="2000" placeholder="Anything else worth remembering" bind:value={note}></textarea>
	</div>

	<div class="actions">
		{#if start}
			<button type="button" class="btn danger" onclick={remove}>Delete</button>
		{/if}
		<span class="grow"></span>
		<button type="button" class="btn ghost" onclick={onclose}>Cancel</button>
		<button type="button" class="btn primary" onclick={save}>Save</button>
	</div>
</Modal>

<style>
	.hint {
		margin: -0.15rem 0 0.4rem;
	}
	.when {
		font: inherit;
		color: var(--text);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.5rem 0.65rem;
		width: 100%;
		max-width: 16rem;
	}
	.spot-search {
		width: 100%;
		margin-top: 0.5rem;
	}
	.results {
		list-style: none;
		margin: 0.4rem 0 0;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}
	.results li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.4rem 0.6rem;
		font-size: 0.9rem;
	}
	.results li + li {
		border-top: 1px solid var(--border);
	}
	.result-btns {
		display: flex;
		gap: 0.3rem;
		flex-shrink: 0;
	}
	.spots {
		list-style: none;
		margin: 0 0 0.95rem;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.spot-row {
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 0.35rem 0.4rem 0.35rem 0.5rem;
	}
	.spot-row.open {
		border-color: var(--text);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-bottom: 0.6rem;
	}
	.spot-head {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
	.spot-name {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border: 0;
		background: none;
		color: var(--text);
		font: inherit;
		font-weight: 600;
		text-align: left;
		padding: 0.2rem 0;
		cursor: pointer;
	}
	.badge {
		flex-shrink: 0;
		display: inline-grid;
		place-items: center;
		width: 1.7rem;
		height: 1.7rem;
		border-radius: 50%;
		font-size: 0.8rem;
		font-weight: 800;
		color: #1c1c1c;
	}
	.score-row {
		display: grid;
		grid-template-columns: repeat(11, 1fr);
		gap: 0.2rem;
	}
	.score-btn {
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
	.score-btn.on {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.chip-wrap {
		display: inline-flex;
		align-items: center;
	}
	.chip {
		min-height: 2rem;
		padding: 0.2rem 0.7rem;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}
	.chip.on {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}
	.chip.add {
		border-style: dashed;
		color: var(--muted);
	}
	.forget {
		border: 0;
		background: none;
		color: var(--muted);
		font-size: 0.75rem;
		padding: 0 0.2rem;
		cursor: pointer;
	}
	.custom-input {
		width: 10rem;
		min-height: 2rem;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
	}
	textarea {
		width: 100%;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		position: sticky;
		bottom: calc(-1 * max(1.2rem, env(safe-area-inset-bottom)));
		background: var(--surface);
		padding: 0.6rem 0 max(0.2rem, env(safe-area-inset-bottom));
		border-top: 1px solid var(--border);
	}
	.grow {
		flex: 1;
	}
</style>
