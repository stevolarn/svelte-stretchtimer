<script lang="ts">
	import {
		applyFixer,
		functionChecks,
		PAIN_AREAS,
		painLog,
		sessions,
		settings,
		streak
	} from '$lib/stores.svelte';
	import { currentStreak, fixerProgress, fixersAvailable, longestStreak, repairGap } from '$lib/streak';
	import { HABIT_DAYS, practiceDays } from '$lib/habits';
	import { addDays, todayKey } from '$lib/time';
	import { formatDuration, sessionTotals, sessionWhen } from '$lib/sessions';
	import { checkScore, daysPractised, functionChange, MEANINGFUL_CHANGE, trackedActivities } from '$lib/recovery';
	import type { PainArea } from '$lib/types';
	import PainNow from '$lib/components/PainNow.svelte';
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
	const totals = $derived(sessionTotals(sessions));
	const recent = $derived(sessions.slice(-10).reverse());
	const doneToday = $derived(streak.completedDates.includes(today));
	const habitDays = $derived(practiceDays(streak));
	const habitPct = $derived(Math.min(100, Math.round((habitDays / HABIT_DAYS) * 100)));
	const fixers = $derived(fixersAvailable(streak));
	const toNext = $derived(fixerProgress(streak));
	const gap = $derived(repairGap(streak));
	const canRepair = $derived(gap.length > 0 && fixers >= gap.length);

	/* ------------------------------ pain trend ------------------------------ */
	const PAIN_DAYS = 30;
	const CHART_W = 320;
	const CHART_H = 120;
	const windowStart = $derived(addDays(today, -(PAIN_DAYS - 1)));
	const windowEntries = $derived(painLog.filter((p) => p.date >= windowStart && p.date <= today));
	/** Only the areas that actually appear in the chart window, in the usual order. */
	const areasInWindow = $derived(PAIN_AREAS.filter((a) => windowEntries.some((p) => p.areas?.includes(a.id))));
	let areaFilter = $state<PainArea | 'all'>('all');
	/** Falls back to "All" if the chosen area has dropped out of the window. */
	const activeArea = $derived<PainArea | 'all'>(areasInWindow.some((a) => a.id === areaFilter) ? areaFilter : 'all');
	const shownEntries = $derived.by(() => {
		const area = activeArea;
		return area === 'all' ? windowEntries : windowEntries.filter((p) => p.areas?.includes(area));
	});
	/** Daily average pain for the last 30 days, oldest first; null where nothing was logged. */
	const painDays = $derived(
		Array.from({ length: PAIN_DAYS }, (_, i) => {
			const key = addDays(today, i - PAIN_DAYS + 1);
			const scores = shownEntries.filter((p) => p.date === key).map((p) => p.score);
			return { key, avg: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null };
		})
	);
	const painPoints = $derived(
		painDays.flatMap((d, i) =>
			d.avg === null ? [] : [{ key: d.key, avg: d.avg, x: (i / (PAIN_DAYS - 1)) * CHART_W, y: CHART_H - (d.avg / 10) * CHART_H }]
		)
	);
	const painPath = $derived(painPoints.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
	/* --------------------------- everyday tasks (PSFS) --------------------------- */
	const FN_H = 100;
	const fnChange = $derived(functionChange(functionChecks));
	const fnFlagDates = $derived(functionChecks.filter((c) => c.flag).map((c) => shortDate(c.date)));
	const fnPoints = $derived.by(() => {
		// same activities as the headline change, so the line and the numbers agree
		const tracked = trackedActivities(functionChecks);
		const avgs = functionChecks.flatMap((c) => {
			const avg = checkScore(c, tracked);
			return avg === null ? [] : [{ key: c.date, avg }];
		});
		return avgs.map((p, i) => ({ ...p, x: avgs.length > 1 ? (i / (avgs.length - 1)) * CHART_W : CHART_W / 2, y: FN_H - (p.avg / 10) * FN_H }));
	});
	const fnPath = $derived(fnPoints.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));

	function shortDate(key: string): string {
		return new Date(key + 'T00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
	}

	function signed(n: number): string {
		return `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(1)}`;
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
		if (confirm(`Use ${gap.length} reserve day${gap.length === 1 ? '' : 's'} to fill in ${days} and restore your streak?`)) {
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
			<strong>{fixers} reserve day{fixers === 1 ? '' : 's'}</strong>
			<span class="muted small">Earn one for every 7 days you stretch · {7 - toNext} day{7 - toNext === 1 ? '' : 's'} to the next</span>
		</div>
	</div>
	<div class="fixer-track" role="progressbar" aria-label="Progress to next reserve day" aria-valuemin={0} aria-valuemax={7} aria-valuenow={toNext}>
		{#each Array(7) as _, i (i)}
			<span class:filled={i < toNext}></span>
		{/each}
	</div>
	{#if gap.length > 0}
		<div class="repair">
			<p class="small">
				{gap.length === 1 ? `You missed ${formatDay(gap[0])}.` : `You missed ${gap.length} days.`}
				{canRepair
					? `Use ${gap.length} reserve day${gap.length === 1 ? '' : 's'} to fill the gap.`
					: `You need ${gap.length} reserve day${gap.length === 1 ? '' : 's'} to fill the gap.`}
			</p>
			<button class="btn primary small" onclick={repairStreak} disabled={!canRepair}>Repair streak</button>
		</div>
	{/if}
</section>

{#if habitDays > 0}
	<section class="card habit-card">
		<div class="habit-head">
			<h2 class="habit-title">Habit building</h2>
			<strong class="habit-count">{habitDays} practice day{habitDays === 1 ? '' : 's'}</strong>
		</div>
		<div
			class="habit-track"
			role="progressbar"
			aria-label="Practice days toward a habit"
			aria-valuemin={0}
			aria-valuemax={HABIT_DAYS}
			aria-valuenow={Math.min(habitDays, HABIT_DAYS)}
		>
			<span style:width="{habitPct}%"></span>
		</div>
		<p class="muted small habit-note">
			{#if habitDays < HABIT_DAYS}
				Most people find a new habit feels automatic after about two months of regular practice (anywhere from three weeks to eight months). Missed days don’t reset this count.
			{:else}
				About the point most habits start to feel automatic. Keep going; it’s yours now.
			{/if}
		</p>
	</section>
{/if}

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
	<h2 class="cal-title">Time stretched</h2>
	{#if sessions.length === 0}
		<p class="muted small">Session history starts from this update.</p>
	{:else}
		<p class="small">This week <strong>{formatDuration(totals.week)}</strong> · This month <strong>{formatDuration(totals.month)}</strong> · All time <strong>{formatDuration(totals.all)}</strong></p>
	{/if}
</section>

{#if sessions.length > 0}
	<section class="card">
		<h2 class="cal-title">Recent sessions</h2>
		<ul class="session-list">
			{#each recent as s (s.at)}
				<li>
					<strong>{s.name}</strong>
					{#if s.gentle}<span class="session-tag">gentle</span>{/if}
					{#if s.partial}<span class="session-tag">ended early</span>{/if}
					<span class="muted small">{sessionWhen(s.at)} · {formatDuration(s.seconds)}</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}

{#if settings.painTracking}
	<section class="card">
		<h2 class="cal-title">Pain, last {PAIN_DAYS} days</h2>
		{#if areasInWindow.length > 0}
			<div class="area-filter" role="group" aria-label="Show pain for">
				<button type="button" class="filter-chip" class:on={activeArea === 'all'} aria-pressed={activeArea === 'all'} onclick={() => (areaFilter = 'all')}>All</button>
				{#each areasInWindow as area (area.id)}
					<button type="button" class="filter-chip" class:on={activeArea === area.id} aria-pressed={activeArea === area.id} onclick={() => (areaFilter = area.id)}>{area.label}</button>
				{/each}
			</div>
		{/if}
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
		<div class="pain-now-wrap"><PainNow /></div>
		<p class="muted small pain-guide">
			Up to 5/10 during or after a session is usually fine if it’s settled by the next morning.
			<button class="link-btn" onclick={() => (showSigns = true)}>When to get it checked</button>
		</p>
	</section>
{/if}

{#if settings.functionChecks && functionChecks.length > 0}
	<section class="card">
		<h2 class="cal-title">Everyday tasks</h2>
		{#if functionChecks.length === 1}
			{@const first = functionChecks[0]}
			<p class="small fn-lead">First check-in on {shortDate(first.date)}. The next one is due two weeks later.</p>
			<ul class="fn-list">
				{#each first.items as item, i (i)}
					<li><span>{item.activity}</span><strong>{item.score}/10</strong></li>
				{/each}
			</ul>
		{:else if fnChange}
			<p class="fn-lead">
				First <strong>{fnChange.baseline.toFixed(1)}</strong> → latest <strong>{fnChange.latest.toFixed(1)}</strong>
				<span class="fn-change" class:up={fnChange.change > 0} class:down={fnChange.change < 0}>({signed(fnChange.change)})</span>
			</p>
			{#if fnChange.change >= MEANINGFUL_CHANGE}
				<p class="small fn-verdict up">That’s a real improvement.</p>
			{:else if fnChange.change <= -MEANINGFUL_CHANGE}
				<p class="small fn-verdict down">That’s a real drop. Worth mentioning to a physio or GP.</p>
			{/if}
		{/if}
		{#if fnPoints.length > 1}
			<svg class="fn-chart" viewBox="-24 -8 {CHART_W + 32} {FN_H + 28}" role="img" aria-label="Average everyday task score at each check-in, 0 to 10, higher is better">
				{#each [0, 5, 10] as v (v)}
					{@const y = FN_H - (v / 10) * FN_H}
					<line class="grid" x1="0" x2={CHART_W} y1={y} y2={y} />
					<text class="axis" x="-8" y={y + 4} text-anchor="end">{v}</text>
				{/each}
				<text class="axis" x="0" y={FN_H + 18}>{shortDate(fnPoints[0].key)}</text>
				<text class="axis" x={CHART_W} y={FN_H + 18} text-anchor="end">{shortDate(fnPoints[fnPoints.length - 1].key)}</text>
				<path class="line" d={fnPath} />
				{#each fnPoints as p (p.key)}
					<circle class="dot" cx={p.x} cy={p.y} r="3.5"><title>{shortDate(p.key)}: {p.avg.toFixed(1)}</title></circle>
				{/each}
			</svg>
			<p class="muted small fn-note">Average score at each check-in. Higher is better: 10 means as well as before.</p>
		{/if}
		{#if fnFlagDates.length > 0}
			<p class="small fn-flag">
				You reported new numbness, weakness or clumsiness on {fnFlagDates.join(', ')}.
				<button class="link-btn" onclick={() => (showSigns = true)}>When to get it checked</button>
			</p>
		{/if}
	</section>
{/if}

<div class="report-link">
	<a class="btn" href="/report">Summary for your clinician</a>
</div>

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
	.pain-chart,
	.fn-chart {
		width: 100%;
		max-width: 26rem;
		display: block;
		margin: 0 auto;
	}
	.pain-chart .grid,
	.fn-chart .grid {
		stroke: var(--border);
		stroke-width: 1;
	}
	.pain-chart .axis,
	.fn-chart .axis {
		fill: var(--muted);
		font-size: 10px;
	}
	.pain-chart .line,
	.fn-chart .line {
		fill: none;
		stroke: var(--accent);
		stroke-width: 2;
		stroke-linejoin: round;
	}
	.pain-chart .dot {
		fill: var(--accent);
	}
	/* higher is better here, so green rather than the pain chart's red */
	.fn-chart .line {
		stroke: var(--ok);
	}
	.fn-chart .dot {
		fill: var(--ok);
	}
	.area-filter {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-bottom: 0.7rem;
	}
	.filter-chip {
		min-height: 2rem;
		padding: 0.2rem 0.65rem;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
	}
	.filter-chip.on {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}
	.fn-lead {
		margin: 0 0 0.4rem;
	}
	.fn-lead strong {
		font-variant-numeric: tabular-nums;
	}
	.fn-change {
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.fn-change.up,
	.fn-verdict.up {
		color: var(--ok);
		font-weight: 700;
	}
	.fn-change.down,
	.fn-verdict.down {
		color: var(--danger);
		font-weight: 700;
	}
	.fn-verdict {
		margin: 0 0 0.6rem;
	}
	.fn-list {
		list-style: none;
		margin: 0.2rem 0 0;
		padding: 0;
		display: grid;
		gap: 0.3rem;
	}
	.fn-list li {
		display: flex;
		justify-content: space-between;
		gap: 0.8rem;
		padding: 0.4rem 0.6rem;
		border-radius: 10px;
		background: var(--surface-2);
		font-size: 0.9rem;
	}
	.fn-list li span {
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.fn-list strong {
		flex-shrink: 0;
		font-variant-numeric: tabular-nums;
	}
	.fn-chart {
		margin-top: 0.4rem;
	}
	.fn-note {
		margin: 0.4rem 0 0;
	}
	.fn-flag {
		margin: 0.8rem 0 0;
		padding: 0.6rem 0.75rem;
		border-radius: 12px;
		background: color-mix(in srgb, var(--danger) 10%, transparent);
	}
	.report-link {
		display: flex;
		justify-content: center;
		margin-top: 1rem;
	}
	.pain-now-wrap {
		margin-top: 0.8rem;
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
	.habit-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.habit-title {
		font-size: 1rem;
		margin: 0;
	}
	.habit-count {
		font-variant-numeric: tabular-nums;
	}
	.habit-track {
		height: 8px;
		margin-top: 0.7rem;
		border-radius: 999px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.habit-track span {
		display: block;
		height: 100%;
		border-radius: 999px;
		background: var(--accent);
	}
	.habit-note {
		margin: 0.7rem 0 0;
		line-height: 1.45;
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

	.session-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.6rem;
	}
	.session-list li {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.2rem 0.5rem;
	}
	.session-tag {
		font-size: 0.7rem;
		padding: 0.05rem 0.45rem;
		border-radius: 999px;
		background: var(--surface-2, rgba(128, 128, 128, 0.18));
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
