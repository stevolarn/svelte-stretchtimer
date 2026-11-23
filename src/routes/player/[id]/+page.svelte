<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		back,
		instantComplete,
		jumpToCountdown,
		player,
		restart,
		setPlaybackSpeed,
		skip,
		startPlayer,
		stopPlayer,
		togglePause
	} from '$lib/player.svelte';
	import {
		gentleVersion,
		getRoutine,
		logPain,
		MICRO_BREAK_ID,
		microBreak,
		settings,
		shuffleMicroBreak,
		streak,
		undoLastPain
	} from '$lib/stores.svelte';
	import { buildTimeline, durationText, stretchDurationLabel, timelineTotal } from '$lib/timeline';
	import { formatSeconds } from '$lib/time';
	import { currentStreak } from '$lib/streak';
	import { painZone, zoneAdvice } from '$lib/recovery';
	import { getPhotoData } from '$lib/storage';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import StretchIllustration from '$lib/components/StretchIllustration.svelte';
	import PhotoThumb from '$lib/components/PhotoThumb.svelte';
	import Modal from '$lib/components/Modal.svelte';

	const isMicro = $derived(page.params.id === MICRO_BREAK_ID);
	// Opened directly (reload or shortcut): shuffle one up rather than showing a missing routine.
	if (page.params.id === MICRO_BREAK_ID && !microBreak.routine) shuffleMicroBreak();
	const saved = $derived(getRoutine(page.params.id ?? ''));
	/** Bad-day mode: the same routine (same id, so it still counts) minus loading and extra sets. */
	let gentle = $state(false);
	$effect(() => {
		void page.params.id; // a different routine starts in its normal version, unless Up next asked for gentle
		gentle = page.url.searchParams.get('gentle') === '1';
	});
	const routine = $derived(saved && gentle ? gentleVersion(saved) : saved);
	const total = $derived(routine ? timelineTotal(buildTimeline(routine, settings)) : 0);
	const fullTotal = $derived(saved ? timelineTotal(buildTimeline(saved, settings)) : 0);

	/** Pain check-in on the finish screen: the score logged this time, if any. */
	let painScore = $state<number | null>(null);
	function checkIn(score: number): void {
		if (painScore !== null) undoLastPain();
		logPain(score, player.routineId, gentle);
		painScore = score;
	}
	function undoCheckIn(): void {
		undoLastPain();
		painScore = null;
	}

	const segment = $derived(player.segments[player.index] ?? null);
	const nextSegment = $derived(player.segments[player.index + 1] ?? null);
	const fraction = $derived(segment && segment.seconds > 0 ? player.remaining / segment.seconds : 0);
	const streakNow = $derived(currentStreak(streak));
	/** A stretch "starts" on its first side; the right side continues the same stretch. */
	const isStart = (s: (typeof player.segments)[number]) => s.kind === 'stretch' && s.side !== 'right';
	/** Stretches per set, so the count matches the routine rather than growing with each repeat. */
	const stretchCount = $derived(player.segments.filter((s) => isStart(s) && (s.set ?? 1) === 1).length);
	const totalSets = $derived(player.segments[0]?.totalSets ?? 1);
	/** Set the current position belongs to (a rest belongs to what follows it). */
	const currentSet = $derived((segment?.kind === 'break' ? nextSegment?.set : segment?.set) ?? segment?.set ?? 1);
	/** 1-based stretch position within the current set. */
	const stretchNumber = $derived(
		Math.min(
			stretchCount,
			Math.max(
				1,
				player.segments.slice(0, player.index + 1).filter((s) => isStart(s) && (s.set ?? 1) === currentSet).length +
					(segment?.kind === 'break' && nextSegment && isStart(nextSegment) ? 1 : 0)
			)
		)
	);
	const routineElapsed = $derived(
		player.segments.slice(0, player.index).reduce((sum, item) => sum + item.seconds, 0) + player.elapsed
	);
	const routineProgress = $derived(total > 0 ? Math.min(1, routineElapsed / total) : 0);
	const remainingTotal = $derived(Math.max(0, total - routineElapsed));
	const secondsLeft = $derived(Math.ceil(player.remaining));
	const sideLabel = (side: 'left' | 'right' | null | undefined) => (side === 'left' ? 'Left' : side === 'right' ? 'Right' : '');

	let photoUrl = $state<string | null>(null);
	let showZoomModal = $state(false);

	$effect(() => {
		let cancelled = false;
		photoUrl = null;
		const photoId = segment?.stretch?.photoId ?? null;
		if (photoId) {
			getPhotoData(photoId)
				.then((d) => {
					if (!cancelled && d) photoUrl = d;
				})
				.catch(() => {});
		}
		return () => {
			cancelled = true;
		};
	});

	/* -------------------------- wake lock -------------------------- */
	let wakeLock: WakeLockSentinel | null = null;
	async function requestWake(): Promise<void> {
		try {
			wakeLock = await navigator.wakeLock.request('screen');
		} catch {
			wakeLock = null;
		}
	}
	function releaseWake(): void {
		if (wakeLock) {
			wakeLock.release().catch(() => {});
			wakeLock = null;
		}
	}

	$effect(() => {
		if (player.status === 'running') {
			void requestWake();
			return () => releaseWake();
		}
		releaseWake();
	});

	onMount(() => {
		const onVis = () => {
			if (document.visibilityState === 'visible' && player.status === 'running') void requestWake();
		};
		document.addEventListener('visibilitychange', onVis);
		return () => {
			document.removeEventListener('visibilitychange', onVis);
			stopPlayer();
		};
	});

	/* --------------------------- controls -------------------------- */
	function begin(): void {
		painScore = null;
		if (routine) startPlayer(routine, settings);
	}

	function done(): void {
		stopPlayer();
		goto('/');
	}

	function onKey(e: KeyboardEvent): void {
		if (player.status === 'idle' || player.status === 'finished' || showZoomModal) return;
		if ((e.target as HTMLElement | null)?.closest('button, input, textarea, select') && e.key === ' ') return;
		if (e.key === ' ') {
			e.preventDefault();
			togglePause();
		} else if (e.key === 'ArrowLeft') {
			e.preventDefault();
			back();
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			skip();
		} else if (e.key === 'Escape' && player.status === 'running') {
			// Pause rather than quit, so a stray Escape never throws away a workout.
			e.preventDefault();
			togglePause();
		}
	}

	$effect(() => {
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<svelte:head>
	<title>{routine ? `${routine.name || 'Routine'} · Stretch Timer` : 'Player · Stretch Timer'}</title>
</svelte:head>

{#if player.status === 'idle'}
	{#if !routine || routine.stretches.length === 0}
		<div class="card" style="margin: 1.5rem 1rem; max-width: 480px">
			<p class="muted" style="margin: 0">{routine ? 'This routine has no stretches yet.' : 'This routine doesn’t exist any more.'}</p>
			<a class="btn small" href={routine ? `/routine/${routine.id}` : '/'} style="margin-top: 0.6rem">
				{routine ? 'Add stretches' : '← Back to routines'}
			</a>
		</div>
	{:else}
		<div class="pl pl-idle">
			<div class="pl-top">
				{#if isMicro}
					<button class="pl-back" onclick={shuffleMicroBreak}>↻ Shuffle</button>
				{:else}
					<a class="pl-back" href={`/routine/${routine.id}`}>‹ Edit</a>
				{/if}
				<a class="icon-btn pl-icon" href="/" aria-label="Close">✕</a>
			</div>

			<div class="idle-head">
				<h1>{routine.name || 'Untitled routine'}</h1>
				<p class="muted">
					<strong>{formatSeconds(total)}</strong> · {routine.stretches.length} stretch{routine.stretches.length === 1 ? '' : 'es'}{(routine.sets ?? 1) > 1
						? ` · ${routine.sets} sets`
						: ''}{(routine.breakSeconds ?? settings.breakSeconds) > 0 && settings.breaksEnabled
						? ` · ${routine.breakSeconds ?? settings.breakSeconds}s rest`
						: ''}
				</p>
			</div>

			<ol class="idle-list">
				{#each routine.stretches as s, i (s.id)}
					<li>
						<span class="idle-num">{i + 1}</span>
						<PhotoThumb photoId={s.photoId} iconKey={s.iconKey} name={s.name} size={48} rounded={9} />
						<span class="idle-name">{s.name || 'Untitled stretch'}</span>
						<span class="idle-dur muted small">{stretchDurationLabel(s)}</span>
					</li>
				{/each}
			</ol>

			<div class="idle-foot">
				{#if !isMicro}
					<label class="gentle-toggle" class:on={gentle}>
						<input type="checkbox" bind:checked={gentle} />
						<span>
							<strong>🌧 Bad day? Gentle version</strong>
							<small class="muted"
								>{gentle
									? `No weights, bands or reps, one set · ${formatSeconds(total)} instead of ${formatSeconds(fullTotal)}. Still counts.`
									: 'Drops loading and extra sets, and still counts.'}</small
							>
						</span>
					</label>
				{/if}
				<button class="btn primary pl-start" onclick={begin}>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>
					Start
				</button>
				<p class="muted small">Your screen stays awake while you stretch.</p>
			</div>
		</div>
	{/if}
{:else}
	<div class="pl pl-active" class:paused={player.status === 'paused'} class:on-break={segment?.kind === 'break'}>
		<div class="pl-top">
			<button class="icon-btn pl-icon" onclick={done} aria-label="End workout" title="End workout">✕</button>
			<div class="pl-title">
				<span class="pl-routine">{player.routineName}</span>
				<span class="muted small">
					Stretch {stretchNumber} of {stretchCount} · {formatSeconds(remainingTotal)} left
				</span>
			</div>
			<button class="icon-btn pl-icon" onclick={restart} title="Restart from the beginning" aria-label="Restart">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
					<path d="M3 3v5h5" />
				</svg>
			</button>
		</div>
		<div
			class="pl-progress"
			role="progressbar"
			aria-label="Routine progress"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={Math.round(routineProgress * 100)}
		>
			<div class="pl-progress-fill" style={`width: ${routineProgress * 100}%`}></div>
		</div>

		{#if settings.testingMode}
			<div class="player-test-hud">
				<div class="test-hud-label">⚡ DEV TEST</div>
				<div class="test-hud-actions">
					<div class="speed-selector">
						{#each [1, 5, 10, 30] as s (s)}
							<button class="speed-btn" class:active={player.speed === s} onclick={() => setPlaybackSpeed(s)}>
								{s}x
							</button>
						{/each}
					</div>
					<button class="btn small test-btn" onclick={() => jumpToCountdown(3)}>⏱ 3s tick</button>
					<button class="btn small test-btn" onclick={instantComplete}>⚡ Finish</button>
				</div>
			</div>
		{/if}

		{#if segment}
			<div class="stage">
				<div class="stage-badges">
					{#if segment.kind === 'break'}
						<span class="pill pill-break">Rest</span>
					{:else if segment.side}
						<span class="pill pill-side">{sideLabel(segment.side)} side</span>
					{/if}
					{#if segment.totalSets && segment.totalSets > 1}
						<span class="pill">Set {segment.set} of {segment.totalSets}</span>
					{/if}
				</div>

				<h2 class="stage-title">
					{#if segment.kind === 'break' && nextSegment}
						Up next: {nextSegment.label}
					{:else}
						{segment.label}
					{/if}
				</h2>

				{#if segment.kind === 'break' && nextSegment?.stretch}
					<div class="stage-visual is-preview">
						<StretchIllustration iconKey={nextSegment.stretch.iconKey} name={nextSegment.stretch.name} size="100%" rounded={18} animated={false} />
					</div>
				{:else if segment.kind === 'break'}
					<div class="stage-visual stage-rest">☕</div>
				{:else}
					<button class="stage-visual" onclick={() => (showZoomModal = true)} aria-label="Show stretch details">
						{#if photoUrl}
							<img src={photoUrl} alt={segment.label} />
						{:else if segment.stretch}
							<StretchIllustration iconKey={segment.stretch.iconKey} name={segment.stretch.name} size="100%" rounded={18} animated={player.status === 'running'} />
						{/if}
					</button>
				{/if}

				<div class="stage-timer" aria-live="off">
					<ProgressRing progress={fraction} size={150} stroke={10}>
						<div class="ring-center">
							<span class="ring-num">{secondsLeft >= 60 ? formatSeconds(secondsLeft) : secondsLeft}</span>
							<span class="ring-unit">{player.status === 'paused' ? 'Paused' : secondsLeft >= 60 ? 'min' : 'sec'}</span>
						</div>
					</ProgressRing>
				</div>

				{#if segment.kind === 'break'}
					{#if nextSegment?.side === 'right'}
						<p class="stage-cue">Switch sides — right side next</p>
					{:else if nextSegment?.side === 'left'}
						<p class="stage-cue">Get ready — left side first</p>
					{:else}
						<p class="stage-cue">Breathe and get ready</p>
					{/if}
				{:else if segment.stretch?.description}
					<p class="stage-cue">{segment.stretch.description}</p>
				{/if}
			</div>
		{/if}

		<div class="pl-bottom">
			{#if nextSegment && segment?.kind !== 'break'}
				<p class="next-line muted small">
					Next: <strong>{nextSegment.kind === 'break' ? `Rest ${durationText(nextSegment.seconds)}` : `${nextSegment.label}${nextSegment.side ? ` · ${sideLabel(nextSegment.side)}` : ''}`}</strong>
				</p>
			{:else if !nextSegment}
				<p class="next-line muted small">Last one — nearly there!</p>
			{:else}
				<p class="next-line muted small">&nbsp;</p>
			{/if}
			<div class="controls">
				<button class="ctrl" onclick={back} title="Previous" aria-label="Previous">
					<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
				</button>
				<button
					class="ctrl ctrl-main"
					onclick={togglePause}
					aria-label={player.status === 'paused' ? 'Resume' : 'Pause'}
					title={player.status === 'paused' ? 'Resume (Space)' : 'Pause (Space)'}
				>
					{#if player.status === 'paused'}
						<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" style="margin-left: 3px" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
					{:else}
						<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
					{/if}
				</button>
				<button class="ctrl" onclick={skip} title="Skip" aria-label="Skip">
					<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
				</button>
			</div>
		</div>
	</div>

	{#if showZoomModal && segment?.stretch}
		<Modal onclose={() => (showZoomModal = false)} class="zoom-sheet">
			{#snippet header()}
				<h2 style="font-size: 1.2rem">{segment.label}</h2>
				{#if segment.side}<span class="muted small">{sideLabel(segment.side)} side</span>{/if}
			{/snippet}
			<div class="zoom-visual">
				{#if photoUrl}
					<img src={photoUrl} alt={segment.label} />
				{:else}
					<StretchIllustration iconKey={segment.stretch.iconKey} name={segment.stretch.name} size="100%" rounded={18} />
				{/if}
			</div>
			{#if segment.stretch.description}
				<p class="zoom-desc">{segment.stretch.description}</p>
			{/if}
			<button class="btn primary" style="width: 100%; font-weight: 700" onclick={() => (showZoomModal = false)}>Back to timer</button>
		</Modal>
	{/if}

	{#if player.status === 'finished'}
		<div class="finish" role="dialog" aria-modal="true" aria-labelledby="finish-title">
			<div class="finish-burst" aria-hidden="true">🎉</div>
			<h2 id="finish-title">Routine complete</h2>
			<p class="finish-stats muted">
				{formatSeconds(total)} · {stretchCount} stretch{stretchCount === 1 ? '' : 'es'}{totalSets > 1 ? ` × ${totalSets} sets` : ''}
			</p>
			<div class="finish-streak">
				<span class="finish-flame" aria-hidden="true">🔥</span>
				<span>
					{#if streakNow > 1}
						<strong>{streakNow}-day streak</strong> — keep it going!
					{:else}
						<strong>Streak started</strong> — come back tomorrow
					{/if}
				</span>
			</div>
			<div class="pain-check" role="group" aria-labelledby="pain-q">
				{#if painScore === null}
					<span id="pain-q" class="small">How’s the pain right now? <span class="muted">(optional)</span></span>
					<div class="pain-chips">
						{#each Array.from({ length: 11 }, (_, i) => i) as n (n)}
							<button class="pain-chip" style="--pain: {n}" aria-label="Pain {n} out of 10" onclick={() => checkIn(n)}>{n}</button>
						{/each}
					</div>
					<span class="pain-scale muted small"><span>0 none</span><span>10 worst</span></span>
				{:else}
					<span id="pain-q" class="small pain-logged">
						<span class="zone-dot zone-{painZone(painScore)}" aria-hidden="true"></span>
						<span><strong>{painScore}/10.</strong> {zoneAdvice[painZone(painScore)]}</span>
					</span>
					<button class="btn small ghost" onclick={undoCheckIn}>Undo</button>
				{/if}
			</div>
			<div class="finish-actions">
				<button class="btn primary" onclick={done}>Done</button>
				<button class="btn" onclick={restart}>Play again</button>
			</div>
		</div>
	{/if}
{/if}

<style>
	.pl {
		height: 100dvh;
		display: flex;
		flex-direction: column;
		padding: max(0.6rem, env(safe-area-inset-top)) 1rem max(0.9rem, env(safe-area-inset-bottom));
		max-width: 560px;
		margin: 0 auto;
	}

	.pl-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex-shrink: 0;
		min-height: 2.6rem;
	}
	.pl-icon {
		width: 2.5rem;
		height: 2.5rem;
		display: grid;
		place-items: center;
		font-size: 1.1rem;
		text-decoration: none;
		color: var(--text);
	}
	.pl-back {
		color: var(--accent);
		font-weight: 600;
		text-decoration: none;
		padding: 0.4rem 0;
	}
	button.pl-back {
		background: none;
		border: 0;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	/* ---------- idle ---------- */
	.gentle-toggle {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
		width: 100%;
		padding: 0.6rem 0.75rem;
		margin-bottom: 0.6rem;
		border: 1px solid var(--border);
		border-radius: 12px;
		cursor: pointer;
		text-align: left;
	}
	.gentle-toggle.on {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 10%, transparent);
	}
	.gentle-toggle input {
		margin-top: 0.2rem;
		accent-color: var(--accent);
	}
	.gentle-toggle span {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	/* ---------- pain check-in ---------- */
	.pain-check {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.45rem;
		width: min(100%, 360px);
		margin: 0.25rem 0 0.75rem;
	}
	.pain-chips {
		display: grid;
		grid-template-columns: repeat(11, 1fr);
		gap: 0.2rem;
		width: 100%;
	}
	.pain-chip {
		aspect-ratio: 1;
		min-width: 0;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: color-mix(in srgb, #e0533d calc(var(--pain) * 8%), var(--surface));
		color: var(--text);
		font: inherit;
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
		padding: 0;
	}
	.pain-logged {
		display: flex;
		align-items: baseline;
		gap: 0.45rem;
		text-align: left;
	}
	.zone-dot {
		flex: none;
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
	}
	.zone-green {
		background: #2fa86b;
	}
	.zone-amber {
		background: #e3a21a;
	}
	.zone-red {
		background: #e0533d;
	}
	.pain-scale {
		display: flex;
		justify-content: space-between;
		width: 100%;
	}
	.idle-head {
		text-align: center;
		margin: 0.6rem 0 1rem;
	}
	.idle-head h1 {
		font-size: 1.7rem;
		font-weight: 800;
	}
	.idle-head p {
		margin: 0.3rem 0 0;
	}
	.idle-head strong {
		color: var(--text);
	}
	.idle-list {
		list-style: none;
		margin: 0;
		padding: 0.3rem;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 16px;
	}
	.idle-list li {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.45rem 0.55rem;
	}
	.idle-list li + li {
		border-top: 1px solid var(--border);
	}
	.idle-num {
		width: 1.2rem;
		text-align: center;
		color: var(--muted);
		font-weight: 700;
		font-size: 0.85rem;
		font-variant-numeric: tabular-nums;
	}
	.idle-name {
		flex: 1;
		min-width: 0;
		font-weight: 600;
		line-height: 1.25;
	}
	.idle-dur {
		white-space: nowrap;
	}
	.idle-foot {
		flex-shrink: 0;
		text-align: center;
		padding-top: 1rem;
	}
	.idle-foot p {
		margin: 0.55rem 0 0;
	}
	.pl-start {
		width: 100%;
		padding: 1rem;
		font-size: 1.2rem;
		font-weight: 800;
		border-radius: 16px;
		box-shadow: 0 8px 24px color-mix(in srgb, var(--accent) 35%, transparent);
	}

	/* ---------- active ---------- */
	.pl-title {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		line-height: 1.2;
	}
	.pl-routine {
		font-weight: 700;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.pl-progress {
		height: 4px;
		border-radius: 999px;
		background: var(--surface-2);
		overflow: hidden;
		margin: 0.5rem 0 0;
		flex-shrink: 0;
	}
	.pl-progress-fill {
		height: 100%;
		background: var(--accent);
		border-radius: inherit;
		transition: width 0.3s linear;
	}

	.stage {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		text-align: center;
		padding: 0.5rem 0;
	}
	.stage-badges {
		display: flex;
		gap: 0.35rem;
		min-height: 1.6rem;
		align-items: center;
	}
	.pill {
		display: inline-flex;
		align-items: center;
		padding: 0.22rem 0.65rem;
		border-radius: 999px;
		background: var(--surface-2);
		color: var(--muted);
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.pill-side {
		background: var(--accent);
		color: #fff;
	}
	.pill-break {
		background: var(--ok);
		color: #fff;
	}
	.stage-title {
		font-size: 1.45rem;
		font-weight: 800;
		line-height: 1.2;
		max-width: 100%;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.stage-visual {
		width: min(100%, 320px, 38dvh * 1.25);
		aspect-ratio: 5 / 4;
		flex-shrink: 1;
		min-height: 0;
		padding: 0;
		border: none;
		background: var(--surface-2);
		border-radius: 18px;
		overflow: hidden;
		cursor: pointer;
		display: grid;
		place-items: center;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
		transition: transform 0.12s;
	}
	button.stage-visual:active {
		transform: scale(0.98);
	}
	.stage-visual img {
		width: 100%;
		height: 100%;
		/* Show the whole uploaded photo; letterbox rather than crop. */
		object-fit: contain;
		background: var(--surface-2, rgba(127, 127, 127, 0.12));
	}
	.stage-visual.is-preview {
		cursor: default;
		opacity: 0.75;
		width: min(70%, 220px, 28dvh * 1.25);
	}
	.stage-rest {
		cursor: default;
		font-size: 3rem;
	}

	.stage-timer {
		flex-shrink: 0;
		transition: opacity 0.2s;
	}
	.paused .stage-timer {
		opacity: 0.55;
	}
	.on-break .stage-timer :global(.ring-fg) {
		stroke: var(--ok);
	}
	.ring-center {
		display: flex;
		flex-direction: column;
		align-items: center;
		line-height: 1;
	}
	.ring-num {
		font-size: 3.3rem;
		font-weight: 800;
		letter-spacing: -0.04em;
		font-variant-numeric: tabular-nums;
	}
	.ring-unit {
		margin-top: 0.2rem;
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.paused .ring-unit {
		color: var(--accent);
	}

	.stage-cue {
		margin: 0;
		max-width: 26rem;
		color: var(--muted);
		font-size: 0.95rem;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.pl-bottom {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6rem;
	}
	.next-line {
		margin: 0;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.next-line strong {
		color: var(--text);
	}
	.controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.6rem;
	}
	.ctrl {
		width: 3.4rem;
		height: 3.4rem;
		border-radius: 50%;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text);
		display: grid;
		place-items: center;
		cursor: pointer;
		transition: transform 0.08s, background 0.15s;
		touch-action: manipulation;
	}
	.ctrl:active {
		transform: scale(0.93);
	}
	.ctrl-main {
		width: 4.6rem;
		height: 4.6rem;
		border: none;
		background: var(--accent);
		color: #fff;
		box-shadow: 0 8px 24px color-mix(in srgb, var(--accent) 40%, transparent);
	}
	.ctrl-main:hover {
		background: var(--accent-strong);
	}

	@media (max-height: 640px) {
		.stage-cue {
			-webkit-line-clamp: 2;
			line-clamp: 2;
		}
		.stage :global(.ring-wrap) {
			transform: scale(0.85);
			margin: -0.6rem 0;
		}
	}

	/* ---------- zoom sheet ---------- */
	:global(.zoom-sheet) {
		max-width: 460px;
	}
	.zoom-visual {
		display: flex;
		justify-content: center;
		margin-bottom: 0.8rem;
	}
	.zoom-visual > :global(*) {
		width: min(100%, 340px) !important;
	}
	.zoom-visual img {
		aspect-ratio: 5 / 4;
		object-fit: contain;
		background: var(--surface-2, rgba(127, 127, 127, 0.12));
		border-radius: 18px;
	}
	.zoom-desc {
		margin: 0 0 1rem;
		line-height: 1.5;
	}

	/* ---------- finish ---------- */
	.finish {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		padding: 2rem 1.5rem;
		text-align: center;
		background: color-mix(in srgb, var(--bg) 96%, transparent);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		animation: finishIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.finish-burst {
		font-size: 4.5rem;
		animation: pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.finish h2 {
		font-size: 2rem;
		font-weight: 800;
	}
	.finish-stats {
		margin: 0;
		font-size: 1.05rem;
	}
	.finish-streak {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-top: 0.6rem;
		padding: 0.75rem 1rem;
		border-radius: 14px;
		background: var(--surface);
		border: 1px solid var(--border);
		max-width: 22rem;
		text-align: left;
	}
	.finish-flame {
		font-size: 1.6rem;
	}
	.finish-actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: min(100%, 18rem);
		margin-top: 1.2rem;
	}
	.finish-actions .btn {
		padding: 0.8rem;
		font-weight: 700;
	}
	@keyframes finishIn {
		from {
			opacity: 0;
		}
	}
	@keyframes pop {
		from {
			transform: scale(0.3);
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.finish,
		.finish-burst {
			animation: none;
		}
	}
</style>
