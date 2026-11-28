<script lang="ts">
	import { tick } from 'svelte';
	import { painLog, routines } from '$lib/stores.svelte';
	import { todayKey, addDays } from '$lib/time';
	import {
		rangeStart,
		filterEntries,
		dailyMax,
		bucketed,
		bucketSize,
		areaTrends,
		spotTotals,
		topTags,
		type JournalRange,
		type AreaFilter
	} from '$lib/painJournal';
	import { PAIN_AREAS, PAIN_TYPES, painSpot, spotLabel, painAreaLabel, entryAreas, tagLabel } from '$lib/painSpots';
	import BodyMap, { painColor } from '$lib/components/BodyMap.svelte';
	import Segmented from '$lib/components/Segmented.svelte';
	import PainEntryEditor from '$lib/components/PainEntryEditor.svelte';
	import type { PainEntry } from '$lib/types';

	let editing = $state<PainEntry | null | undefined>(undefined);
	let range = $state<JournalRange>('30d');
	let areaChoice = $state<AreaFilter>('all');
	let dayFilter = $state<string | null>(null);
	let shown = $state(20);
	let view = $state<'front' | 'back'>('front');
	let heatEl = $state<HTMLDivElement>();

	const rangeOptions = [
		{ value: '30d', label: '30 days' },
		{ value: '3m', label: '3 months' },
		{ value: '1y', label: '1 year' },
		{ value: 'all', label: 'All' }
	];

	const today = $derived(todayKey());
	const from = $derived(rangeStart(range, today, painLog));
	const inRange = $derived(filterEntries(painLog, from, today, 'all'));
	const presentAreas = $derived(PAIN_AREAS.filter((a) => inRange.some((e) => entryAreas(e).includes(a.id))));
	const area = $derived<AreaFilter>(
		areaChoice === 'all' || presentAreas.some((a) => a.id === areaChoice) ? areaChoice : 'all'
	);
	const entries = $derived(filterEntries(painLog, from, today, area));
	const daily = $derived(dailyMax(entries, from, today, area));
	const bucket = $derived(bucketSize(daily.length));
	const points = $derived(bucketed(daily, bucket));
	const hasData = $derived(points.some((p) => p.max !== null));
	const trends = $derived(areaTrends(entries));
	/** Worst score per spot in range; with an area filter, only that area's spots. */
	const marks = $derived(
		Object.fromEntries(
			Object.entries(spotTotals(entries))
				.filter(([k]) => area === 'all' || painSpot(k.split(':')[0])?.area === area)
				.map(([k, v]) => [k, v.max])
		)
	);
	/** Open the body map on whichever side has more marked spots, until the user flips it. */
	let viewTouched = false;
	$effect(() => {
		if (viewTouched) return;
		let front = 0;
		let back = 0;
		for (const k of Object.keys(marks)) {
			if (painSpot(k.split(':')[0])?.map?.view === 'back') back++;
			else front++;
		}
		view = back > front ? 'back' : 'front';
	});
	const causes = $derived(topTags(entries, 'causes', 6));
	const helped = $derived(topTags(entries, 'helped', 6));

	const visible = $derived(
		(dayFilter ? entries.filter((e) => e.date === dayFilter) : entries).slice().sort((a, b) => b.date.localeCompare(a.date) || b.at - a.at)
	);
	const groups = $derived.by(() => {
		const out: { date: string; items: PainEntry[] }[] = [];
		for (const e of visible.slice(0, shown)) {
			const last = out[out.length - 1];
			if (last && last.date === e.date) last.items.push(e);
			else out.push({ date: e.date, items: [e] });
		}
		return out;
	});

	// Heatmap cells: leading blanks so the first day lands on its Mon-first weekday row.
	const cells = $derived.by(() => {
		const lead = (parseKey(from).getDay() + 6) % 7;
		return [...Array.from({ length: lead }, () => null), ...daily];
	});

	function parseKey(key: string): Date {
		const [y, m, d] = key.split('-').map(Number);
		return new Date(y, m - 1, d);
	}
	function dayLabel(key: string): string {
		return parseKey(key).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
	}
	function timeLabel(at: number): string {
		return new Date(at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
	}
	function routineName(id: string | null): string | null {
		return id ? (routines.find((r) => r.id === id)?.name ?? null) : null;
	}
	function spotsText(e: PainEntry): string {
		if (e.spots?.length) return e.spots.map((s) => `${spotLabel(s.spot, s.side)} ${s.score}`).join(' · ');
		return entryAreas(e).map(painAreaLabel).join(' · ');
	}
	function typesText(e: PainEntry): string {
		const ids = new Set(e.spots?.flatMap((s) => s.types ?? []) ?? []);
		return PAIN_TYPES.filter((t) => ids.has(t.id)).map((t) => t.label).join(', ');
	}
	function pickDay(key: string, max: number | null) {
		if (max === null) return;
		dayFilter = dayFilter === key ? null : key;
		shown = 20;
	}

	$effect(() => {
		void range;
		void cells;
		tick().then(() => {
			if (heatEl) heatEl.scrollLeft = heatEl.scrollWidth;
		});
	});

	// Trend chart geometry
	const W = 320;
	const H = 120;
	const PAD_L = 18;
	const PAD_R = 6;
	const PAD_T = 8;
	const PAD_B = 8;
	const xAt = (i: number) =>
		points.length <= 1 ? (PAD_L + W - PAD_R) / 2 : PAD_L + (i * (W - PAD_L - PAD_R)) / (points.length - 1);
	const yAt = (v: number) => PAD_T + (1 - v / 10) * (H - PAD_T - PAD_B);
	const dots = $derived(
		points.flatMap((p, i) => (p.max === null ? [] : [{ x: xAt(i), y: yAt(p.max), max: p.max }]))
	);
	const path = $derived(dots.map((d, i) => `${i ? 'L' : 'M'}${d.x.toFixed(1)} ${d.y.toFixed(1)}`).join(' '));
</script>

<div class="page">
	<header class="spread head">
		<h1>Pain journal</h1>
		<button class="btn primary" type="button" onclick={() => (editing = null)}>+ New entry</button>
	</header>
	<a class="small link" href="/stats">Streak &amp; stats ›</a>

	{#if painLog.length === 0}
		<div class="card empty">
			<p>Log how sore you are, where it hurts, what caused it and what helped. Over time the journal shows patterns and whether things are getting better.</p>
			<button class="btn primary" type="button" onclick={() => (editing = null)}>+ New entry</button>
		</div>
	{:else}
		<Segmented
			bind:value={range as string}
			options={rangeOptions}
			label="Range"
			onchange={() => {
				dayFilter = null;
				shown = 20;
			}}
		/>

		<div class="chips" role="group" aria-label="Area">
			<button type="button" class="chip" class:on={area === 'all'} onclick={() => (areaChoice = 'all')}>All</button>
			{#each presentAreas as a (a.id)}
				<button type="button" class="chip" class:on={area === a.id} onclick={() => (areaChoice = a.id)}>{a.label}</button>
			{/each}
		</div>

		<section class="card">
			<div class="heat" bind:this={heatEl}>
				<div class="grid">
					{#each cells as c, i (i)}
						{#if c}
							<button
								type="button"
								class="cell"
								class:sel={dayFilter === c.key}
								style:background={c.max === null ? 'var(--surface-2)' : painColor(c.max)}
								aria-label={c.max === null ? `${dayLabel(c.key)}: no entry` : `${dayLabel(c.key)}: ${c.max}`}
								onclick={() => pickDay(c.key, c.max)}
							></button>
						{:else}
							<span class="cell blank"></span>
						{/if}
					{/each}
				</div>
			</div>
			{#if dayFilter}
				<button class="pill" type="button" onclick={() => (dayFilter = null)}>Showing {dayLabel(dayFilter)} ✕</button>
			{/if}
		</section>

		{#if hasData}
			<section class="card">
				<h2>Trend{bucket > 1 ? (bucket === 7 ? ' (weekly peak)' : ' (monthly peak)') : ''}</h2>
				<svg viewBox="0 0 {W} {H + 14}" class="chart" role="img" aria-label="Pain over time">
					{#each [0, 5, 10] as g (g)}
						<line x1={PAD_L} x2={W - PAD_R} y1={yAt(g)} y2={yAt(g)} stroke="var(--border)" stroke-width="1" />
						<text x="0" y={yAt(g) + 3} font-size="9" fill="var(--muted)">{g}</text>
					{/each}
					<path d={path} fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" />
					{#each dots as d, i (i)}
						<circle cx={d.x} cy={d.y} r="3" fill={painColor(d.max)} stroke="var(--text)" stroke-width="0.5" />
					{/each}
					<text x={PAD_L} y={H + 10} font-size="9" fill="var(--muted)">{dayLabel(points[0].key)}</text>
					<text x={W - PAD_R} y={H + 10} font-size="9" fill="var(--muted)" text-anchor="end">{dayLabel(points[points.length - 1].key)}</text>
				</svg>
			</section>
		{/if}

		{#if entries.length}
			<section class="card">
				<h2>Where it hurts</h2>
				<BodyMap bind:view={() => view, (v) => ((view = v), (viewTouched = true))} {marks} showToggle />
				<ul class="trends">
					{#each trends as t (t.area)}
						<li class="spread">
							<span>
								<strong>{t.label}</strong>
								<span class="small muted">{t.count} {t.count === 1 ? 'entry' : 'entries'} · avg {t.average.toFixed(1)}</span>
							</span>
							<span class="small trend {t.trend}">
								{t.trend === 'better' ? '↓ better' : t.trend === 'worse' ? '↑ worse' : '→ steady'}
							</span>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#each [{ title: 'Most common causes', rows: causes }, { title: 'What helped', rows: helped }] as block (block.title)}
			{#if block.rows.length}
				<section class="card">
					<h2>{block.title}</h2>
					{#each block.rows as r (r.value)}
						<div class="bar">
							<span class="small bl">{r.label}</span>
							<span class="track"><span class="fill" style:width="{(r.count / block.rows[0].count) * 100}%"></span></span>
							<span class="small muted n">{r.count}</span>
						</div>
					{/each}
				</section>
			{/if}
		{/each}

		<section>
			{#if groups.length === 0}
				<p class="muted small">No entries for this selection.</p>
			{/if}
			{#each groups as g (g.date)}
				<h3 class="day">{dayLabel(g.date)}</h3>
				{#each g.items as e (e.at)}
					{@const after = routineName(e.routineId)}
					<button type="button" class="entry card" onclick={() => (editing = e)}>
						<span class="badge" style:background={painColor(e.score)}>{e.score}</span>
						<span class="body">
							<span class="small muted">{timeLabel(e.at)}{after ? ` · after ${after}` : ''}</span>
							<span class="spots">{spotsText(e)}</span>
							{#if typesText(e)}<span class="small muted">{typesText(e)}</span>{/if}
							{#if e.causes?.length}<span class="small muted">{e.causes.map(tagLabel).join(', ')}</span>{/if}
							{#if e.note}<span class="small note">{e.note}</span>{/if}
						</span>
					</button>
				{/each}
			{/each}
			{#if visible.length > shown}
				<button class="btn ghost" type="button" onclick={() => (shown += 20)}>Show more</button>
			{/if}
		</section>
	{/if}
</div>

{#if editing !== undefined}
	<PainEntryEditor entry={editing} onclose={() => (editing = undefined)} />
{/if}

<style>
	.page { display: flex; flex-direction: column; gap: 0.75rem; min-width: 0; }
	.head h1 { margin: 0; font-size: 1.4rem; }
	.link { color: var(--accent); text-decoration: none; }
	h2 { margin: 0 0 0.5rem; font-size: 1rem; }
	.empty { display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start; }
	.empty p { margin: 0; }
	.chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
	.chip {
		border: 1px solid var(--border); background: var(--surface); color: var(--text);
		border-radius: 999px; padding: 0.25rem 0.7rem; font: inherit; font-size: 0.85rem; cursor: pointer;
	}
	.chip.on { background: var(--accent); border-color: var(--accent); color: #fff; }
	.heat { overflow-x: auto; padding-bottom: 0.25rem; }
	.grid {
		display: grid; grid-auto-flow: column; grid-template-rows: repeat(7, 13px);
		grid-auto-columns: 13px; gap: 3px; width: max-content;
	}
	.cell { width: 13px; height: 13px; border-radius: 3px; border: 0; padding: 0; cursor: pointer; }
	.cell.blank { visibility: hidden; }
	.cell.sel { outline: 2px solid var(--text); outline-offset: 1px; }
	.pill {
		margin-top: 0.5rem; border: 1px solid var(--border); background: var(--surface-2); color: var(--text);
		border-radius: 999px; padding: 0.2rem 0.7rem; font: inherit; font-size: 0.85rem; cursor: pointer;
	}
	.chart { width: 100%; height: auto; display: block; }
	.trends { list-style: none; margin: 0.75rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }
	.trends li { gap: 0.5rem; }
	.trends li > span:first-child { display: flex; flex-direction: column; min-width: 0; }
	.trend.better { color: var(--ok); }
	.trend.worse { color: var(--danger); }
	.trend.steady { color: var(--muted); }
	.bar { display: grid; grid-template-columns: 38% 1fr 1.5rem; gap: 0.5rem; align-items: center; margin: 0.3rem 0; }
	.bl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.track { height: 8px; background: var(--surface-2); border-radius: 4px; overflow: hidden; }
	.fill { display: block; height: 100%; background: var(--accent); border-radius: 4px; }
	.n { text-align: right; }
	.day { margin: 0.5rem 0 0.35rem; font-size: 0.9rem; color: var(--muted); }
	.entry {
		display: flex; gap: 0.75rem; width: 100%; text-align: left; font: inherit; color: var(--text);
		cursor: pointer; margin-bottom: 0.5rem; align-items: flex-start;
	}
	.badge {
		flex: none; width: 2rem; height: 2rem; border-radius: 8px; display: grid; place-items: center;
		font-weight: 700; color: #1a1a1a;
	}
	.body { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; flex: 1; }
	.spots { overflow-wrap: anywhere; }
	.note { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
