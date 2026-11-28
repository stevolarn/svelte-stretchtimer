<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		applyFixer,
		dismissEase,
		easeOffRoutine,
		functionChecks,
		logFunctionCheck,
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
	import PainNow from '$lib/components/PainNow.svelte';
	import { dueToday, formatTime, goalProgress, reviewLastWeek, scheduledOn } from '$lib/frequency';
	import { scheduleIcs } from '$lib/calendar';
	import { currentStreak, fixersAvailable, fixerProgress, repairGap } from '$lib/streak';
	import {
		MEANINGFUL_CHANGE,
		daysPractised,
		easeRoutine,
		functionChange,
		functionCheckDue,
		morningVerdict,
		needsEasing,
		needsMorningCheck,
		notImproving,
		painTrend
	} from '$lib/recovery';
	import { freshStart, missedYesterday } from '$lib/habits';
	import { lessonOfWeek } from '$lib/lessons';
	import WarningSigns from '$lib/components/WarningSigns.svelte';
	import { addDays, todayKey } from '$lib/time';
	import { type Routine } from '$lib/types';
	import Modal from '$lib/components/Modal.svelte';
	import Onboarding from '$lib/components/Onboarding.svelte';
	import { showToast } from '$lib/toast.svelte';

	// First run only, decided once so the last step stays open after its routines are added.
	let showOnboarding = $state(!settings.onboarded && routines.length === 0 && streak.completedDates.length === 0);

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

	/** Six weeks or more without a meaningful gain in pain or function: suggest getting it checked. */
	const stuck = $derived(
		settings.painAlerts &&
			(!settings.notImprovingDismissed || settings.notImprovingDismissed <= addDays(todayKey(now), -28))
			? notImproving(settings.painTracking ? painLog : [], functionChecks, todayKey(now))
			: null
	);

	/* ------------------------ task check-in (PSFS) ------------------------ */

	const showFunction = $derived(
		settings.functionChecks &&
			routines.length > 0 &&
			functionCheckDue(functionChecks, todayKey(now)) &&
			settings.functionSnoozed !== todayKey(now)
	);
	const firstFunction = $derived(functionChecks.length === 0);
	const fnExamples = ['Typing', 'Opening jars', 'Carrying shopping'];
	const scaleSteps = Array.from({ length: 11 }, (_, n) => n);
	const lastFunction = functionChecks.at(-1);
	let fnNames = $state<string[]>([0, 1, 2].map((i) => lastFunction?.items[i]?.activity ?? ''));
	let fnScores = $state<(number | null)[]>([null, null, null]);
	/** Answer to the red-flag question; null until answered. */
	let fnFlag = $state<boolean | null>(null);

	const fnItems = $derived(
		fnNames.flatMap((name, i) => {
			const activity = name.trim();
			const score = fnScores[i];
			return activity && score !== null ? [{ activity, score }] : [];
		})
	);
	/** a row with a name but no score (or the reverse) would be dropped silently, so block saving */
	const fnHalfFilled = $derived(fnNames.some((name, i) => (name.trim() !== '') !== (fnScores[i] !== null)));
	const canSaveFunction = $derived(fnItems.length > 0 && fnFlag !== null && !fnHalfFilled);

	function saveFunction(): void {
		if (!canSaveFunction) return;
		const flag = fnFlag === true;
		logFunctionCheck(fnItems, flag);
		if (flag) showSigns = true;
		const change = functionChange(functionChecks);
		showToast(
			change && change.change >= MEANINGFUL_CHANGE
				? `Saved. Up ${change.change.toFixed(1)} since your first check-in, a real improvement.`
				: 'Saved. Next check-in in two weeks.'
		);
	}

	/** The first routine whose recent pain says do a bit less, with what easing it would change. */
	const easing = $derived.by(() => {
		if (!settings.painAlerts) return null;
		const log = settings.painTracking ? painLog : [];
		const checks = settings.morningCheck ? morningChecks : [];
		const today = todayKey(now);
		for (const r of routines) {
			const why = needsEasing(r, log, checks, today);
			if (why) return { routine: r, reason: why.reason, plan: easeRoutine(r) };
		}
		return null;
	});

	function applyEase(r: Routine): void {
		const result = easeOffRoutine(r.id);
		if (result?.changes.length) showToast(`Eased off: ${result.changes.length} change${result.changes.length === 1 ? '' : 's'}`);
	}

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

	/* ------------------------- habit nudges ------------------------- */

	const todayStr = $derived(todayKey(now));
	const habitRoutine = $derived(upNext?.routine ?? routines[0]);
	let missCardClosed = $state(false);
	const showMissCard = $derived(!missCardClosed && routines.length > 0 && missedYesterday(streak, routines, todayStr));
	const fresh = $derived(routines.length > 0 && !showMissCard ? freshStart(streak, todayStr, settings.freshStartDismissed) : null);
	const lesson = $derived(lessonOfWeek(todayStr));

	function handleRepairStreak(): void {
		if (gap.length === 0 || fixers < gap.length) return;
		const [y, m, d] = gap[0].split('-').map(Number);
		const first = new Date(y, m - 1, d).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
		const dateDesc = gap.length === 1 ? first : `${gap.length} missed days`;
		const fixerDesc = gap.length === 1 ? '1 reserve day' : `${gap.length} reserve days`;
		if (confirm(`Use ${fixerDesc} to fill in ${dateDesc} and restore your streak?`)) {
			applyFixer();
		}
	}
