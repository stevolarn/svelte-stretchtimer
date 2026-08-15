<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		back,
		instantComplete,
		jumpTo,
		jumpToCountdown,
		player,
		restart,
		setPlaybackSpeed,
		skip,
		startPlayer,
		stopPlayer,
		togglePause
	} from '$lib/player.svelte';
	import { getRoutine, settings, streak } from '$lib/stores.svelte';
	import { buildTimeline, timelineTotal } from '$lib/timeline';
	import { formatSeconds } from '$lib/time';
	import { currentStreak } from '$lib/streak';
	import { getPhotoData } from '$lib/storage';
	import ProgressRing from '$lib/components/ProgressRing.svelte';

	const routine = $derived(getRoutine(page.params.id ?? ''));
	const total = $derived(routine ? timelineTotal(buildTimeline(routine, settings)) : 0);

	const segment = $derived(player.segments[player.index] ?? null);
	const nextSegment = $derived(player.segments[player.index + 1] ?? null);
	const fraction = $derived(segment && segment.seconds > 0 ? player.remaining / segment.seconds : 0);
	const streakNow = $derived(currentStreak(streak));
	const segmentNumber = $derived(player.segments.length > 0 ? player.index + 1 : 0);
	const routineElapsed = $derived(
		player.segments.slice(0, player.index).reduce((sum, item) => sum + item.seconds, 0) + player.elapsed
	);
	const routineProgress = $derived(total > 0 ? Math.min(1, routineElapsed / total) : 0);

	let photoUrl = $state<string | null>(null);
	let ringSize = $state(230);

	function updateRingSize(): void {
		if (typeof window === 'undefined') return;
		const h = window.innerHeight;
		const w = window.innerWidth;
		if (h < 750 || w < 380) {
			ringSize = 200;
		} else if (h < 880 || w < 500) {
			ringSize = 225;
		} else {
			ringSize = 260;
		}
	}

	$effect(() => {
		updateRingSize();
	});

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
		updateRingSize();
		window.addEventListener('resize', updateRingSize);
		const onVis = () => {
			if (document.visibilityState === 'visible' && player.status === 'running') void requestWake();
		};
		document.addEventListener('visibilitychange', onVis);
		return () => {
			window.removeEventListener('resize', updateRingSize);
			document.removeEventListener('visibilitychange', onVis);
			stopPlayer();
		};
	});

	/* --------------------------- controls -------------------------- */
	function begin(): void {
		if (routine) startPlayer(routine, settings);
	}

	function done(): void {
		stopPlayer();
		goto('/');
	}

	function onKey(e: KeyboardEvent): void {
		if (player.status === 'idle') return;
		if (e.key === ' ') {
			e.preventDefault();
			togglePause();
		} else if (e.key === 'ArrowLeft') {
			e.preventDefault();
			back();
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			skip();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			stopPlayer();
		}
	}

	$effect(() => {
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<svelte:head>
	<title>{routine ? routine.name : 'Player'}</title>
</svelte:head>

{#if player.status === 'idle'}
	{#if !routine || routine.stretches.length === 0}
		<div class="card" style="margin: 1.5rem auto; max-width: 480px">
			<p class="muted" style="margin: 0">This routine has no stretches yet.</p>
			<a class="btn small" href="/" style="margin-top: 0.6rem">← Back to routines</a>
		</div>
	{:else}
		<div class="player player-idle-view">
			<div class="player-top">
				<a class="btn small ghost" href="/">← Routines</a>
				<span class="player-routine">{routine.name}</span>
				<div style="width: 4rem"></div>
			</div>
			<div class="player-idle-content">
				<h1 style="font-size: 1.7rem; margin-bottom: 0.2rem">{routine.name}</h1>
				<div class="row" style="justify-content: center; gap: 0.5rem">
					<span class="badge">{routine.stretches.length} stretch{routine.stretches.length === 1 ? '' : 'es'}</span>
					<span class="badge">⏱ {formatSeconds(total)}</span>
					{#if settings.breaksEnabled}
						<span class="badge">
							{(routine.breakSeconds ?? settings.breakSeconds) === 0
								? 'No breaks'
								: `${routine.breakSeconds ?? settings.breakSeconds}s breaks`}
						</span>
					{/if}
				</div>
				<button class="btn primary player-big-start-btn" onclick={begin}>
					▶ Start routine
				</button>
				<p class="muted small" style="margin: 0; max-width: 20rem">
					Screen stays awake · Sound cues guide each stretch and switch
				</p>
			</div>
			<div class="player-idle-bottom"></div>
		</div>
	{/if}
{:else}
	<div class="player player-active-view">
		<div class="player-top">
			<button class="btn small ghost player-stop-btn" onclick={done}>✕ Stop</button>
			<span class="player-routine">{player.routineName}</span>
			<button class="btn small ghost player-restart-btn" onclick={restart} title="Restart">↺</button>
		</div>

		{#if settings.testingMode}
			<div class="player-test-hud">
				<div class="test-hud-label">⚡ DEV TEST</div>
				<div class="test-hud-actions">
					<div class="speed-selector">
						{#each [1, 5, 10, 30] as s}
							<button
								class="speed-btn"
								class:active={player.speed === s}
								onclick={() => setPlaybackSpeed(s)}
							>
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
			<div class="player-ring-section">
				<div class="player-badge-row">
					{#if segment.kind === 'break'}
						<span class="side-badge break-badge">BREAK</span>
					{:else if segment.side}
						<span class="side-badge">{segment.side === 'left' ? 'LEFT SIDE' : 'RIGHT SIDE'}</span>
					{:else}
						<span class="side-badge side-badge-neutral">STRETCH</span>
					{/if}
				</div>
				<ProgressRing progress={fraction} size={ringSize}>
					<div class="time">{formatSeconds(player.remaining)}</div>
					<div class="player-segment-name">{segment.label}</div>
					{#if segment.kind === 'break' && nextSegment}
						<div class="muted small player-next-cue">Next: {nextSegment.label}</div>
					{/if}
				</ProgressRing>
			</div>

			<div class="player-progress" aria-label={`Routine progress: ${Math.round(routineProgress * 100)} percent`}>
				<div class="spread small muted" style="margin-bottom: 0.2rem">
					<span>Progress</span>
					<span>{segmentNumber} / {player.segments.length} · {Math.round(routineProgress * 100)}%</span>
				</div>
				<div class="progress-track"><div class="progress-fill" style={`width: ${routineProgress * 100}%`}></div></div>
			</div>

			{#if photoUrl || segment.stretch?.description}
				<div class="player-info-strip">
					{#if photoUrl}
						<img class="player-strip-photo" src={photoUrl} alt={segment.label} />
					{/if}
					{#if segment.stretch?.description}
						<div class="player-desc-box">
							<p class="player-desc-text">{segment.stretch.description}</p>
						</div>
					{/if}
				</div>
			{/if}
		{/if}

		<div class="player-controls">
			<button class="ctrl" onclick={back} title="Previous segment" aria-label="Previous">⏮</button>
			<button class="ctrl main" onclick={togglePause} title={player.status === 'paused' ? 'Resume' : 'Pause'} aria-label={player.status === 'paused' ? 'Resume' : 'Pause'}>
				{player.status === 'paused' ? '▶' : '⏸'}
			</button>
			<button class="ctrl" onclick={skip} title="Skip segment" aria-label="Skip">⏭</button>
		</div>

		<div class="segment-map" aria-label="Routine segments">
			<div class="segment-map-list">
				{#each player.segments as item, i (i)}
					<button
						class="segment-chip"
						class:current={i === player.index}
						class:complete={i < player.index}
						onclick={() => jumpTo(i)}
						title={`Jump to ${item.label}`}
					>
						<span>{i < player.index ? '✓' : i + 1}</span>
						{item.kind === 'break' ? 'Break' : `${item.label}${item.side ? ` · ${item.side === 'left' ? 'L' : 'R'}` : ''}`}
					</button>
				{/each}
			</div>
		</div>
	</div>

	{#if player.status === 'finished'}
		<div class="finish-overlay">
			<div class="finish-icon">🎉</div>
			<div class="finish-title">Routine complete!</div>
			<p style="margin: 0">
				Day credited{streakNow > 1 ? ` — ${streakNow}-day streak 🔥` : streakNow === 1 ? ' — streak started!' : ''}
			</p>
			<div class="row" style="margin-top: 0.5rem; gap: 0.75rem">
				<button class="btn primary" onclick={done} style="min-width: 6rem">Done</button>
				<button class="btn" onclick={restart} style="min-width: 6rem">Play again</button>
			</div>
		</div>
	{/if}
{/if}
