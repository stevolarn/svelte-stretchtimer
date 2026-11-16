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
	import StretchIllustration from '$lib/components/StretchIllustration.svelte';

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
			<button class="btn small ghost player-stop-btn" onclick={done}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.3rem">
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
				Stop
			</button>
			<span class="player-routine">{player.routineName}</span>
			<button class="btn small ghost player-restart-btn" onclick={restart} title="Restart" aria-label="Restart">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
					<path d="M3 3v5h5"/>
				</svg>
			</button>
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
			<div class="player-hero-stage">
				<!-- Side Badge & Label Header -->
				<div class="player-stage-header">
					<div class="player-badge-row">
						{#if segment.kind === 'break'}
							<span class="side-badge break-badge">BREAK</span>
						{:else if segment.side}
							<span class="side-badge">{segment.side === 'left' ? 'LEFT SIDE' : 'RIGHT SIDE'}</span>
						{:else}
							<span class="side-badge side-badge-neutral">STRETCH</span>
						{/if}
						{#if segment.totalSets && segment.totalSets > 1}
							<span class="side-badge side-badge-neutral">SET {segment.set}/{segment.totalSets}</span>
						{/if}
					</div>
					<h2 class="player-hero-title">{segment.label}</h2>
				</div>

				<!-- BIG HERO VISUAL -->
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<div
					class="player-hero-visual-card"
					onclick={() => (showZoomModal = true)}
					title="Tap to zoom"
					role="button"
					tabindex="0"
				>
					{#if segment.kind === 'break'}
						<div class="player-break-hero">
							<span class="player-break-icon">☕</span>
							{#if nextSegment}
								<div class="player-break-next-box">
									<span class="player-next-sub">Next up</span>
									<span class="player-next-main">{nextSegment.label}{nextSegment.side ? ` · ${nextSegment.side === 'left' ? 'Left' : 'Right'}` : ''}</span>
								</div>
							{/if}
						</div>
					{:else if photoUrl}
						<img class="player-hero-photo" src={photoUrl} alt={segment.label} />
					{:else if segment.stretch}
						<div class="player-hero-illustration">
							<StretchIllustration
								iconKey={segment.stretch.iconKey}
								name={segment.stretch.name}
								size="100%"
								rounded={16}
								animated={true}
							/>
						</div>
					{/if}
				</div>

				<!-- PROMINENT COUNTDOWN WHEEL TIMER (1 NUMBER, BIGGER) -->
				<div class="player-wheel-container">
					<ProgressRing progress={fraction} size={148} stroke={10}>
						<div class="player-ring-center-content">
							<span class="player-countdown-num">
								{Math.ceil(player.remaining) >= 60 ? formatSeconds(Math.ceil(player.remaining)) : Math.ceil(player.remaining)}
							</span>
							{#if Math.ceil(player.remaining) < 60}
								<span class="player-countdown-unit">SEC</span>
							{/if}
						</div>
					</ProgressRing>
				</div>

				{#if segment.kind === 'break' && nextSegment}
					<div class="player-cue-strip">
						<span class="player-cue-text">Get ready for <strong>{nextSegment.label}{nextSegment.side ? ` (${nextSegment.side === 'left' ? 'Left' : 'Right'})` : ''}</strong></span>
					</div>
				{:else if segment.stretch?.description}
					<div class="player-cue-strip">
						<p class="player-cue-text">{segment.stretch.description}</p>
					</div>
				{/if}
			</div>

			<!-- Routine Progress Bar -->
			<div class="player-progress" aria-label={`Routine progress: ${Math.round(routineProgress * 100)} percent`}>
				<div class="spread small muted" style="margin-bottom: 0.2rem">
					<span>Progress</span>
					<span>{segmentNumber} / {player.segments.length} · {Math.round(routineProgress * 100)}%</span>
				</div>
				<div class="progress-track"><div class="progress-fill" style={`width: ${routineProgress * 100}%`}></div></div>
			</div>
		{/if}

		<div class="player-controls">
			<button class="ctrl" onclick={back} title="Previous segment" aria-label="Previous">
				<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
					<path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
				</svg>
			</button>
			<button class="ctrl main" onclick={togglePause} title={player.status === 'paused' ? 'Resume' : 'Pause'} aria-label={player.status === 'paused' ? 'Resume' : 'Pause'}>
				{#if player.status === 'paused'}
					<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style="margin-left: 3px">
						<path d="M8 5v14l11-7z"/>
					</svg>
				{:else}
					<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
						<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
					</svg>
				{/if}
			</button>
			<button class="ctrl" onclick={skip} title="Skip segment" aria-label="Skip">
				<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
					<path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
				</svg>
			</button>
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

	<!-- Fullscreen / Zoom Modal for Player Visual -->
	{#if showZoomModal && segment}
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div class="modal-backdrop" onclick={() => (showZoomModal = false)}>
			<div class="modal-sheet player-zoom-modal" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<div>
						<h2 style="font-size: 1.25rem; margin: 0">{segment.label}</h2>
						{#if segment.side}
							<span class="badge" style="margin-top: 0.2rem">
								{segment.side === 'left' ? 'Left side' : 'Right side'}
							</span>
						{/if}
					</div>
					<button class="icon-btn close-modal-btn" onclick={() => (showZoomModal = false)} aria-label="Close">✕</button>
				</div>

				<div class="player-zoom-content">
					{#if photoUrl}
						<img class="player-zoom-photo" src={photoUrl} alt={segment.label} />
					{:else if segment.stretch}
						<div class="player-zoom-ill-wrap">
							<StretchIllustration
								iconKey={segment.stretch.iconKey}
								name={segment.stretch.name}
								size={280}
								rounded={18}
								animated={true}
							/>
						</div>
					{/if}

					{#if segment.stretch?.description}
						<div class="player-zoom-desc-box">
							<span class="player-zoom-desc-title">Posture Guidance</span>
							<p class="player-zoom-desc-text">{segment.stretch.description}</p>
						</div>
					{/if}
				</div>

				<button class="btn primary small" style="width: 100%; font-weight: 700" onclick={() => (showZoomModal = false)}>
					Return to Timer
				</button>
			</div>
		</div>
	{/if}

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
