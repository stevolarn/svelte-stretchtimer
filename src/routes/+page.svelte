<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		applyFixer,
		logMorningCheck,
		morningChecks,
		painLog,
		routines,
		saveAll,
		shuffleMicroBreak,
		updateSettings,
		settings,
		streak
	} from '$lib/stores.svelte';
	import { buildTimeline, timelineTotal } from '$lib/timeline';
	import { onMount } from 'svelte';
	import { dueToday, formatTime, goalProgress, reviewLastWeek, scheduledOn } from '$lib/frequency';
	import { scheduleIcs } from '$lib/calendar';
	import { currentStreak, fixersAvailable, fixerProgress, repairGap } from '$lib/streak';
	import { daysPractised, morningVerdict, needsMorningCheck, painTrend } from '$lib/recovery';
	import WarningSigns from '$lib/components/WarningSigns.svelte';
	import { addDays, todayKey } from '$lib/time';
	import { type Routine } from '$lib/types';
	import Modal from '$lib/components/Modal.svelte';
	import { showToast } from '$lib/toast.svelte';

	function play(r: Routine, gentle = false): void {
		goto(`/player/${r.id}${gentle ? '?gentle=1' : ''}`);
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
	const painLast = $derived(settings.painTracking ? painAverage(review.from) : null);
	const painBefore = $derived(painAverage(addDays(review.from, -7)));
	const showReview = $derived(
		settings.weeklyReview &&
			settings.reviewDismissed !== thisMonday && (review.scheduled > 0 || review.activeDays > 0 || painLast !== null)
	);

	function dismissReview(): void {
		updateSettings({ reviewDismissed: thisMonday });
	}

	const practised = $derived(daysPractised(streak.completedDates, 30, todayKey(now)));

	/* ----------------------- recovery check-ins ----------------------- */

	const askMorning = $derived(settings.morningCheck && needsMorningCheck(routines, streak.completedDates, morningChecks, todayKey(now)));
	/** A worse morning after yesterday's session: today's routine is suggested in its gentle version. */
	const easeOff = $derived(settings.morningCheck && morningVerdict(morningChecks, todayKey(now)) === 'worse');
	const trend = $derived(
		painTrend(settings.painTracking ? painLog : [], settings.morningCheck ? morningChecks : [], todayKey(now))
	);
	const showTrend = $derived(settings.painAlerts && trend.rising && settings.trendDismissed !== thisMonday);
	let showSigns = $state(false);

	function answerMorning(verdict: 'better' | 'same' | 'worse'): void {
		logMorningCheck(verdict);
		if (verdict === 'better') showToast('Good sign — carry on as planned');
		else if (verdict === 'same') showToast('Steady — keep the plan as it is');
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
	<title>Stretch Timer</title>
</svelte:head>

<div class="card streak-banner">
	<a class="streak-link" href="/stats">
		<span class="streak-flame" class:lit={streakNow > 0} aria-hidden="true">🔥</span>
		<span class="streak-copy">
			<strong>{streakNow > 0 ? `${streakNow} day streak` : 'No streak yet'}</strong>
			<span class="muted small">
				{#if streakNow === 0 && streak.completedDates.length > 0}
					One missed day doesn’t undo a habit — even 2 minutes gets you back on · {practised}/30 days
				{:else if streakNow === 0}
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

{#if askMorning}
	<section class="card morning-card" aria-labelledby="morning-title">
		<h2 id="morning-title">Morning check</h2>
		<p class="muted small">Compared with before yesterday’s session, how does it feel now?</p>
		<div class="morning-choices">
			<button class="btn" onclick={() => answerMorning('better')}>🙂 Better</button>
			<button class="btn" onclick={() => answerMorning('same')}>😐 Same</button>
			<button class="btn" onclick={() => answerMorning('worse')}>😣 Worse</button>
		</div>
	</section>
{/if}

{#if showTrend}
	<section class="card trend-card" aria-labelledby="trend-title">
		<div class="spread">
			<h2 id="trend-title">Pain is trending up</h2>
			<button class="icon-btn" aria-label="Dismiss for this week" onclick={() => updateSettings({ trendDismissed: thisMonday })}>✕</button>
		</div>
		<p class="small">{trend.reason}</p>
		<p class="muted small">
			Use gentle versions and micro-breaks for a few days, and cut back anything that flares it. If it keeps
			climbing, get it looked at.
		</p>
		<button class="btn small" onclick={() => (showSigns = true)}>When to get it checked</button>
	</section>
{/if}

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
				{#if upNext.routine.cue}
					<span class="today-cue small">↪ After I {upNext.routine.cue}</span>
				{/if}
				{#if easeOff}
					<span class="today-cue small">🌧 Worse this morning — gentle version today</span>
				{/if}
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
				<strong>Make your first routine</strong>
				<span class="muted small">Pick a ready-made flow or build your own. A 2-minute micro-break counts meanwhile.</span>
			{:else}
				<strong>Plan your week</strong>
				<span class="muted small">Give routines days and times, and the next one will be waiting here.</span>
			{/if}
		</div>
		{#if upNext}
			<button
				class="play-fab"
				onclick={() => play(upNext.routine, easeOff)}
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
		{#if routines.length === 0}
			<a class="btn small primary" href="/routines">＋ Add a routine</a>
		{/if}
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

{#if showSigns}
	<WarningSigns onclose={() => (showSigns = false)} />
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
