<script lang="ts">
		import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { deletePhotoData, getPhotoData, savePhotoData } from '$lib/storage';
	import { deleteRoutine, getRoutine, newStretch, saveAll } from '$lib/stores.svelte';
	import { stretchDurationLabel } from '$lib/timeline';
	import { uid } from '$lib/util';
	import { type Stretch } from '$lib/types';
	import Stepper from '$lib/components/Stepper.svelte';
	import PhotoPicker from '$lib/components/PhotoPicker.svelte';
	import PhotoThumb from '$lib/components/PhotoThumb.svelte';

	const routine = $derived(getRoutine(page.params.id ?? '') ?? null);
	let editingId = $state<string | null>(null);
	let dragIndex = $state<number | null>(null);
	let overIndex = $state<number | null>(null);

	function addStretch(): void {
		if (!routine) return;
		const s = newStretch();
		routine.stretches.push(s);
		saveAll();
		editingId = s.id;
	}

	function deleteStretch(index: number): void {
		if (!routine) return;
		const [removed] = routine.stretches.splice(index, 1);
		saveAll();
		if (removed.photoId) void deletePhotoData(removed.photoId).catch(() => {});
		if (editingId === removed.id) editingId = null;
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
	}

	function move(index: number, delta: number): void {
		if (!routine) return;
		const j = index + delta;
		if (j < 0 || j >= routine.stretches.length) return;
		const [item] = routine.stretches.splice(index, 1);
		routine.stretches.splice(j, 0, item);
		saveAll();
	}

	function dropTo(target: number): void {
		if (dragIndex === null || dragIndex === target) {
			dragIndex = null;
			overIndex = null;
			return;
		}
		if (!routine) return;
		const [item] = routine.stretches.splice(dragIndex, 1);
		routine.stretches.splice(target, 0, item);
		saveAll();
		dragIndex = null;
		overIndex = null;
	}

	function removeRoutine(): void {
		if (!routine) return;
		if (confirm(`Delete "${routine.name}"? This cannot be undone.`)) {
			deleteRoutine(routine.id);
			goto('/');
		}
	}
</script>

<svelte:head>
	<title>{routine ? routine.name : 'Routine'}</title>
</svelte:head>

{#if !routine}
	<div class="card">
		<p class="muted" style="margin: 0">Routine not found.</p>
		<a class="btn small" href="/" style="margin-top: 0.6rem">← Back to routines</a>
	</div>
{:else}
	<div class="spread" style="margin-bottom: 0.9rem">
		<a class="btn small ghost" href="/">← Routines</a>
		<button class="btn small danger" onclick={removeRoutine}>Delete routine</button>
	</div>

	<section class="card" style="margin-bottom: 0.9rem">
		<div class="field" style="margin: 0">
			<label for="routine-name">Routine name</label>
			<input
				id="routine-name"
				type="text"
				bind:value={routine.name}
				oninput={saveAll}
				placeholder="e.g. Morning mobility"
			/>
		</div>
	</section>

	<div class="spread" style="margin-bottom: 0.6rem">
		<h2 style="font-size: 1.1rem">Stretches</h2>
		<button class="btn primary small" onclick={addStretch}>＋ Add stretch</button>
	</div>

	{#if routine.stretches.length === 0}
		<div class="card">
			<p class="muted" style="margin: 0">No stretches yet — add your first one.</p>
		</div>
	{/if}

	{#each routine.stretches as s, i (s.id)}
		<div
			class="card stretch-card"
			role="group"
			class:editor={editingId === s.id}
			class:over={overIndex === i}
			ondragover={(e) => {
				e.preventDefault();
				overIndex = i;
			}}
			ondrop={(e) => {
				e.preventDefault();
				dropTo(i);
			}}
			ondragend={() => {
				dragIndex = null;
				overIndex = null;
			}}
		>
			<span
				class="drag-handle"
				role="button"
				tabindex="-1"
				aria-label="Drag to reorder"
				draggable="true"
				ondragstart={(e) => {
					dragIndex = i;
					if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
				}}
				title="Drag to reorder"
				>⠿</span
			>

			<PhotoThumb photoId={s.photoId} />

			<div class="stretch-main">
				{#if editingId === s.id}
					<input
						type="text"
						bind:value={s.name}
						oninput={saveAll}
						placeholder="Stretch name"
						style="margin-bottom: 0.4rem"
					/>
				{:else}
					<div class="stretch-name">{s.name || 'Untitled stretch'}</div>
				{/if}
				<div class="stretch-meta">
					<span class="badge">{stretchDurationLabel(s)}</span>
					{#if s.sides === 'two'}
						<span class="badge">L → R</span>
					{/if}
					{#if s.description}
						<span>{s.description.length > 60 ? s.description.slice(0, 60) + '…' : s.description}</span>
					{/if}
				</div>
			</div>

			<div class="row" style="flex-direction: column; gap: 0.15rem; align-items: stretch">
				<button class="icon-btn" onclick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
				<button
					class="icon-btn"
					onclick={() => move(i, 1)}
					disabled={i === routine.stretches.length - 1}
					aria-label="Move down"
					>↓</button
				>
			</div>

			<div class="row">
				<button class="btn small" onclick={() => (editingId = editingId === s.id ? null : s.id)}>
					{editingId === s.id ? 'Done' : 'Edit'}
				</button>
				<button class="btn small" onclick={() => duplicateStretch(i)}>Copy</button>
				<button class="btn small danger" onclick={() => deleteStretch(i)}>✕</button>
			</div>
		</div>

		{#if editingId === s.id}
			<div class="card editor" style="margin-top: -0.25rem">
				<div class="field">
					<span class="flabel">Description</span>
					<textarea
						bind:value={s.description}
						oninput={saveAll}
						placeholder="How to do this stretch (optional)"
					></textarea>
				</div>

				<div class="field">
					<span class="flabel">Sides</span>
					<label class="row" style="gap: 1rem; font-weight: 400">
						<span>
							<input
								type="radio"
								name={`sides-${s.id}`}
								checked={s.sides === 'one'}
								onchange={() => {
									s.sides = 'one';
									saveAll();
								}}
							/>
							One side
						</span>
						<span>
							<input
								type="radio"
								name={`sides-${s.id}`}
								checked={s.sides === 'two'}
								onchange={() => {
									s.sides = 'two';
									saveAll();
								}}
							/>
							Two sides (Left → beep → Right)
						</span>
					</label>
				</div>

				{#if s.sides === 'one'}
					<div class="field">
						<span class="flabel">Duration</span>
						<Stepper bind:value={s.durationSeconds} onchange={saveAll} />
					</div>
				{:else}
					<div class="field">
						<span class="flabel">Duration for each side</span>
						<Stepper bind:value={s.durationSeconds} onchange={saveAll} />
						<div class="muted small" style="margin-top: 0.3rem">The same countdown is used for Left and Right.</div>
					</div>
				{/if}

				<div class="field" style="margin: 0">
					<span class="flabel">Photo (optional)</span>
					<PhotoPicker
						photoId={s.photoId}
						onphoto={(id) => {
							s.photoId = id;
							saveAll();
						}}
					/>
				</div>
			</div>
		{/if}
	{/each}
{/if}
