<script lang="ts">
	import { applyFixer, logPain, painLog, streak, undoLastPain } from '$lib/stores.svelte';
	import { currentStreak, fixerProgress, fixersAvailable, longestStreak, repairGap } from '$lib/streak';
	import { addDays, todayKey } from '$lib/time';
	import { daysPractised } from '$lib/recovery';
	import WarningSigns from '$lib/components/WarningSigns.svelte';

	const WEEKS = 6;
	const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

	const today = $derived(todayKey());
	const now = $derived(currentStreak(streak));
	const best = $derived(longestStreak(streak));
	const totalDays = $derived(streak.completedDates.length);
	/** Unlike the streak, this doesn't reset after one miss — closer to how habits actually form. */
	const practised = $derived(daysPractised(streak.completedDates, 30, today));
	let showSigns = $state(false);
	const doneToday = $derived(streak.completedDates.includes(today));
	const fixers = $derived(fixersAvailable(streak));
	const toNext = $derived(fixerProgress(streak));
	const gap = $derived(repairGap(streak));
	const canRepair = $derived(gap.length > 0 && fixers >= gap.length);

	/* ------------------------------ pain trend ------------------------------ */
	const PAIN_DAYS = 30;
	const CHART_W = 320;
	const CHART_H = 120;
	/** Daily average pain for the last 30 days, oldest first; null where nothing was logged. */
	const painDays = $derived(
		Array.from({ length: PAIN_DAYS }, (_, i) => {
			const key = addDays(today, i - PAIN_DAYS + 1);
			const scores = painLog.filter((p) => p.date === key).map((p) => p.score);
			return { key, avg: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null };
		})
	);
	const painPoints = $derived(
		painDays.flatMap((d, i) =>
			d.avg === null ? [] : [{ key: d.key, avg: d.avg, x: (i / (PAIN_DAYS - 1)) * CHART_W, y: CHART_H - (d.avg / 10) * CHART_H }]
		)
	);
	const painPath = $derived(painPoints.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
	const loggedToday = $derived(painLog.filter((p) => p.date === today && p.routineId === null).at(-1)?.score ?? null);

	function logPainNow(score: number): void {
		if (loggedToday !== null && painLog.at(-1)?.date === today && painLog.at(-1)?.routineId === null) undoLastPain();
		logPain(score, null);
	}

	function dayOfWeek(key: string): number {
		const [y, m, d] = key.split('-').map(Number);
		return (new Date(y, m - 1, d).getDay() + 6) % 7; // Monday = 0
	}

	/** Six full weeks ending with the current one, Monday first. */
	const calendar = $derived.by(() => {
		const done = new Set(streak.completedDates);
		const missed = new Set(gap);
		const start = addDays(today, -dayOfWeek(today) - (WEEKS - 1) * 7);
		return Array.from({ length: WEEKS * 7 }, (_, i) => {
			const key = addDays(start, i);
			return {
				key,
				day: Number(key.slice(8)),
				done: done.has(key),
				missed: missed.has(key),
				isToday: key === today,
				future: key > today
			};
		});
	});

	function formatDay(key: string): string {
		const [y, m, d] = key.split('-').map(Number);
		return new Date(y, m - 1, d).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
	}

	function repairStreak(): void {
		if (!canRepair) return;
		const days = gap.length === 1 ? formatDay(gap[0]) : `${gap.length} missed days`;
		if (confirm(`Use ${gap.length} fixer${gap.length === 1 ? '' : 's'} to fill in ${days} and restore your streak?`)) {
			applyFixer();
		}
	}
</script>

<svelte:head>
	<title>Streak · Stretch Timer</title>
</svelte:head>

<h1 class="page-title">Streak</h1>

<section class="card hero" class:cold={now === 0}>
	<div class="hero-flame" aria-hidden="true">🔥</div>
	<div role="img" aria-label={`${now} day streak`}>
		<div class="hero-num" aria-hidden="true">{now}</div>
		<div class="hero-label" aria-hidden="true">day streak</div>
	</div>
	<p class="hero-sub">
		{#if doneToday}
			<span class="ok">✓ Done today</span> — see you tomorrow
		{:else if now > 0}
			Stretch today to keep it going
		{:else if gap.length > 0}
			One missed day doesn’t undo a habit — repair it below, or just pick it up today
		{:else}
			Finish any routine to start a streak
		{/if}
	</p>
	<div class="hero-stats">
		<div role="img" aria-label={`Best streak: ${best}`}><strong aria-hidden="true">{best}</strong><span aria-hidden="true">best streak</span></div>
		<div role="img" aria-label={`Days stretched in the last 30: ${practised}`}><strong aria-hidden="true">{practised}/30</strong><span aria-hidden="true">last 30 days</span></div>
		<div role="img" aria-label={`Days stretched: ${totalDays}`}><strong aria-hidden="true">{totalDays}</strong><span aria-hidden="true">days stretched</span></div>
	</div>
</section>

<section class="card fixer-card">
	<div class="fixer-head">
		<span class="fixer-icon" aria-hidden="true">🩹</span>
		<div class="fixer-text">
			<strong>{fixers} streak fixer{fixers === 1 ? '' : 's'}</strong>
			<span class="muted small">Earn one every 7 days you stretch · {7 - toNext} day{7 - toNext === 1 ? '' : 's'} to the next</span>
		</div>
	</div>
	<div class="fixer-track" role="progressbar" aria-label="Progress to next fixer" aria-valuemin={0} aria-valuemax={7} aria-valuenow={toNext}>
		{#each Array(7) as _, i (i)}
			<span class:filled={i < toNext}></span>
		{/each}
	</div>
	{#if gap.length > 0}
		<div class="repair">
			<p class="small">
				{gap.length === 1 ? `You missed ${formatDay(gap[0])}.` : `You missed ${gap.length} days.`}
				{canRepair
					? `Use ${gap.length} fixer${gap.length === 1 ? '' : 's'} to fill the gap.`
					: `You need ${gap.length} fixer${gap.length === 1 ? '' : 's'} to fill the gap.`}
			</p>
			<button class="btn primary small" onclick={repairStreak} disabled={!canRepair}>Repair streak</button>
		</div>
	{/if}
</section>

<section class="card">
	<h2 class="cal-title">Last {WEEKS} weeks</h2>
	<div class="calendar" role="list" aria-label="Days you stretched">
		{#each weekdays as w, i (i)}
			<span class="cal-head" aria-hidden="true" role="presentation">{w}</span>
		{/each}
		{#each calendar as d (d.key)}
			<span
				class="cal-day"
				class:done={d.done}
				class:missed={d.missed}
				class:today={d.isToday}
				class:future={d.future}
				title={formatDay(d.key)}
				aria-label={`${formatDay(d.key)}${d.done ? ', stretched' : d.missed ? ', missed' : ''}`}
				role="listitem"
			>
				{d.day}
			</span>
		{/each}
	</div>
	<div class="legend muted small">
		<span><i class="sw done"></i>Stretched</span>
		{#if gap.length > 0}<span><i class="sw missed"></i>Missed</span>{/if}
		<span><i class="sw today"></i>Today</span>
	</div>
</section>

<section class="card">
	<h2 class="cal-title">Pain, last {PAIN_DAYS} days</h2>
	{#if painPoints.length === 0}
		<p class="muted small" style="margin: 0 0 0.6rem">
			Rate your pain after a routine (or below) and the trend shows up here.
		</p>
	{:else}
		<svg class="pain-chart" viewBox="-24 -8 {CHART_W + 32} {CHART_H + 28}" role="img" aria-label="Daily average pain, 0 to 10">
			{#each [0, 5, 10] as v (v)}
				{@const y = CHART_H - (v / 10) * CHART_H}
				<line class="grid" x1="0" x2={CHART_W} y1={y} y2={y} />
				<text class="axis" x="-8" y={y + 4} text-anchor="end">{v}</text>
			{/each}
			<text class="axis" x="0" y={CHART_H + 18}>{formatDay(painDays[0].key)}</text>
			<text class="axis" x={CHART_W} y={CHART_H + 18} text-anchor="end">Today</text>
			{#if painPoints.length > 1}<path class="line" d={painPath} />{/if}
			{#each painPoints as p (p.key)}
				<circle class="dot" cx={p.x} cy={p.y} r="3.5"><title>{formatDay(p.key)}: {p.avg.toFixed(1)}</title></circle>
			{/each}
		</svg>
	{/if}
	<div class="pain-now">
		<span class="small">{loggedToday === null ? 'Log pain now' : `Logged ${loggedToday}/10 today — tap to change`}</span>
		<div class="pain-row">
			{#each Array.from({ length: 11 }, (_, i) => i) as n (n)}
				<button class="pain-btn" class:on={loggedToday === n} aria-label="Pain {n} out of 10" onclick={() => logPainNow(n)}>{n}</button>
			{/each}
		</div>
	</div>
	<p class="muted small pain-guide">
		Up to 5/10 during or after a session is usually fine if it’s settled by the next morning.
		<button class="link-btn" onclick={() => (showSigns = true)}>When to get it checked</button>
	</p>
</section>

{#if showSigns}
	<WarningSigns onclose={() => (showSigns = false)} />
{/if}

<style>
	.pain-guide {
		margin: 0.75rem 0 0;
	}
	.link-btn {
		border: 0;
		background: none;
		padding: 0;
		font: inherit;
		color: var(--accent);
		text-decoration: underline;
		cursor: pointer;
	}
	.pain-chart {
		width: 100%;
		max-width: 26rem;
		display: block;
		margin: 0 auto;
	}
	.pain-chart .grid {
		stroke: var(--border);
		stroke-width: 1;
	}
	.pain-chart .axis {
		fill: var(--muted);
		font-size: 10px;
	}
	.pain-chart .line {
		fill: none;
		stroke: var(--accent);
		stroke-width: 2;
		stroke-linejoin: round;
	}
	.pain-chart .dot {
		fill: var(--accent);
	}
	.pain-now {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-top: 0.8rem;
	}
	.pain-row {
		display: grid;
		grid-template-columns: repeat(11, 1fr);
		gap: 0.2rem;
	}
	.pain-btn {
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
	.pain-btn.on {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}
	.page-title {
		font-size: 1.45rem;
		font-weight: 800;
		margin: 0.2rem 0 0.8rem;
	}
	.card + .card {
		margin-top: 0.8rem;
	}

	.hero {
		text-align: center;
		padding: 1.4rem 1rem 1rem;
		background:
			radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%),
			var(--surface);
	}
	.hero-flame {
		font-size: 2.6rem;
		line-height: 1;
	}
	.cold .hero-flame {
		filter: grayscale(1);
		opacity: 0.45;
	}
	.hero-num {
		font-size: 4rem;
		font-weight: 800;
		line-height: 1;
		letter-spacing: -0.04em;
		margin-top: 0.3rem;
		font-variant-numeric: tabular-nums;
	}
	.hero-label {
		font-size: 0.8rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.hero-sub {
		margin: 0.7rem 0 0;
		color: var(--muted);
	}
	.hero-sub .ok {
		color: var(--ok);
		font-weight: 700;
	}
	.hero-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		margin-top: 1rem;
		padding-top: 0.85rem;
		border-top: 1px solid var(--border);
	}
	.hero-stats div {
		display: flex;
		flex-direction: column;
	}
	.hero-stats div + div {
		border-left: 1px solid var(--border);
	}
	.hero-stats strong {
		font-size: 1.4rem;
		font-variant-numeric: tabular-nums;
	}
	.hero-stats span {
		font-size: 0.8rem;
		color: var(--muted);
	}

	.fixer-head {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.fixer-icon {
		font-size: 1.6rem;
		width: 2.6rem;
		height: 2.6rem;
		display: grid;
		place-items: center;
		border-radius: 12px;
		background: var(--surface-2);
		flex-shrink: 0;
	}
	.fixer-text {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.fixer-track {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.3rem;
		margin-top: 0.8rem;
	}
	.fixer-track span {
		height: 6px;
		border-radius: 999px;
		background: var(--surface-2);
	}
	.fixer-track span.filled {
		background: var(--accent);
	}
	.repair {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.8rem;
		margin-top: 0.9rem;
		padding: 0.7rem 0.8rem;
		border-radius: 12px;
		background: color-mix(in srgb, var(--accent) 10%, transparent);
	}
	.repair p {
		margin: 0;
	}
	.repair .btn {
		flex-shrink: 0;
	}

	.cal-title {
		font-size: 1rem;
		margin-bottom: 0.7rem;
	}
	.calendar {
		max-width: 22rem;
		margin: 0 auto;
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.3rem;
	}
	.cal-head {
		text-align: center;
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--muted);
		padding-bottom: 0.15rem;
	}
	.cal-day {
		aspect-ratio: 1;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-size: 0.78rem;
		font-variant-numeric: tabular-nums;
		color: var(--muted);
		background: var(--surface-2);
	}
	.cal-day.done {
		background: var(--accent);
		color: #fff;
		font-weight: 700;
	}
	.cal-day.missed {
		background: transparent;
		box-shadow: inset 0 0 0 1.5px var(--accent);
		color: var(--accent);
	}
	.cal-day.today:not(.done) {
		background: transparent;
		box-shadow: inset 0 0 0 2px var(--text);
		color: var(--text);
		font-weight: 700;
	}
	.cal-day.future {
		background: transparent;
		opacity: 0.35;
	}
	.legend {
		justify-content: center;
		display: flex;
		flex-wrap: wrap;
		gap: 0.9rem;
		margin-top: 0.8rem;
	}
	.legend span {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
	.sw {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		display: inline-block;
	}
	.sw.done {
		background: var(--accent);
	}
	.sw.missed {
		box-shadow: inset 0 0 0 1.5px var(--accent);
	}
	.sw.today {
		box-shadow: inset 0 0 0 1.5px var(--text);
	}
</style>