</script>

<svelte:head>
	<title>Stretch & Recovery</title>
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
					{fixers} reserve day{fixers === 1 ? '' : 's'} · {fixerProgress(streak)}/7 days to the next
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
					{upNext.why}{upNext.time && upNext.target > 1 ? ` · ${upNext.done + 1} of ${upNext.target} today` : ''} · {routineLength(upNext.routine)}
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
	{#if due.length > 1}
		<ul class="due-list" aria-label="Also due today">
			{#each due.slice(1) as item (item.routine.id)}
				<li class="due-row">
					<div class="due-copy">
						<span class="due-name">{item.routine.name || 'Untitled routine'}</span>
						<span class="muted small">{item.why} · {routineLength(item.routine)}</span>
					</div>
					<button
						class="play-fab small"
						onclick={() => play(item.routine, easeOff)}
						disabled={item.routine.stretches.length === 0}
						aria-label={`Play ${item.routine.name || 'routine'}`}
						title="Play"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
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
{#if settings.painTracking}
	<section class="card pain-card" aria-labelledby="pain-title">
		<h2 id="pain-title">How’s the pain?</h2>
		<PainNow />
	</section>
{/if}
{#if showMissCard && habitRoutine}
	{@const r = habitRoutine}
	<section class="card nudge-card" aria-labelledby="miss-title">
		<div class="spread">
			<h2 id="miss-title">Don’t miss twice</h2>
			<button class="icon-btn" aria-label="Dismiss" onclick={() => (missCardClosed = true)}>✕</button>
		</div>
		<p class="small">Yesterday slipped by. That’s fine; one missed day doesn’t undo your progress. Something small today keeps the habit going.</p>
		{#if r.cue}
			<p class="today-cue small">↪ After I {r.cue}</p>
		{/if}
		<div class="nudge-actions">
			{#if r.fallback === 'gentle'}
				<button class="btn small primary" onclick={() => play(r, true)}>Gentle {r.name || 'routine'}</button>
			{:else}
				<button class="btn small primary" onclick={startMicroBreak}>2-minute micro-break</button>
			{/if}
			<button class="link-btn" onclick={() => play(r)}>Full routine</button>
		</div>
	</section>
{:else if fresh && habitRoutine}
	{@const r = habitRoutine}
	<section class="card nudge-card" aria-labelledby="fresh-title">
		<div class="spread">
			<h2 id="fresh-title">{fresh.kind === 'comeback' ? 'Welcome back' : 'New month, fresh start'}</h2>
			<button class="icon-btn" aria-label="Dismiss" onclick={() => updateSettings({ freshStartDismissed: todayStr })}>✕</button>
		</div>
		<p class="small">
			{#if fresh.kind === 'comeback'}
				It’s been {fresh.daysAway} days. No need to catch up; a fresh start works best with one short session.
			{:else}
				A good moment to check your plan still fits: when you’ll do it, and what it follows.
			{/if}
		</p>
		<div class="nudge-actions">
			<button class="btn small primary" onclick={startMicroBreak}>Start small</button>
			<button class="btn small" onclick={() => goto('/routine/' + r.id)}>Review my plan</button>
		</div>
	</section>
{/if}

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

{#if stuck}
	<section class="card stuck-card" aria-labelledby="stuck-title">
		<div class="spread">
			<h2 id="stuck-title">Worth getting checked</h2>
			<button class="icon-btn" aria-label="Dismiss for four weeks" onclick={() => updateSettings({ notImprovingDismissed: todayKey(now) })}>✕</button>
		</div>
		<p class="small">{stuck.reason}</p>
		<p class="muted small">
			Steady practice usually shows some change by now. It doesn’t mean anything is wrong, but a physio or GP can
			check the diagnosis and the plan.
		</p>
		<div class="dose-choices">
			<button class="btn small" onclick={() => (showSigns = true)}>When to get it checked</button>
			<a class="btn small" href="/report">Summary for your clinician</a>
		</div>
	</section>
{/if}

{#if easing}
	<section class="card ease-card" aria-labelledby="ease-title">
		<h2 id="ease-title">Ease off {easing.routine.name || 'this routine'}?</h2>
		<p class="small">{easing.reason} Doing a bit less for a week usually helps more than stopping. <a href="/learn#pain-rule">Why</a></p>
		{#if easing.plan.changes.length > 0}
			<ul class="dose-list">
				{#each easing.plan.changes.slice(0, 3) as line}
					<li>{line}</li>
				{/each}
				{#if easing.plan.changes.length > 3}<li class="muted">and {easing.plan.changes.length - 3} more</li>{/if}
			</ul>
			<div class="dose-choices">
				<button class="btn small" onclick={() => applyEase(easing.routine)}>Ease off</button>
				<button class="btn small ghost" onclick={() => dismissEase(easing.routine.id)}>Not now</button>
				<a class="small" href="/routine/{easing.routine.id}">Edit routine</a>
			</div>
		{:else}
			<p class="muted small">
				This routine is already at its lightest. Try the gentle version or a micro-break for a few days.
			</p>
			<div class="dose-choices">
				<button class="btn small" onclick={() => dismissEase(easing.routine.id)}>OK</button>
				<a class="small" href="/routine/{easing.routine.id}">Edit routine</a>
			</div>
		{/if}
	</section>
{/if}

{#if showFunction}
	<section class="card fn-card" aria-labelledby="fn-title">
		<h2 id="fn-title">{firstFunction ? 'How are everyday tasks?' : 'Two-week check-in'}</h2>
		<p class="muted small">
			Pick up to three everyday things your pain makes hard, like typing, opening jars or carrying shopping. Rate
			each from 0 (can’t do it) to 10 (as well as before it started).
		</p>
		{#each [0, 1, 2] as i}
			<div class="fn-row">
				<input
					type="text"
					maxlength="80"
					placeholder="e.g. {fnExamples[i]}"
					aria-label="Everyday task {i + 1}"
					bind:value={fnNames[i]}
				/>
				<div class="fn-scale" role="group" aria-label="Rating for task {i + 1}">
					{#each scaleSteps as n}
						<button
							type="button"
							class="fn-chip"
							class:on={fnScores[i] === n}
							aria-pressed={fnScores[i] === n}
							aria-label="Rating {n} out of 10"
							onclick={() => (fnScores[i] = n)}>{n}</button>
					{/each}
				</div>
			</div>
		{/each}
		<div class="fn-flag" role="group" aria-labelledby="fn-flag-q">
			<p class="small" id="fn-flag-q">
				Since you started, any new or spreading numbness or tingling, weakness, dropping things or clumsy hands?
			</p>
			<div class="fn-yn">
				<button type="button" class="btn small" class:on={fnFlag === true} aria-pressed={fnFlag === true} onclick={() => (fnFlag = true)}>Yes</button>
				<button type="button" class="btn small" class:on={fnFlag === false} aria-pressed={fnFlag === false} onclick={() => (fnFlag = false)}>No</button>
			</div>
		</div>
		<div class="dose-choices">
			<button class="btn small primary" disabled={!canSaveFunction} onclick={saveFunction}>Save check-in</button>
			{#if fnHalfFilled}<span class="muted small">Give each task a name and a score.</span>{/if}
			<button class="btn small ghost" onclick={() => updateSettings({ functionSnoozed: todayKey(now) })}>Later</button>
		</div>
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


{#if settings.tipDismissed !== thisMonday}
	<section class="card tip-card" aria-label="Tip of the week">
		<div class="spread">
			<span class="today-label">Tip of the week</span>
			<button class="icon-btn" aria-label="Hide until next week" onclick={() => updateSettings({ tipDismissed: thisMonday })}>✕</button>
		</div>
		<strong>{lesson.title}</strong>
		<p class="muted small">{lesson.summary}</p>
		<a class="tip-link small" href={`/learn#${lesson.id}`}>Read more</a>
	</section>
{/if}

<p class="learn-link small"><a href="/learn">Learn: what helps RSI and why ›</a></p>

{#if showOnboarding}
	<Onboarding onclose={() => (showOnboarding = false)} />
{/if}

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
