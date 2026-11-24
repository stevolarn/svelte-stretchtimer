<script lang="ts">
	import { functionChecks, morningChecks, PAIN_AREAS, painLog, routines, streak } from '$lib/stores.svelte';
	import { daysPractised, functionChange, MEANINGFUL_CHANGE, trackedActivities } from '$lib/recovery';
	import { stretchDurationLabel } from '$lib/timeline';
	import { addDays, todayKey } from '$lib/time';

	const WEEKS = 8;
	const today = todayKey();

	function shortDate(key: string): string {
		return new Date(key + 'T00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
	}

	function longDate(key: string): string {
		return new Date(key + 'T00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function signed(n: number, digits = 0): string {
		return `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(digits)}`;
	}

	function mean(values: number[]): number | null {
		return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
	}

	/** Monday of the week containing `key`. */
	function mondayOf(key: string): string {
		const [y, m, d] = key.split('-').map(Number);
		return addDays(key, -((new Date(y, m - 1, d).getDay() + 6) % 7));
	}

	const rangeStart = addDays(mondayOf(today), -(WEEKS - 1) * 7);

	/* -------------------------------- practice -------------------------------- */
	const days28 = $derived(daysPractised(streak.completedDates, 28, today));
	const days56 = $derived(daysPractised(streak.completedDates, 56, today));
	const playsFrom = addDays(today, -27);
	const routineDoses = $derived(
		routines.map((r) => ({
			id: r.id,
			name: r.name || 'Untitled routine',
			plays: (r.completions ?? []).filter((d) => d >= playsFrom && d <= today).length,
			sets: Math.max(1, r.sets ?? 1),
			stretches: r.stretches.map((s) => ({ name: s.name, label: stretchDurationLabel(s), load: s.load?.trim() ?? '' }))
		}))
	);

	/* ------------------------------ pain by week ------------------------------ */
	const painEntries = $derived(painLog.filter((p) => p.date >= rangeStart && p.date <= today));
	const painAreas = $derived(PAIN_AREAS.filter((a) => painEntries.some((p) => p.areas?.includes(a.id))));
	const painWeeks = $derived(
		Array.from({ length: WEEKS }, (_, i) => {
			const start = addDays(rangeStart, i * 7);
			const end = addDays(start, 6);
			const inWeek = painEntries.filter((p) => p.date >= start && p.date <= end);
			const avg = mean(inWeek.map((p) => p.score));
			return {
				start,
				all: avg === null ? '–' : `${avg.toFixed(1)} (${inWeek.length})`,
				areas: painAreas.map((a) => {
					const m = mean(inWeek.filter((p) => p.areas?.includes(a.id)).map((p) => p.score));
					return m === null ? '–' : m.toFixed(1);
				})
			};
		})
	);

	/* --------------------------- everyday tasks (PSFS) --------------------------- */
	const fnChange = $derived(functionChange(functionChecks));
	const fnFlagDates = $derived(functionChecks.filter((c) => c.flag).map((c) => shortDate(c.date)));
	const activities = $derived.by(() => {
		const found = new Map<string, { name: string; scores: { date: string; score: number }[] }>();
		for (const check of functionChecks) {
			for (const item of check.items) {
				const key = item.activity.trim().toLowerCase();
				const entry = found.get(key) ?? { name: item.activity.trim(), scores: [] };
				entry.name = item.activity.trim();
				entry.scores.push({ date: check.date, score: item.score });
				found.set(key, entry);
			}
		}
		return [...found.values()].map((e) => {
			const first = e.scores[0];
			const latest = e.scores[e.scores.length - 1];
			return { name: e.name, first, latest, change: e.scores.length > 1 ? latest.score - first.score : null };
		});
	});

	/* ------------------------------- morning after ------------------------------- */
	const morningFrom = addDays(today, -27);
	const mornings = $derived(morningChecks.filter((c) => c.date >= morningFrom && c.date <= today));
	const morningCounts = $derived({
		better: mornings.filter((c) => c.verdict === 'better').length,
		same: mornings.filter((c) => c.verdict === 'same').length,
		worse: mornings.filter((c) => c.verdict === 'worse').length
	});

	/* ------------------------------- dose changes ------------------------------- */
	const KIND_LABEL = { progress: 'Progressed', set: 'Extra set', ease: 'Eased' } as const;
	const doseChanges = $derived(
		routines
			.flatMap((r) => (r.history ?? []).map((h, i) => ({ ...h, routine: r.name || 'Untitled routine', order: i })))
			.filter((h) => h.date >= rangeStart)
			.sort((a, b) => (a.date === b.date ? b.order - a.order : a.date < b.date ? 1 : -1))
	);
</script>

<svelte:head>
	<title>Summary · Stretch Timer</title>
</svelte:head>

<div class="report">
	<header class="report-head">
		<div class="actions no-print">
			<a class="btn ghost small" href="/stats">‹ Stats</a>
			<button type="button" class="btn primary small" onclick={() => window.print()}>Print / Save PDF</button>
		</div>
		<h1>Stretch Timer summary</h1>
		<p class="muted small meta">
			{longDate(rangeStart)} to {longDate(today)} (last {WEEKS} weeks) · generated {longDate(today)}
		</p>
	</header>

	<section class="card report-section">
		<h2>Practice</h2>
		<p class="lead">
			Days stretched: <strong>{days28}</strong> of the last 28, <strong>{days56}</strong> of the last 56.{#if streak.fixersUsed > 0}
				Includes up to {streak.fixersUsed} {streak.fixersUsed === 1 ? 'missed day' : 'missed days'} filled in with reserve days.{/if}
		</p>
		{#if routineDoses.length === 0}
			<p class="muted small">No data yet.</p>
		{:else}
			<ul class="routine-list">
				{#each routineDoses as r (r.id)}
					<li>
						<div class="routine-head">
							<strong>{r.name}</strong>
							<span class="muted small">{r.plays} play{r.plays === 1 ? '' : 's'} in the last 4 weeks · {r.sets} set{r.sets === 1 ? '' : 's'}</span>
						</div>
						{#if r.stretches.length === 0}
							<p class="muted small stretch-none">No stretches yet.</p>
						{:else}
							<ul class="stretch-list">
								{#each r.stretches as s, i (i)}
									<li>{s.name}: {s.label}{s.load ? ` · ${s.load}` : ''}</li>
								{/each}
							</ul>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="card report-section">
		<h2>Pain by week</h2>
		{#if painEntries.length === 0}
			<p class="muted small">No data yet.</p>
		{:else}
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th scope="col">Week</th>
							<th scope="col" class="num">All (scores)</th>
							{#each painAreas as a (a.id)}
								<th scope="col" class="num">{a.label}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each painWeeks as w (w.start)}
							<tr>
								<th scope="row" class="nowrap">w/c {shortDate(w.start)}</th>
								<td class="num nowrap">{w.all}</td>
								{#each w.areas as cell, i (i)}
									<td class="num">{cell}</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<p class="muted small note">Average of the 0 to 10 scores logged that week. The number in brackets is how many scores.</p>
		{/if}
	</section>

	<section class="card report-section">
		<h2>Everyday tasks</h2>
		{#if functionChecks.length === 0}
			<p class="muted small">No data yet.</p>
		{:else}
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th scope="col">Activity</th>
							<th scope="col" class="num">First</th>
							<th scope="col" class="num">Latest</th>
							<th scope="col" class="num">Change</th>
						</tr>
					</thead>
					<tbody>
						{#each activities as a, i (i)}
							<tr>
								<th scope="row" class="wrap">{a.name}</th>
								<td class="num">{a.first.score}<span class="when">{shortDate(a.first.date)}</span></td>
								<td class="num">{a.latest.score}<span class="when">{shortDate(a.latest.date)}</span></td>
								<td class="num">{a.change === null ? '–' : signed(a.change)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if fnChange}
				<p class="lead">
					Average over {trackedActivities(functionChecks) ? 'the activities rated at both check-ins' : 'all activities rated (the first and latest check-ins share none)'}: first {fnChange.baseline.toFixed(1)}, latest {fnChange.latest.toFixed(1)},
					change {signed(fnChange.change, 1)}{#if fnChange.change >= MEANINGFUL_CHANGE}, a meaningful improvement{:else if fnChange.change <= -MEANINGFUL_CHANGE}, a meaningful decline{:else}, not yet a meaningful change{/if}.
				</p>
			{:else}
				<p class="muted small note">One check-in so far ({shortDate(functionChecks[0].date)}), so there is nothing to compare yet.</p>
			{/if}
			{#if fnFlagDates.length > 0}
				<p class="lead">New numbness, weakness or clumsiness was reported at the check-in{fnFlagDates.length === 1 ? '' : 's'} on {fnFlagDates.join(', ')}.</p>
			{/if}
		{/if}
	</section>

	<section class="card report-section">
		<h2>Morning after</h2>
		{#if mornings.length === 0}
			<p class="muted small">No data yet.</p>
		{:else}
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th scope="col" class="num">Better</th>
							<th scope="col" class="num">The same</th>
							<th scope="col" class="num">Worse</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td class="num">{morningCounts.better}</td>
							<td class="num">{morningCounts.same}</td>
							<td class="num">{morningCounts.worse}</td>
						</tr>
					</tbody>
				</table>
			</div>
			<p class="muted small note">How the morning after a session compared with before it, over the last 4 weeks.</p>
		{/if}
	</section>

	<section class="card report-section">
		<h2>Dose changes</h2>
		{#if doseChanges.length === 0}
			<p class="muted small">No data yet.</p>
		{:else}
			<ul class="changes">
				{#each doseChanges as c, i (i)}
					<li>
						<span class="nowrap"><strong>{shortDate(c.date)}</strong> · {KIND_LABEL[c.kind]}</span>
						<span class="change-text">{c.routine}: {c.note}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<p class="muted small footer">
		Pain: 0 = none, 10 = worst. Everyday tasks use the Patient-Specific Functional Scale: 0 = can’t do it, 10 = as well as before. A change of about
		2 points is the smallest that usually matters on either.
	</p>
</div>

<style>
	.report {
		display: grid;
		gap: 0.8rem;
		min-width: 0;
	}
	.report-head h1 {
		font-size: 1.45rem;
		font-weight: 800;
		margin: 0.6rem 0 0.2rem;
	}
	.actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
	}
	.meta {
		margin: 0;
	}
	.report-section {
		min-width: 0;
		break-inside: avoid;
	}
	.report-section + .report-section {
		margin-top: 0;
	}
	.report-section h2 {
		font-size: 1.05rem;
		margin-bottom: 0.6rem;
	}
	p {
		margin: 0;
	}
	.lead {
		margin-top: 0.6rem;
	}
	h2 + .lead {
		margin-top: 0;
	}
	.note {
		margin-top: 0.5rem;
	}

	.routine-list,
	.stretch-list,
	.changes {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.routine-list {
		display: grid;
		gap: 0.7rem;
		margin-top: 0.7rem;
	}
	.routine-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		column-gap: 0.7rem;
	}
	.stretch-list {
		margin-top: 0.2rem;
		padding-left: 0.9rem;
		font-size: 0.9rem;
	}
	.stretch-list li {
		overflow-wrap: anywhere;
	}
	.stretch-list li::before {
		content: '– ';
		margin-left: -0.9rem;
		display: inline-block;
		width: 0.9rem;
		color: var(--muted);
	}
	.stretch-none {
		margin-top: 0.2rem;
	}

	.table-wrap {
		overflow-x: auto;
		max-width: 100%;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
	}
	th,
	td {
		padding: 0.35rem 0.5rem;
		text-align: left;
		font-weight: 400;
		border-bottom: 1px solid var(--border);
		vertical-align: top;
	}
	thead th {
		font-weight: 700;
		font-size: 0.8rem;
		color: var(--muted);
		border-bottom-width: 2px;
	}
	tbody th {
		font-weight: 600;
	}
	.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.nowrap {
		white-space: nowrap;
	}
	.wrap {
		overflow-wrap: anywhere;
	}
	.when {
		display: block;
		font-size: 0.72rem;
		color: var(--muted);
	}

	.changes {
		display: grid;
		gap: 0.5rem;
		font-size: 0.9rem;
	}
	.changes li {
		display: flex;
		flex-wrap: wrap;
		column-gap: 0.7rem;
	}
	.change-text {
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.footer {
		margin: 0.2rem 0 0;
		break-inside: avoid;
	}

	@media print {
		:global(html),
		:global(body) {
			background: #fff;
			color: #000;
		}
		:global(.app-header),
		:global(.mobile-tab-bar),
		.no-print,
		.report button,
		.report .btn {
			display: none;
		}
		:global(.app) {
			max-width: none;
			padding: 0;
		}
		.report {
			--text: #000;
			--muted: #333;
			--border: #888;
			--surface: #fff;
			--surface-2: #fff;
			color: #000;
			background: #fff;
			gap: 0.9rem;
		}
		.report-section {
			border: 0;
			border-radius: 0;
			box-shadow: none;
			background: #fff;
			padding: 0;
			break-inside: avoid;
		}
		.report-head h1 {
			margin-top: 0;
		}
		.table-wrap {
			overflow: visible;
		}
		table {
			border: 1px solid #888;
		}
		th,
		td {
			border: 1px solid #888;
			color: #000;
		}
		thead th {
			background: #eee;
			color: #000;
		}
		.when {
			color: #333;
		}
	}
</style>
