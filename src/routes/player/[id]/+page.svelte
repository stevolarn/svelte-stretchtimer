<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		back,
		jumpTo,
		player,
		restart,
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
		<div class="card">
			<p class="muted" style="margin: 0">This routine has no stretches yet.</p>
			<a class="btn small" href="/" style="margin-top: 0.6rem">← Back</a>
		</div>
	{:else}
		<div class="player">
			<div></div>
			<div style="display: flex; flex-direction: column; align-items: center; gap: 0.8rem">
				<h1 style="font-size: 1.6rem">{routine.name}</h1>
				<div class="row" style="justify-content: center">
					<span class="badge">{routine.stretches.length} stretch{routine.stretches.length === 1 ? '' : 'es'}</span>
					<span class="badge">⏱ {formatSeconds(total)}</span>
					{#if settings.breaksEnabled}
						<span class="badge">{settings.breakSeconds}s breaks</span>
					{/if}
				</div>
				<button class="btn primary" style="font-size: 1.1rem; padding: 0.8rem 2.2rem" onclick={begin}>
					▶ Start
				</button>
				<p class="muted small" style="margin: 0">Beeps guide you — keep the tab open and the screen stays awake.</p>
			</div>
			<div></div>
		</div>
	{/if}
{:else}
	<div class="player">
		<div class="player-top">
			<button class="btn small ghost" onclick={done}>✕ Stop</button>
			<span class="player-routine">{player.routineName}</span>
			<button class="btn small ghost" onclick={restart} title="Restart">↺</button>
		</div>

		{#if segment}
			<div style="display: flex; flex-direction: column; align-items: center; gap: 0.4rem">
				{#if segment.kind === 'break'}
					<span class="side-badge break-badge">BREAK</span>
				{:else if segment.side}
					<span class="side-badge">{segment.side === 'left' ? 'LEFT' : 'RIGHT'}</span>
				{/if}
				<ProgressRing progress={fraction} size={300}>
					<div class="time">{formatSeconds(player.remaining)}</div>
					<div style="font-weight: 700">{segment.label}</div>
					{#if segment.kind === 'break' && nextSegment}
						<div class="muted small">Next: {nextSegment.label}</div>
					{/if}
				</ProgressRing>
			</div>

			<div class="player-progress" aria-label={`Routine progress: ${Math.round(routineProgress * 100)} percent`}>
				<div class="spread small muted">
					<span>Routine progress</span>
					<span>{segmentNumber} / {player.segments.length} segments · {Math.round(routineProgress * 100)}%</span>
				</div>
				<div class="progress-track"><div class="progress-fill" style={`width: ${routineProgress * 100}%`}></div></div>
			</div>

			<div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; width: 100%">
				{#if photoUrl}
					<img class="stretch-photo" src={photoUrl} alt={segment.label} />
				{/if}
				{#if segment.stretch?.description}
					<p class="player-desc small">{segment.stretch.description}</p>
				{/if}
			</div>
		{/if}

		<div class="player-controls">
			<button class="ctrl" onclick={back} title="Previous">⏮</button>
			<button class="ctrl main" onclick={togglePause} title={player.status === 'paused' ? 'Resume' : 'Pause'}>
				{player.status === 'paused' ? '▶' : '⏸'}
			</button>
			<button class="ctrl" onclick={skip} title="Skip">⏭</button>
		</div>

		<div class="segment-map" aria-label="Routine segments">
			<div class="muted small" style="margin-bottom: 0.35rem">Routine map · tap a segment to jump</div>
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
			<div class="row">
				<button class="btn primary" onclick={done}>Done</button>
				<button class="btn" onclick={restart}>Play again</button>
			</div>
		</div>
	{/if}
{/if}
