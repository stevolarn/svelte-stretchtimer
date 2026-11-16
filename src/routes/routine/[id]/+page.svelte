<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { deletePhotoData, getPhotoData, savePhotoData } from '$lib/storage';
	import { deleteRoutineWithUndo, getRoutine, newStretch, saveAll, settings } from '$lib/stores.svelte';
	import { buildTimeline, durationText, stretchDurationLabel, timelineTotal } from '$lib/timeline';
	import { formatSeconds } from '$lib/time';
	import { uid } from '$lib/util';
	import { showToast } from '$lib/toast.svelte';
	import { type Stretch, type StockStretch } from '$lib/types';
	import Stepper from '$lib/components/Stepper.svelte';
	import PhotoPicker from '$lib/components/PhotoPicker.svelte';
	import PhotoThumb from '$lib/components/PhotoThumb.svelte';
	import StretchIllustration from '$lib/components/StretchIllustration.svelte';
	import StockStretchPicker from '$lib/components/StockStretchPicker.svelte';
	import Modal from '$lib/components/Modal.svelte';

	const routine = $derived(getRoutine(page.params.id ?? '') ?? null);
	const total = $derived(routine ? timelineTotal(buildTimeline(routine, settings)) : 0);

	$effect(() => {
		if (routine && routine.breakSeconds === undefined) {
			routine.breakSeconds = settings.breakSeconds;
			saveAll();
		}
	});

	let editingId = $state<string | null>(null);
	const editing = $derived(routine?.stretches.find((s) => s.id === editingId) ?? null);
	const editingIndex = $derived(routine && editing ? routine.stretches.indexOf(editing) : -1);
	let showPicker = $state(false);
	let editingPhotoUrl = $state<string | null>(null);

	let dragIndex = $state<number | null>(null);
	let overIndex = $state<number | null>(null);

	$effect(() => {
		const photoId = editing?.photoId;
		editingPhotoUrl = null;
		if (!photoId) return;
		let cancelled = false;
		getPhotoData(photoId)
			.then((url) => {
				if (!cancelled) editingPhotoUrl = url;
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	});

	function handleSelectStock(stock: StockStretch): void {
		if (!routine) return;
		const s: Stretch = {
			id: uid(),
			name: stock.name,
			description: stock.description,
			sides: stock.sides,
			durationSeconds: stock.defaultSeconds,
			leftSeconds: stock.defaultSeconds,
			rightSeconds: stock.defaultSeconds,
			photoId: null,
			iconKey: stock.iconKey
		};
		routine.stretches.push(s);
		saveAll();
		showPicker = false;
		showToast(`Added “${stock.name}”`);
	}

	function handleAddCustom(): void {
		if (!routine) return;
		const s = newStretch();
		routine.stretches.push(s);
		saveAll();
		editingId = s.id;
		showPicker = false;
	}

	function deleteStretch(index: number): void {
		if (!routine) return;
		const [removed] = routine.stretches.splice(index, 1);
		saveAll();
		if (editingId === removed.id) editingId = null;
		const list = routine.stretches;
		showToast(`Removed “${removed.name || 'Untitled stretch'}”`, {
			action: 'Undo',
			onAction: () => {
				list.splice(Math.min(index, list.length), 0, removed);
				saveAll();
			},
			onExpire: () => {
				if (removed.photoId && !list.some((s) => s.id === removed.id)) {
					void deletePhotoData(removed.photoId).catch(() => {});
				}
			}
		});
	}

	async function duplicateStretch(index: number): Promise<void> {
		if (!routine) return;
		const src = routine.stretches[index];
		const copy: Stretch = { ...src, id: uid(), photoId: null };
		if (src.photoId) {
			const data = await getPhotoData(src.photoId).catch(() => null);
			if (data) {
				const pid = uid();
				copy.photoId = pid;
				await savePhotoData(pid, data).catch(() => {});
			}
		}
		routine.stretches.splice(index + 1, 0, copy);
		saveAll();
		editingId = copy.id;
		showToast('Stretch duplicated');
	}

	function moveItem(from: number, to: number): void {
		if (!routine || from === to || to < 0 || to >= routine.stretches.length) return;
		const [item] = routine.stretches.splice(from, 1);
		routine.stretches.splice(to, 0, item);
		saveAll();
	}

	/* -------- Drag reordering: pointer events on the handle (touch + mouse) -------- */
	let listEl = $state<HTMLElement>();

	function handlePointerDown(e: PointerEvent, index: number): void {
		if (e.button !== 0 && e.pointerType === 'mouse') return;
		e.preventDefault();
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		dragIndex = index;
		overIndex = index;
	}

	function handlePointerMove(e: PointerEvent): void {
		if (dragIndex === null || !listEl) return;
		const items = listEl.querySelectorAll<HTMLElement>('.st-item');
		for (let i = 0; i < items.length; i++) {
			const rect = items[i].getBoundingClientRect();
			if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
				overIndex = i;
				break;
			}
		}
	}

	function handlePointerUp(): void {
		if (dragIndex === null) return;
		const from = dragIndex;
		const to = overIndex;
		dragIndex = null;
		overIndex = null;
		if (to !== null && from !== to) {
			moveItem(from, to);
			navigator.vibrate?.(15);
		}
	}

	function handlePointerCancel(): void {
		dragIndex = null;
		overIndex = null;
	}

	function handleHandleKey(e: KeyboardEvent, index: number): void {
		if (e.key === 'ArrowUp') {
			e.preventDefault();
			moveItem(index, index - 1);
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			moveItem(index, index + 1);
		}
	}

	function removeRoutine(): void {
		if (!routine) return;
		const id = routine.id;
		goto('/').then(() => deleteRoutineWithUndo(id));
	}
</script>

<svelte:head>
	<title>{routine ? `${routine.name || 'Untitled routine'} · Stretch Timer` : 'Routine · Stretch Timer'}</title>
</svelte:head>

{#if !routine}
	<div class="card">
		<p class="muted" style="margin: 0">This routine doesn’t exist any more.</p>
		<a class="btn small" href="/" style="margin-top: 0.6rem">← Back to routines</a>
	</div>
{:else}
	<a class="back-link" href="/">‹ Routines</a>

	<input
		class="title-input"
		type="text"
		bind:value={routine.name}
		oninput={saveAll}
		placeholder="Name this routine"
		aria-label="Routine name"
	/>
	<p class="summary muted">
		<strong>{formatSeconds(total)}</strong> total · {routine.stretches.length} stretch{routine.stretches.length === 1 ? '' : 'es'}
	</p>

	<section class="card options-card">
		<div class="option-row">
			<div class="option-copy">
				<span class="option-title">Rest</span>
				<span class="muted small">Between stretches and sides</span>
			</div>
			<Stepper
				bind:value={routine.breakSeconds}
				min={0}
				max={300}
				step={5}
				label="Rest"
				format={(v) => (v === 0 ? 'Off' : durationText(v))}
				onchange={saveAll}
			/>
		</div>
		<div class="option-row">
			<div class="option-copy">
				<span class="option-title">Sets</span>
				<span class="muted small">{(routine.sets ?? 1) <= 1 ? 'Play through once' : `Repeat everything ${routine.sets}×`}</span>
			</div>
			<Stepper
				bind:value={() => routine.sets ?? 1, (v) => (routine.sets = v)}
				min={1}
				max={20}
				step={1}
				label="Sets"
				suffix="×"
				onchange={saveAll}
			/>
		</div>
	</section>

	<div class="spread list-heading">
		<h2>Stretches</h2>
		{#if routine.stretches.length > 1}
			<span class="muted small">Drag ⠿ to reorder</span>
		{/if}
	</div>

	{#if routine.stretches.length === 0}
		<div class="card empty-list">
			<p style="margin: 0 0 0.75rem">No stretches yet.</p>
			<button class="btn primary" onclick={() => (showPicker = true)}>＋ Add your first stretch</button>
		</div>
	{:else}
		<ol class="st-list" bind:this={listEl}>
			{#each routine.stretches as s, i (s.id)}
				<li
					class="card st-item"
					class:over={dragIndex !== null && overIndex === i && dragIndex !== i}
					class:dragging={dragIndex === i}
				>
					<span
						class="drag-handle"
						role="button"
						tabindex="0"
						aria-label={`Reorder ${s.name || 'stretch'} (use arrow keys)`}
						title="Drag to reorder"
						onpointerdown={(e) => handlePointerDown(e, i)}
						onpointermove={handlePointerMove}
						onpointerup={handlePointerUp}
						onpointercancel={handlePointerCancel}
						onkeydown={(e) => handleHandleKey(e, i)}>⠿</span
					>
					<button class="st-body" onclick={() => (editingId = s.id)}>
						<PhotoThumb photoId={s.photoId} iconKey={s.iconKey} name={s.name} size={56} rounded={10} />
						<span class="st-copy">
							<span class="st-name">{s.name || 'Untitled stretch'}</span>
							<span class="st-meta muted small">{stretchDurationLabel(s)}</span>
						</span>
						<span class="chevron" aria-hidden="true">›</span>
					</button>
				</li>
			{/each}
		</ol>
		<button class="btn add-btn" onclick={() => (showPicker = true)}>＋ Add stretch</button>
	{/if}

	<div class="danger-zone">
		<button class="btn ghost danger small" onclick={removeRoutine}>Delete routine</button>
	</div>

	{#if routine.stretches.length > 0}
		<div class="play-bar">
			<button class="btn primary play-bar-btn" onclick={() => goto(`/player/${routine.id}`)}>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>
				Start · {formatSeconds(total)}
			</button>
		</div>
	{/if}

	{#if showPicker}
		<StockStretchPicker onselect={handleSelectStock} oncustom={handleAddCustom} onclose={() => (showPicker = false)} />
	{/if}

	{#if editing}
		{@const s = editing}
		<Modal title="Edit stretch" onclose={() => (editingId = null)} class="stretch-sheet">
			<div class="sheet-visual">
				{#if editingPhotoUrl}
					<img src={editingPhotoUrl} alt={s.name} />
				{:else}
					<StretchIllustration iconKey={s.iconKey} name={s.name} size="100%" rounded={14} />
				{/if}
			</div>

			<div class="field">
				<label for="stretch-name">Name</label>
				<input id="stretch-name" type="text" bind:value={s.name} oninput={saveAll} placeholder="e.g. Hamstring stretch" />
			</div>

			<div class="field">
				<label for="stretch-desc">How to do it <span class="muted">(optional)</span></label>
				<textarea
					id="stretch-desc"
					bind:value={s.description}
					oninput={saveAll}
					rows={3}
					placeholder="Posture cues, breathing tips…"
				></textarea>
			</div>

			<div class="field">
				<span class="flabel">Sides</span>
				<div class="sides-switch" role="radiogroup" aria-label="Sides">
					<button
						role="radio"
						aria-checked={s.sides === 'one'}
						class:selected={s.sides === 'one'}
						onclick={() => {
							s.sides = 'one';
							saveAll();
						}}
					>
						<strong>One</strong>
						<span class="muted small">Single timer</span>
					</button>
					<button
						role="radio"
						aria-checked={s.sides === 'two'}
						class:selected={s.sides === 'two'}
						onclick={() => {
							s.sides = 'two';
							saveAll();
						}}
					>
						<strong>Both sides</strong>
						<span class="muted small">Left, then right</span>
					</button>
				</div>
			</div>

			<div class="option-row sheet-duration">
				<div class="option-copy">
					<span class="option-title">{s.sides === 'two' ? 'Time per side' : 'Time'}</span>
					{#if s.sides === 'two'}<span class="muted small">{durationText(s.durationSeconds * 2)} for both</span>{/if}
				</div>
				<Stepper bind:value={s.durationSeconds} min={5} max={600} step={5} label="Time" format={durationText} onchange={saveAll} />
			</div>

			<div class="field">
				<span class="flabel">Photo <span class="muted">(optional, replaces the drawing)</span></span>
				<PhotoPicker
					photoId={s.photoId}
					onphoto={(id) => {
						s.photoId = id;
						saveAll();
					}}
				/>
			</div>

			<div class="sheet-tools">
				<button class="btn small" onclick={() => moveItem(editingIndex, editingIndex - 1)} disabled={editingIndex <= 0}>↑ Move up</button>
				<button
					class="btn small"
					onclick={() => moveItem(editingIndex, editingIndex + 1)}
					disabled={editingIndex >= routine.stretches.length - 1}>↓ Move down</button
				>
				<button class="btn small" onclick={() => duplicateStretch(editingIndex)}>Duplicate</button>
				<button class="btn small danger" onclick={() => deleteStretch(editingIndex)}>Remove</button>
			</div>

			<button class="btn primary sheet-done" onclick={() => (editingId = null)}>Done</button>
		</Modal>
	{/if}
{/if}

<style>
	.back-link {
		display: inline-flex;
		align-items: center;
		color: var(--accent);
		text-decoration: none;
		font-weight: 600;
		font-size: 0.95rem;
		padding: 0.2rem 0;
		margin-bottom: 0.35rem;
	}

	.title-input {
		width: 100%;
		font: inherit;
		font-size: 1.55rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		color: var(--text);
		background: transparent;
		border: 1px solid transparent;
		border-radius: 10px;
		padding: 0.15rem 0.35rem;
		margin-left: -0.35rem;
	}
	.title-input:hover {
		border-color: var(--border);
	}
	.title-input:focus {
		outline: none;
		border-color: var(--accent);
		background: var(--surface);
	}

	.summary {
		margin: 0.1rem 0 0.9rem;
		font-size: 0.92rem;
	}
	.summary strong {
		color: var(--text);
	}

	.options-card {
		padding: 0.2rem 0.9rem;
		margin-bottom: 1.2rem;
	}

	.option-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.6rem 0;
	}
	.options-card .option-row + .option-row {
		border-top: 1px solid var(--border);
	}

	.option-copy {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.option-title {
		font-weight: 650;
	}

	.list-heading {
		align-items: baseline;
		margin-bottom: 0.55rem;
	}
	.list-heading h2 {
		font-size: 1.1rem;
	}

	.empty-list {
		text-align: center;
		padding: 1.4rem 1rem;
	}

	.st-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.st-item {
		display: flex;
		align-items: stretch;
		padding: 0;
		margin: 0;
		transition:
			box-shadow 0.12s,
			border-color 0.12s,
			opacity 0.12s;
	}
	.st-item.over {
		border-color: var(--accent);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 35%, transparent);
	}
	.st-item.dragging {
		opacity: 0.55;
	}

	.drag-handle {
		display: grid;
		place-items: center;
		width: 2.2rem;
		flex-shrink: 0;
		color: var(--muted);
		font-size: 1.15rem;
		cursor: grab;
		touch-action: none;
		user-select: none;
		border-radius: 12px 0 0 12px;
	}
	.drag-handle:active {
		cursor: grabbing;
	}
	.drag-handle:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}

	.st-body {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.55rem 0.75rem 0.55rem 0;
		background: none;
		border: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
		border-radius: 0 12px 12px 0;
	}

	.st-copy {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.st-name {
		font-weight: 650;
		line-height: 1.25;
	}

	.add-btn {
		width: 100%;
		margin-top: 0.6rem;
		border-style: dashed;
		background: transparent;
		color: var(--accent);
		font-weight: 700;
		padding: 0.75rem;
	}

	.danger-zone {
		display: flex;
		justify-content: center;
		margin: 2rem 0 0.5rem;
	}

	.play-bar {
		position: sticky;
		bottom: calc(4.4rem + env(safe-area-inset-bottom));
		margin-top: 1rem;
		z-index: 5;
		display: flex;
		justify-content: center;
		pointer-events: none;
	}
	@media (min-width: 601px) {
		.play-bar {
			bottom: 1rem;
		}
	}
	.play-bar-btn {
		pointer-events: auto;
		width: 100%;
		max-width: 420px;
		padding: 0.85rem 1.2rem;
		font-size: 1.05rem;
		font-weight: 800;
		border-radius: 14px;
		box-shadow: 0 8px 24px color-mix(in srgb, var(--accent) 35%, transparent);
	}

	/* ---- Edit sheet ---- */
	:global(.stretch-sheet) {
		max-width: 480px;
	}
	.sheet-visual {
		display: flex;
		justify-content: center;
		margin-bottom: 0.9rem;
	}
	.sheet-visual :global(svg),
	.sheet-visual img {
		width: min(100%, 260px) !important;
	}
	.sheet-visual img {
		aspect-ratio: 5 / 4;
		object-fit: cover;
		border-radius: 14px;
	}

	.sides-switch {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}
	.sides-switch button {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.05rem;
		padding: 0.6rem 0.75rem;
		border-radius: 12px;
		border: 1.5px solid var(--border);
		background: var(--surface);
		color: var(--text);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}
	.sides-switch button.selected {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 10%, var(--surface));
	}

	.sheet-duration {
		margin-bottom: 0.6rem;
	}

	.sheet-tools {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.45rem;
		margin: 0.4rem 0 0.9rem;
		padding-top: 0.9rem;
		border-top: 1px solid var(--border);
	}

	.sheet-done {
		width: 100%;
		font-weight: 700;
		padding: 0.75rem;
	}
</style>
