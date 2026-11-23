<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		addRoutine,
		applyFixer,
		deleteRoutineWithUndo,
		duplicateRoutine,
		newRoutine,
		painLog,
		routines,
		saveAll,
		shuffleMicroBreak,
		updateSettings,
		settings,
		streak,
		starterRoutine,
		type StarterRoutineKind
	} from '$lib/stores.svelte';
	import { buildTimeline, timelineTotal } from '$lib/timeline';
	import { onMount } from 'svelte';
	import {
		dueToday,
		formatTime,
		frequencyLabel,
		goalProgress,
		reviewLastWeek,
		scheduleLabel,
		scheduledOn
	} from '$lib/frequency';
	import { scheduleIcs } from '$lib/calendar';
	import { currentStreak, fixersAvailable, fixerProgress, repairGap } from '$lib/streak';
	import { addDays, formatSeconds, todayKey } from '$lib/time';
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
		{ kind: 'shoulder-rehab', title: 'Shoulder & upper back', description: 'Rotator cuff and posture work' },
		{ kind: 'wrist-relief', title: 'Wrist & forearm', description: 'For RSI-prone hands and forearms' },
		{ kind: 'thoracic-outlet', title: 'Thoracic outlet', description: 'Open the neck, chest and collarbone' },
		{ kind: 'finger-band', title: 'Finger band', description: 'Extensor band: reps, holds and slow lowers' },
		{ kind: 'wrist-dumbbells', title: 'Wrist dumbbells', description: 'Six wrist movements, three rounds' },
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

	function play(r: Routine): void {
		goto(`/player/${r.id}`);
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

	/** '18 min', for lines that also show clock times. */
	function routineLength(r: Routine): string {
		return `${Math.max(1, Math.round(timelineTotal(buildTimeline(r, settings)) / 60))} min`;
	}

	const streakNow = $derived(currentStreak(streak));
	const doneToday = $derived(streak.completedDates.includes(todayKey()));
	const fixers = $derived(fixersAvailable(streak));
	const gap = $derived(repairGap(streak));
	const canRepair = $derived(gap.length > 0 && fixers >= gap.length);

	/* ------------------------- weekly plan ------------------------- */

	/** Plan rows run Monday to Sunday; values index Date.getDay(). */
	const planDays = [1, 2, 3, 4, 5, 6, 0];
	const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const weeklyGoals = $derived(routines.filter((r) => r.frequency?.per === 'week'));
	const hasSchedule = $derived(routines.some((r) => (r.schedule?.days.length ?? 0) > 0 || r.frequency?.per === 'week'));
	/** Ticks each minute so timed slots move from "At 2:00 pm" to "Due 2:00 pm". */
	let now = $state(new Date());
	const todayIndex = $derived(now.getDay());
	onMount(() => {
		const timer = setInterval(() => (now = new Date()), 60_000);
		return () => clearInterval(timer);
	});
	const due = $derived(dueToday(routines, now));
	const upNext = $derived(due[0] ?? null);
	const scheduledToday = $derived(scheduledOn(routines, todayKey(now)).length > 0);
	let showPlanModal = $state(false);
	let showWeekModal = $state(false);

	/** This week, Monday first: what's scheduled each day and how much of it got done. */
	const weekDays = $derived.by(() => {
		const today = todayKey(now);
		const monday = addDays(today, -((todayIndex + 6) % 7));
		return planDays.map((day, i) => {
			const key = addDays(monday, i);
			const items = scheduledOn(routines, key);
			const [y, m, d] = key.split('-').map(Number);
			return {
				key,
				letter: dayNames[day][0],
				name: dayNames[day],
				date: new Date(y, m - 1, d).toLocaleDateString([], { day: 'numeric', month: 'short' }),
				items,
				allDone: items.length > 0 && items.every((it) => it.done >= it.target),
				done: streak.completedDates.includes(key),
				isToday: key === today,
				past: key < today
			};
		});
	});

	/** Tick a routine on or off for a weekday from the schedule grid. */
	function toggleScheduled(r: Routine, day: number): void {
		const days = r.schedule?.days ?? [];
		const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort();
		if (next.length === 0 && (r.schedule?.times.length ?? 0) === 0) r.schedule = undefined;
		else r.schedule = { days: next, times: r.schedule?.times ?? [], since: next.length > days.length ? todayKey() : r.schedule?.since };
		if (r.schedule) r.frequency = undefined;
		saveAll();
	}

	/** Hand every scheduled time to the calendar app: share sheet where supported, else a download. */
	async function exportCalendar(): Promise<void> {
		const { ics, events } = scheduleIcs(routines, settings, location.origin);
		if (events === 0) {
			showToast('Give a routine a time of day first');
			return;
		}
		const file = new File([ics], 'stretch-schedule.ics', { type: 'text/calendar' });
		if (navigator.canShare?.({ files: [file] })) {
			try {
				await navigator.share({ files: [file], title: 'Stretch schedule' });
				return;
			} catch (err) {
				if ((err as DOMException).name === 'AbortError') return;
			}
		}
		const url = URL.createObjectURL(file);
		const a = Object.assign(document.createElement('a'), { href: url, download: file.name });
		a.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	/* ------------------------- weekly review ------------------------- */

	const thisMonday = $derived(addDays(todayKey(now), -((now.getDay() + 6) % 7)));
	const review = $derived(reviewLastWeek(routines, streak.completedDates, now));
	/** Pain average for the 7 days starting at `from`, or null without entries. */
	function painAverage(from: string): number | null {
		const to = addDays(from, 6);
		const scores = painLog.filter((p) => p.date >= from && p.date <= to).map((p) => p.score);
		return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
	}
	const painLast = $derived(painAverage(review.from));
	const painBefore = $derived(painAverage(addDays(review.from, -7)));
	const showReview = $derived(
		settings.reviewDismissed !== thisMonday && (review.scheduled > 0 || review.activeDays > 0 || painLast !== null)
	);

	function dismissReview(): void {
		updateSettings({ reviewDismissed: thisMonday });
	}

	function dayName(key: string): string {
		const [y, m, d] = key.split('-').map(Number);
		return new Date(y, m - 1, d).toLocaleDateString([], { weekday: 'long' });
	}

	function openPlan(): void {
		showWeekModal = false;
		showPlanModal = true;
	}

	function startMicroBreak(): void {
		const r = shuffleMicroBreak();
		goto(`/player/${r.id}`);
	}

	function handleRepairStreak(): void {
		if (gap.length === 0 || fixers < gap.length) return;
		const [y, m, d] = gap[0].split('-').map(Number);
		const first = new Date(y, m - 1, d).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
		const dateDesc = gap.length === 1 ? first : `${gap.length} missed days`;
		const fixerDesc = gap.length === 1 ? '1 streak fixer' : `${gap.length} streak fixers`;
		if (confirm(`Use ${fixerDesc} to fill in ${dateDesc} and restore your streak?`)) {
			applyFixer();
		}
	}
</script>

<svelte:head>
	<title>Routines · Stretch Timer</title>
</svelte:head>

<svelte:window onclick={() => (menuFor = null)} />

<div class="card streak-banner">
	<a class="streak-link" href="/stats">
		<span class="streak-flame" class:lit={streakNow > 0} aria-hidden="true">🔥</span>
		<span class="streak-copy">
			<strong>{streakNow > 0 ? `${streakNow} day streak` : 'No streak yet'}</strong>
			<span class="muted small">
				{#if streakNow === 0}
					Finish any routine to start one
				{:else if !doneToday && !canRepair}
					Finish a routine today to keep it going
				{:else}
					{fixers} fixer{fixers === 1 ? '' : 's'} · {fixerProgress(streak)}/7 days to the next
				{/if}
			</span>
		</span>
		<span class="today-pill" class:done={doneToday}>{doneToday ? '✓ Done today' : 'Not done today'}</span>
		{#if !canRepair}<span class="chevron" aria-hidden="true">›</span>{/if}
	</a>
	{#if canRepair}
		<button class="btn primary small" onclick={handleRepairStreak}>🩹 Fix streak</button>
	{/if}
</div>

{#if showReview}
	<section class="card review-card" aria-labelledby="review-title">
		<div class="spread">
			<h2 id="review-title">Last week</h2>
			<button class="icon-btn" aria-label="Dismiss last week’s review" onclick={dismissReview}>✕</button>
		</div>
		<div class="review-stats">
			{#if review.scheduled > 0}
				<div>
					<strong>{Math.round((review.completed / review.scheduled) * 100)}%</strong>
					<span class="muted small">of scheduled plays ({review.completed}/{review.scheduled})</span>
				</div>
			{/if}
			<div>
				<strong>{review.activeDays}/7</strong>
				<span class="muted small">days you stretched</span>
			</div>
			{#if painLast !== null}
				<div>
					<strong>{painLast.toFixed(1)}</strong>
					<span class="muted small">
						average pain{painBefore !== null
							? painLast < painBefore - 0.2
								? `, down from ${painBefore.toFixed(1)} ↓`
								: painLast > painBefore + 0.2
									? `, up from ${painBefore.toFixed(1)}`
									: ', about the same'
							: ''}
					</span>
				</div>
			{/if}
		</div>
		{#if review.bestDay}
			<p class="muted small" style="margin: 0.5rem 0 0">Best day: {dayName(review.bestDay)}.</p>
		{/if}
	</section>
{/if}

<section class="card today-card">
	<div class="today-row">
		<div class="today-copy">
			<span class="today-label">{upNext?.state === 'due' ? 'Due now' : upNext ? 'Up next' : 'Today'} · {dayNames[todayIndex]}</span>
			{#if upNext}
				<strong>{upNext.routine.name || 'Untitled routine'}</strong>
				<span class="muted small">
					{upNext.why}{upNext.time && upNext.target > 1 ? ` · ${upNext.done + 1} of ${upNext.target} today` : ''} · {routineLength(upNext.routine)}{due.length > 1 ? ` · ${due.length - 1} more after this` : ''}
				</span>
			{:else if scheduledToday}
				<strong>All done for today ✓</strong>
				<span class="muted small">Nice work. A micro-break is always a bonus.</span>
			{:else if hasSchedule}
				<strong>Rest day</strong>
				<span class="muted small">Nothing scheduled. A micro-break still counts.</span>
			{:else if routines.length === 0}
				<strong>Short on time?</strong>
				<span class="muted small">A 2-minute micro-break counts toward your streak.</span>
			{:else}
				<strong>Plan your week</strong>
				<span class="muted small">Give routines days and times, and the next one will be waiting here.</span>
			{/if}
		</div>
		{#if upNext}
			<button
				class="play-fab"
				onclick={() => play(upNext.routine)}
				disabled={upNext.routine.stretches.length === 0}
				aria-label={`Play ${upNext.routine.name || 'routine'}`}
				title="Play"
			>
				<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>
			</button>
		{/if}
	</div>
	{#if hasSchedule}
		<button class="week-strip" aria-label="Open this week’s schedule" onclick={() => (showWeekModal = true)}>
			{#each weekDays as d (d.key)}
				<span
					class="week-day"
					class:done={d.allDone || (d.items.length === 0 && d.done)}
					class:today={d.isToday}
					class:missed={d.past && d.items.length > 0 && !d.allDone}
					class:rest={d.items.length === 0}
					aria-hidden="true">{d.letter}</span
				>
			{/each}
		</button>
	{/if}
	<div class="today-actions">
		<button class="btn small" onclick={startMicroBreak}>⚡ 2-min micro-break</button>
		{#if routines.length > 0}
			{#if hasSchedule}
				<button class="btn small ghost" onclick={() => (showWeekModal = true)}>📅 This week</button>
			{:else}
				<button class="btn small ghost" onclick={openPlan}>📅 Schedule routines</button>
			{/if}
		{/if}
	</div>
</section>

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

{#if showWeekModal}
	<Modal title="This week" subtitle="Planned days and routine goals" onclose={() => (showWeekModal = false)}>
		<ol class="week-list">
			{#each weekDays as d (d.key)}
				<li class="week-list-day" class:today={d.isToday} class:past={d.past}>
					<div class="week-list-head">
						<strong>{d.isToday ? 'Today' : d.name}</strong>
						<span class="muted small">{d.date}</span>
					</div>
					{#if d.items.length === 0}
						<span class="muted small">Rest day{d.done ? ' · stretched anyway ✓' : ''}</span>
					{:else}
						{#each d.items as it (it.routine.id)}
							{@const met = it.done >= it.target}
							<div class="week-item" class:met class:missed={d.past && !met}>
								<span class="week-check" aria-hidden="true">{met ? '✓' : d.past ? '✕' : '○'}</span>
								<span class="week-item-name"
									>{it.routine.name || 'Untitled routine'}<small class="muted"
										>{it.times.length ? it.times.map(formatTime).join(', ') : 'Any time'}</small
									></span
								>
								{#if it.target > 1}<span class="muted small">{Math.min(it.done, it.target)}/{it.target}</span>{/if}
								{#if d.isToday && !met}
									<button class="btn small primary" onclick={() => play(it.routine)} disabled={it.routine.stretches.length === 0}>Play</button>
								{/if}
							</div>
						{/each}
					{/if}
				</li>
			{/each}
		</ol>
		{#if weeklyGoals.length > 0}
			<div class="section-label">Weekly goals</div>
			{#each weeklyGoals as r (r.id)}
				{@const progress = goalProgress(r, now)}
				{#if progress}
					<div class="week-item" class:met={progress.done >= progress.target}>
						<span class="week-check" aria-hidden="true">{progress.done >= progress.target ? '✓' : '○'}</span>
						<span class="week-item-name">{r.name || 'Untitled routine'}</span>
						<span class="muted small">{Math.min(progress.done, progress.target)}/{progress.target} this week</span>
					</div>
				{/if}
			{/each}
		{/if}
		<div class="week-actions">
			<button class="btn" onclick={openPlan}>Edit schedule</button>
			<button class="btn" onclick={exportCalendar}>📅 Add to calendar</button>
		</div>
		<p class="muted small" style="margin: 0.6rem 0 0">Set times of day on a routine from its edit screen.</p>
	</Modal>
{/if}

{#if showPlanModal}
	<Modal title="Schedule" subtitle="Tick the days each routine is for" onclose={() => (showPlanModal = false)}>
		{#if routines.length === 0}
			<p class="muted">Make a routine first.</p>
		{:else}
			<div class="plan-grid">
				<div class="plan-grid-row plan-grid-head">
					<span></span>
					{#each planDays as day (day)}
						<span class:today={day === todayIndex}>{dayNames[day][0]}</span>
					{/each}
				</div>
				{#each routines as r (r.id)}
					<div class="plan-grid-row">
						<span class="plan-grid-name">
							{r.name || 'Untitled routine'}
							{#if r.schedule?.times.length}<small class="muted">{r.schedule.times.map(formatTime).join(', ')}</small>{/if}
						</span>
						{#each planDays as day (day)}
							{@const on = !!r.schedule?.days.includes(day)}
							<button
								class="plan-cell"
								class:on
								aria-pressed={on}
								aria-label="{r.name || 'Untitled routine'} on {dayNames[day]}"
								onclick={() => toggleScheduled(r, day)}>{on ? '✓' : ''}</button
							>
						{/each}
					</div>
				{/each}
			</div>
		{/if}
		<button class="btn primary" style="width: 100%; margin-top: 1rem" onclick={() => (showPlanModal = false)}>Done</button>
	</Modal>
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
