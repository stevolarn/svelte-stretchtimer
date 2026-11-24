<script lang="ts">
	import { page } from '$app/state';
	import { beforeNavigate, goto } from '$app/navigation';
	import { deletePhotoData, getPhotoData, savePhotoData } from '$lib/storage';
	import {
		addRoutineSet,
		deleteRoutineWithUndo,
		discardIfEmpty,
		dismissEase,
		easeOffRoutine,
		getRoutine,
		morningChecks,
		newStretch,
		painLog,
		saveAll,
		settings,
		skipProgress,
		stepUpRoutine,
		stretchFromStock
	} from '$lib/stores.svelte';
	import { easeRoutine, needsEasing, progressRoutine, readyToProgress } from '$lib/recovery';
	import { buildTimeline, clampMoveSets, clampRepSeconds, clampReps, durationText, stretchDurationLabel, stretchSeconds, timelineTotal } from '$lib/timeline';
	import { formatSeconds, todayKey } from '$lib/time';
	import { uid } from '$lib/util';
	import { showToast } from '$lib/toast.svelte';
	import { type Stretch, type StockStretch } from '$lib/types';
	import Stepper from '$lib/components/Stepper.svelte';
	import Segmented from '$lib/components/Segmented.svelte';
	import { formatTime, frequencyLabel, scheduleLabel } from '$lib/frequency';
	import { googleCalendarUrl } from '$lib/calendar';
	import PhotoPicker from '$lib/components/PhotoPicker.svelte';
	import PhotoThumb from '$lib/components/PhotoThumb.svelte';
	import StretchIllustration from '$lib/components/StretchIllustration.svelte';
	import StockStretchPicker from '$lib/components/StockStretchPicker.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import MuscleChips from '$lib/components/MuscleChips.svelte';
	import { muscleLabels, muscleList, musclesFor, type Muscle } from '$lib/muscles';

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
		routine.stretches.push(stretchFromStock(stock));
		saveAll();
		// The picker stays open (filters intact) so several stretches can be added in a row.
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

	const modeOptions = [
		{ value: 'hold', label: 'Hold' },
		{ value: 'reps', label: 'Reps' }
	];

	/** Keep durationSeconds equal to reps x tempo so code that only reads durationSeconds stays sensible. */
	function syncRepDuration(s: Stretch): void {
		s.durationSeconds = clampReps(s.reps) * clampRepSeconds(s.repSeconds);
	}

	function setStretchMode(s: Stretch, value: string): void {
		if (value === 'reps') {
			s.mode = 'reps';
			s.reps = clampReps(s.reps);
			s.repSeconds = clampRepSeconds(s.repSeconds);
			syncRepDuration(s);
		} else {
			// Reps fields stay in place (harmless); the hold keeps the current durationSeconds within the hold range.
			s.mode = undefined;
			s.durationSeconds = Math.min(600, Math.max(5, s.durationSeconds));
		}
		saveAll();
	}

	function setReps(s: Stretch, value: number): void {
		s.reps = value;
		syncRepDuration(s);
		saveAll();
	}

	function setRepSeconds(s: Stretch, value: number): void {
		s.repSeconds = value;
		syncRepDuration(s);
		saveAll();
	}

	function setMoveSets(s: Stretch, value: number): void {
		s.sets = value > 1 ? value : undefined;
		saveAll();
	}

	function setLoad(s: Stretch, value: string): void {
		s.load = value === '' ? undefined : value;
		saveAll();
	}

	function deleteStretch(index: number): void {
		if (!routine) return;
		const [removed] = routine.stretches.splice(index, 1);
		saveAll();
		if (editingId === removed.id) editingId = null;
		const routineId = routine.id;
		const list = routine.stretches;
		showToast(`Removed “${removed.name || 'Untitled stretch'}”`, {
			action: 'Undo',
			onAction: () => {
				// The routine itself may have been deleted while the toast was showing.
				const target = getRoutine(routineId)?.stretches;
				if (!target) return;
				target.splice(Math.min(index, target.length), 0, removed);
				saveAll();
			},
			onExpire: () => {
				const current = getRoutine(routineId)?.stretches ?? list;
				if (removed.photoId && !current.some((s) => s.id === removed.id)) {
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
		} else if (e.key === 'Enter' || e.key === ' ') {
			// The edit sheet has explicit move controls.
			e.preventDefault();
			editingId = routine?.stretches[index]?.id ?? null;
		}
	}

	const scheduleOptions = [
		{ value: 'off', label: 'Off' },
		{ value: 'days', label: 'Set days' },
		{ value: 'week', label: 'Weekly goal' }
	];
	/** Chip order Monday first; values are Date.getDay(). */
	const weekdayChips: Array<[number, string]> = [
		[1, 'M'],
		[2, 'T'],
		[3, 'W'],
		[4, 'T'],
		[5, 'F'],
		[6, 'S'],
		[0, 'S']
	];
	const scheduleMode = $derived(routine?.schedule ? 'days' : routine?.frequency?.per === 'week' ? 'week' : 'off');

	function setScheduleMode(value: string): void {
		if (!routine) return;
		routine.schedule = value === 'days' ? { days: [1, 2, 3, 4, 5], times: [], since: todayKey() } : undefined;
		routine.frequency = value === 'week' ? { per: 'week', times: 3, since: todayKey() } : undefined;
		saveAll();
	}

	function toggleDay(day: number): void {
		const s = routine?.schedule;
		if (!s) return;
		if (s.days.includes(day)) s.days = s.days.filter((d) => d !== day);
		else {
			s.days = [...s.days, day].sort();
			s.since = todayKey(); // new days only count from today in reviews
		}
		saveAll();
	}

	function setTime(index: number, value: string): void {
		const s = routine?.schedule;
		if (!s || !value) return;
		s.times[index] = value;
		s.times = [...new Set(s.times)].sort();
		s.since = todayKey();
		saveAll();
	}

	function addTime(): void {
		const s = routine?.schedule;
		if (!s) return;
		const last = s.times.at(-1);
		const next = last ? `${String(Math.min(23, Number(last.slice(0, 2)) + 3)).padStart(2, '0')}:${last.slice(3)}` : '09:00';
		s.times = [...new Set([...s.times, next])].sort();
		s.since = todayKey();
		saveAll();
	}

	function setCue(value: string): void {
		if (!routine) return;
		routine.cue = value.trim() ? value : undefined;
		saveAll();
	}

	const fallbackOptions = [
		{ value: 'micro', label: '2-min break' },
		{ value: 'gentle', label: 'Gentle version' }
	];

	function setFallback(value: string): void {
		if (!routine) return;
		routine.fallback = value === 'gentle' ? 'gentle' : undefined;
		saveAll();
	}

	/* ---------------------- ready to progress? ---------------------- */

	// Switched-off tracking doesn't count, so old scores or mornings can't trigger or block it.
	const progress = $derived(
		routine && settings.progressPrompts
			? readyToProgress(routine, settings.painTracking ? painLog : [], settings.morningCheck ? morningChecks : [])
			: null
	);
	/** What "Step up" would change, shown before it's applied. */
	const stepPlan = $derived(progress && routine ? progressRoutine(routine) : null);
	let previewing = $state(false);

	function plural(n: number, word: string): string {
		return `${n} ${word}${n === 1 ? '' : 's'}`;
	}

	/** Graded loading, one variable at a time: a small step up, an extra set, or neither for now. */
	function applyStepUp(): void {
		if (!routine) return;
		const result = stepUpRoutine(routine.id);
		previewing = false;
		if (result?.changes.length) showToast(`Stepped up: ${plural(result.changes.length, 'change')}`);
	}

	function addSet(): void {
		if (!routine) return;
		addRoutineSet(routine.id);
		previewing = false;
		showToast(`Now ${routine.sets} sets`);
	}

	function notYet(): void {
		if (!routine) return;
		skipProgress(routine.id);
		previewing = false;
	}

	/* ---------------------------- ease off? ---------------------------- */

	const easing = $derived(
		settings.painAlerts && routine
			? needsEasing(routine, settings.painTracking ? painLog : [], settings.morningCheck ? morningChecks : [])
			: null
	);
	const easePlan = $derived(easing && routine ? easeRoutine(routine) : null);

	function applyEase(): void {
		if (!routine) return;
		const result = easeOffRoutine(routine.id);
		if (result?.changes.length) showToast(`Eased off: ${plural(result.changes.length, 'change')}`);
	}

	function removeTime(index: number): void {
		const s = routine?.schedule;
		if (!s) return;
		s.times = s.times.filter((_, i) => i !== index);
		saveAll();
	}

	/** Up to two muscle names for a stretch row. */
	function muscleText(s: Stretch): string {
		const m = musclesFor(s);
		return m.length ? ` · ${m.slice(0, 2).map((k) => muscleLabels[k]).join(', ')}` : '';
	}

	function toggleMuscle(s: Stretch, m: Muscle): void {
		const current = new Set(musclesFor(s));
		if (current.has(m)) current.delete(m);
		else current.add(m);
		s.muscles = muscleList.filter((k) => current.has(k));
		saveAll();
	}

	function resetMuscles(s: Stretch): void {
		delete s.muscles;
		saveAll();
	}

	// A routine is only kept once it has a stretch; leaving an empty one drops it.
	beforeNavigate((nav) => {
		const id = routine?.id;
		if (!id || nav.type === 'leave' || (nav.to?.route.id === '/routine/[id]' && nav.to.params?.id === id)) return;
		if (discardIfEmpty(id)) showToast('Empty routine not saved');
	});

	function removeRoutine(): void {
		if (!routine) return;
		const id = routine.id;
		goto('/routines').then(() => deleteRoutineWithUndo(id));
	}
</script>

<svelte:head>
	<title>{routine ? `${routine.name || 'Untitled routine'} · Stretch Timer` : 'Routine · Stretch Timer'}</title>
</svelte:head>

{#if !routine}
	<div class="card">
		<p class="muted" style="margin: 0">This routine doesn’t exist any more.</p>
		<a class="btn small" href="/routines" style="margin-top: 0.6rem">← Back to routines</a>
	</div>
{:else}
	<a class="back-link" href="/routines">‹ Routines</a>

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
	{#if routine.stretches.length > 0}
		<div class="muscle-summary">
			<span class="muted small">Muscles worked</span>
			<MuscleChips {routine} limit={8} />
		</div>
	{/if}

	{#if easing && easePlan}
		<section class="card progress-card ease-card" aria-labelledby="ease-title">
			<h2 id="ease-title">Ease off for a week?</h2>
			<p class="small">{easing.reason}</p>
			<p class="muted small">
				Pain during exercise up to about 5/10 is fine if it settles by the next morning. When it doesn’t, doing a bit
				less for a week usually helps more than stopping. <a href="/learn#pain-rule">Why</a>
			</p>
			{#if easePlan.changes.length > 0}
				<ul class="dose-list">
					{#each easePlan.changes.slice(0, 5) as line}
						<li>{line}</li>
					{/each}
					{#if easePlan.changes.length > 5}<li class="muted">and {easePlan.changes.length - 5} more</li>{/if}
				</ul>
				<div class="progress-choices">
					<button class="btn small" onclick={applyEase}>Ease off</button>
					<button class="btn small ghost" onclick={() => dismissEase(routine.id)}>Not now</button>
				</div>
			{:else}
				<p class="muted small">
					This routine is already at its lightest. Try the gentle version or a micro-break for a few days.
				</p>
				<div class="progress-choices">
					<button class="btn small" onclick={() => dismissEase(routine.id)}>OK</button>
				</div>
			{/if}
		</section>
	{:else if progress && stepPlan}
		<section class="card progress-card" aria-labelledby="progress-title">
			<h2 id="progress-title">Ready to progress?</h2>
			<p class="muted small">
				Played on {progress.plays} days in the last two weeks, pain no higher than {progress.worst}/10 and no worse mornings.
				Change one thing at a time, then see how the next morning feels.
			</p>
			{#if previewing && stepPlan.changes.length > 0}
				<ul class="dose-list">
					{#each stepPlan.changes.slice(0, 5) as line}
						<li>{line}</li>
					{/each}
					{#if stepPlan.changes.length > 5}<li class="muted">and {stepPlan.changes.length - 5} more</li>{/if}
				</ul>
			{/if}
			{#if stepPlan.changes.length === 0 && stepPlan.tips.length === 0}
				<p class="muted small">Every hold is already a minute or more. Add a set, or swap a move for a harder one.</p>
			{/if}
			{#if (previewing || stepPlan.changes.length === 0) && stepPlan.tips.length > 0}
				<ul class="dose-list muted">
					{#each stepPlan.tips as tip}
						<li>{tip}</li>
					{/each}
				</ul>
			{/if}
			<div class="progress-choices">
				{#if previewing}
					<button class="btn small" onclick={applyStepUp}>Apply</button>
					<button class="btn small ghost" onclick={() => (previewing = false)}>Cancel</button>
				{:else}
					<button class="btn small" onclick={() => (previewing = true)} disabled={stepPlan.changes.length === 0}>Step up</button>
					<button class="btn small" onclick={addSet} disabled={(routine.sets ?? 1) >= 20}>＋1 set</button>
					<button class="btn small ghost" onclick={notYet}>Not yet</button>
				{/if}
			</div>
		</section>
	{/if}

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
							<span class="st-meta muted small">{stretchDurationLabel(s)}{muscleText(s)}</span>
						</span>
						<span class="chevron" aria-hidden="true">›</span>
					</button>
				</li>
			{/each}
		</ol>
		<button class="btn add-btn" onclick={() => (showPicker = true)}>＋ Add stretch</button>
	{/if}

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

	<section class="card options-card schedule-card">
		<div class="option-row">
			<div class="option-copy">
				<span class="option-title">Schedule</span>
				<span class="muted small">
					{#if routine.schedule}
						{scheduleLabel(routine.schedule)}
					{:else if routine.frequency?.per === 'week'}
						{frequencyLabel(routine.frequency)}, any days
					{:else}
						Not scheduled
					{/if}
				</span>
			</div>
		</div>
		<Segmented value={scheduleMode} options={scheduleOptions} label="Schedule" onchange={setScheduleMode} />
		{#if routine.schedule}
			{@const sched = routine.schedule}
			<div class="day-chips" role="group" aria-label="Days">
				{#each weekdayChips as [day, letter] (day)}
					<button
						type="button"
						class="day-chip"
						class:on={sched.days.includes(day)}
						aria-pressed={sched.days.includes(day)}
						aria-label={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]}
						onclick={() => toggleDay(day)}>{letter}</button
					>
				{/each}
			</div>
			<div class="time-list">
				{#each sched.times as time, i (time)}
					<div class="time-row">
						<input type="time" value={time} onchange={(e) => setTime(i, e.currentTarget.value)} aria-label={`Time ${i + 1}`} />
						{#if sched.days.length > 0}
							<a class="btn small ghost" href={googleCalendarUrl(routine, time, settings, location.origin)} target="_blank" rel="noopener">
								📅 Google Calendar
							</a>
						{/if}
						<button type="button" class="icon-btn" aria-label={`Remove ${formatTime(time)}`} onclick={() => removeTime(i)}>✕</button>
					</div>
				{/each}
				<button type="button" class="btn small" onclick={addTime}>＋ Add a time</button>
				<p class="muted small" style="margin: 0">
					{sched.times.length === 0
						? 'No times: once a day, whenever suits you.'
						: `${sched.times.length} play${sched.times.length === 1 ? '' : 's'} on each of these days. Add each time to your calendar for an alarm.`}
				</p>
			</div>
		{:else if routine.frequency?.per === 'week'}
			{@const freq = routine.frequency}
			<div class="option-row">
				<div class="option-copy">
					<span class="option-title">Times a week</span>
					<span class="muted small">Shows in Up next until you’ve hit it</span>
				</div>
				<Stepper bind:value={freq.times} min={1} max={7} step={1} label="Times a week" suffix="×" onchange={saveAll} />
			</div>
		{/if}
		<label class="cue-field">
			<span class="option-title">Habit cue</span>
			<span class="cue-input">
				<span class="muted">After I</span>
				<input
					type="text"
					value={routine.cue ?? ''}
					oninput={(e) => setCue(e.currentTarget.value)}
					placeholder="pour my morning coffee"
					maxlength="60"
				/>
			</span>
			<span class="muted small">Tie it to something you already do every day — it’s the cue to start.</span>
		</label>
		<div class="cue-field">
			<span class="option-title">If I can’t, I’ll do</span>
			<Segmented value={routine.fallback ?? 'micro'} options={fallbackOptions} label="If I can’t, I’ll do" onchange={setFallback} />
			<span class="muted small">Plan B for a busy or sore day. A little still keeps the habit going.</span>
		</div>
	</section>

	{#if routine.history?.length}
		<details class="dose-history">
			<summary>Dose history</summary>
			<ul>
				{#each [...routine.history].reverse() as change}
					<li class="muted small"><span class="dose-date">{change.date}</span> {change.note}</li>
				{/each}
			</ul>
		</details>
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
		<StockStretchPicker existing={routine.stretches} onselect={handleSelectStock} oncustom={handleAddCustom} onclose={() => (showPicker = false)} />
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
					<span class="option-title">Sets</span>
					<span class="muted small">Break between each</span>
				</div>
				<Stepper
					bind:value={() => clampMoveSets(s.sets), (v) => setMoveSets(s, v)}
					min={1}
					max={10}
					step={1}
					label="Sets"
					suffix=""
				/>
			</div>

			<div class="field">
				<span class="flabel">Type</span>
				<Segmented
					value={s.mode ?? 'hold'}
					options={modeOptions}
					label="Hold or reps"
					onchange={(v) => setStretchMode(s, v)}
				/>
			</div>

			{#if s.mode === 'reps'}
				<div class="option-row sheet-duration">
					<div class="option-copy">
						<span class="option-title">Reps</span>
						<span class="muted small">
							{durationText(stretchSeconds(s))}{s.sides === 'two' ? ' per side' : ' total'}
						</span>
					</div>
					<Stepper
						bind:value={() => clampReps(s.reps), (v) => setReps(s, v)}
						min={1}
						max={50}
						step={1}
						label="Reps"
						suffix=" reps"
					/>
				</div>

				<div class="option-row sheet-duration">
					<div class="option-copy">
						<span class="option-title">Seconds per rep</span>
						<span class="muted small">Tempo for each rep</span>
					</div>
					<Stepper
						bind:value={() => clampRepSeconds(s.repSeconds), (v) => setRepSeconds(s, v)}
						min={1}
						max={20}
						step={1}
						label="Seconds per rep"
					/>
				</div>

				<div class="field">
					<label for="stretch-load">Load <span class="muted">(optional)</span></label>
					<input
						id="stretch-load"
						type="text"
						value={s.load ?? ''}
						oninput={(e) => setLoad(s, e.currentTarget.value)}
						placeholder="e.g. red band, 1 kg"
						maxlength="60"
					/>
				</div>
			{:else}
				<div class="option-row sheet-duration">
					<div class="option-copy">
						<span class="option-title">{s.sides === 'two' ? 'Time per side' : 'Time'}</span>
						{#if s.sides === 'two'}<span class="muted small">{durationText(s.durationSeconds * 2)} for both</span>{/if}
					</div>
					<Stepper bind:value={s.durationSeconds} min={5} max={600} step={5} label="Time" format={durationText} onchange={saveAll} />
				</div>
			{/if}

			<div class="field">
				<span class="flabel">
					Muscles worked
					{#if s.muscles}<button type="button" class="link-btn small" style="margin-left: 0.4rem" onclick={() => resetMuscles(s)}>Reset</button>{/if}
				</span>
				<div class="muscle-pick" role="group" aria-label="Muscles worked">
					{#each muscleList as m (m)}
						{@const on = musclesFor(s).includes(m)}
						<button type="button" class="muscle-toggle" class:on aria-pressed={on} onclick={() => toggleMuscle(s, m)}>
							{muscleLabels[m]}
						</button>
					{/each}
				</div>
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

	.schedule-card {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		padding-bottom: 0.9rem;
	}
	.progress-card {
		margin-bottom: 1.2rem;
		border-left: 4px solid #2fa86b;
	}
	.progress-card h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	.progress-card p {
		margin: 0.3rem 0 0.6rem;
	}
	.progress-card.ease-card {
		border-left-color: #e3a21a;
	}
	.progress-choices {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.dose-history {
		margin-top: 1.2rem;
	}
	.dose-history summary {
		cursor: pointer;
		font-weight: 600;
	}
	.dose-history ul {
		margin: 0.4rem 0 0;
		padding: 0;
		list-style: none;
	}
	.dose-history li + li {
		margin-top: 0.25rem;
	}
	.dose-date {
		font-variant-numeric: tabular-nums;
		margin-right: 0.3rem;
	}
	.cue-field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding-top: 0.7rem;
		border-top: 1px solid var(--border);
	}
	.cue-input {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.cue-input input {
		flex: 1;
		min-width: 0;
	}
	.schedule-card .option-row + .option-row,
	.schedule-card .option-row:not(:first-child) {
		border-top: 1px solid var(--border);
	}
	.day-chips {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.35rem;
	}
	.day-chip {
		height: 2.4rem;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}
	.day-chip.on {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}
	.time-list {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
	}
	.time-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}
	.time-row input[type='time'] {
		background: var(--surface);
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.45rem 0.6rem;
		font: inherit;
	}
	.time-row .icon-btn {
		margin-left: auto;
	}

	.option-copy {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.option-title {
		font-weight: 650;
	}

	.muscle-summary {
		display: grid;
		gap: 0.35rem;
		margin: -0.25rem 0 1rem;
	}
	.muscle-pick {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}
	.muscle-toggle {
		padding: 0.3rem 0.65rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: 0.8rem;
		cursor: pointer;
		touch-action: manipulation;
	}
	.muscle-toggle.on {
		background: var(--accent);
		border-color: var(--accent);
		color: #ffffff;
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
		margin-bottom: 1.2rem;
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
		margin: 0.6rem 0 1.2rem;
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
		flex-wrap: wrap;
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
