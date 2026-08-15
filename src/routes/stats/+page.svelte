<script lang="ts">
	import { applyFixer, clearStreakHistory, streak } from '$lib/stores.svelte';
	import {
		currentStreak,
		fixerProgress,
		fixersAvailable,
		longestStreak,
		repairTarget
	} from '$lib/streak';
	import { addDays, todayKey } from '$lib/time';

	const today = $derived(todayKey());
	const now = $derived(currentStreak(streak));
	const best = $derived(longestStreak(streak));
	const totalDays = $derived(streak.completedDates.length);
	const fixers = $derived(fixersAvailable(streak));
	const toNext = $derived(fixerProgress(streak));
	const repair = $derived(repairTarget(streak));
	const canRepair = $derived(repair !== null && fixers > 0);

	const calendar = $derived(
		Array.from({ length: 42 }, (_, i) => {
			const key = addDays(today, i - 41);
			return { key, done: streak.completedDates.includes(key), isToday: key === today };
		})
	);

	function repairStreak(): void {
		if (!repair) return;
		if (confirm(`Use 1 streak fixer to fill in ${repair} and repair the streak?`)) {
			applyFixer();
		}
	}

	function handleClearStreak(): void {
		if (confirm('Clear all streak history? This will reset your current streak, longest streak, completed days, and fixer balance.')) {
			clearStreakHistory();
		}
	}
</script>

<svelte:head>
	<title>Streak</title>
</svelte:head>

<div class="stats-grid" style="margin-bottom: 0.75rem">
	<div class="stat-card">
		<div class="muted small">Current streak</div>
		<div class="stat-num">🔥 {now}</div>
		<div class="muted small">{streak.completedDates.includes(today) ? 'Completed today ✓' : 'Not yet today'}</div>
	</div>
	<div class="stat-card">
		<div class="muted small">Longest streak</div>
		<div class="stat-num">🏆 {best}</div>
	</div>
	<div class="stat-card">
		<div class="muted small">Days completed</div>
		<div class="stat-num">{totalDays}</div>
		<div class="muted small">{toNext}/7 to next fixer</div>
	</div>
	<div class="stat-card">
		<div class="muted small">Streak fixers</div>
		<div class="stat-num">🩹 {fixers}</div>
	</div>
</div>

<section class="card" style="margin-bottom: 0.75rem">
	<div class="spread">
		<div>
			<h2>Repair a broken streak</h2>
			<p class="muted small" style="margin: 0.2rem 0 0">
				{repair
					? `Missing day: ${repair} — ${canRepair ? 'a fixer can fill it in.' : 'you need a fixer (earn 1 per 7 completed days).'}`
					: 'Your streak is unbroken — nothing to repair right now.'}
			</p>
		</div>
		<button class="btn small" onclick={repairStreak} disabled={!canRepair}>Repair (1 fixer)</button>
	</div>
</section>

<section class="card" style="margin-bottom: 0.75rem">
	<h2>Last 42 days</h2>
	<div class="calendar">
		{#each calendar as d (d.key)}
			<div class="cal-day" class:done={d.done} class:today={d.isToday} title={d.key}>
				{d.done ? '✓' : d.key.slice(8)}
			</div>
		{/each}
	</div>
	<p class="muted small" style="margin: 0.75rem 0 0">
		Finish a routine to credit the day. Missing a day breaks the streak; every 7 completed days earns a fixer
		that repairs the most recent break.
	</p>
</section>

<section class="card">
	<div class="spread">
		<div>
			<h2>Streak management</h2>
			<p class="muted small" style="margin: 0.2rem 0 0">
				Reset all recorded workout days and start fresh.
			</p>
		</div>
		<button class="btn small danger" onclick={handleClearStreak} disabled={totalDays === 0 && streak.fixersUsed === 0}>
			Clear streak history
		</button>
	</div>
</section>
