<script lang="ts">
	import { onMount } from 'svelte';
	import { playCue, speak, vibrate } from '$lib/audio';
	import {
		addTestFixer,
		applyFixer,
		clearStreakHistory,
		exportBackup,
		importBackup,
		restoreFromSnapshot,
		saveAll,
		seedTestRoutines,
		settings,
		simulateBrokenStreak,
		simulateStreak,
		streak,
		updateSettings
	} from '$lib/stores.svelte';
	import {
		currentStreak,
		fixersAvailable,
		repairGap,
		canRepairStreak
	} from '$lib/streak';
	import {
		checkStoragePersistence,
		clearSnapshots,
		loadSnapshots,
		requestPersistentStorage
	} from '$lib/storage';
	import {
		connectFileAutoBackup,
		disconnectFileAutoBackup,
		hasFileSystemAccessSupport,
		isFileAutoBackupConnected,
		shareToCloudOrDrive
	} from '$lib/backup';
	import { type StorageSnapshot, type Theme } from '$lib/types';
	import { pwa } from '$lib/pwa.svelte';
	import Segmented from '$lib/components/Segmented.svelte';
	import Stepper from '$lib/components/Stepper.svelte';
	import Toggle from '$lib/components/Toggle.svelte';
	import { showToast } from '$lib/toast.svelte';
	import { disableReminder, enableReminder, reminderSupport } from '$lib/reminders';

	let isPersistent = $state(false);
	let fileBackupActive = $state(false);
	let snapshots = $state<StorageSnapshot[]>([]);

	const currentStreakNum = $derived(currentStreak(streak));
	const fixersAvailableNum = $derived(fixersAvailable(streak));
	const activeGap = $derived(repairGap(streak));
	const canRepair = $derived(canRepairStreak(streak));

	onMount(async () => {
		isPersistent = await checkStoragePersistence();
		fileBackupActive = isFileAutoBackupConnected();
		refreshSnapshots();
	});

	const reminderAvailability = reminderSupport();

	function hourLabel(h: number): string {
		if (h === 0) return '12 am';
		if (h === 12) return '12 pm';
		return h < 12 ? `${h} am` : `${h - 12} pm`;
	}

	async function toggleReminder(): Promise<void> {
		if (settings.reminderEnabled) {
			const problem = await enableReminder();
			if (problem) {
				settings.reminderEnabled = false;
				notify(problem);
			}
		} else {
			await disableReminder();
		}
		saveAll();
	}

	function notify(message: string): void {
		showToast(message);
	}

	function refreshSnapshots(): void {
		snapshots = loadSnapshots();
	}

	async function togglePersistence(): Promise<void> {
		if (isPersistent) return;
		isPersistent = await requestPersistentStorage();
		notify(isPersistent ? 'Your data is now protected from automatic clean-up.' : 'Your browser declined — try again after installing the app.');
	}

	async function handleCloudShare(): Promise<void> {
		const res = await shareToCloudOrDrive();
		if (res.success) {
			notify(res.method === 'share' ? 'Backup shared.' : 'Backup downloaded.');
		}
	}

	async function handleToggleFileAutoBackup(): Promise<void> {
		if (fileBackupActive) {
			disconnectFileAutoBackup();
			fileBackupActive = false;
			notify('Backup file unlinked.');
		} else {
			const ok = await connectFileAutoBackup();
			fileBackupActive = ok;
			notify(ok ? 'Backup file linked — changes now save to it automatically.' : 'Could not link a backup file.');
		}
	}

	function handleRestoreSnapshot(snap: StorageSnapshot): void {
		if (confirm(`Restore your data from ${formatWhen(snap.timestamp)}? (${snap.routineCount} routine${snap.routineCount === 1 ? '' : 's'}, ${snap.streakDays} streak day${snap.streakDays === 1 ? '' : 's'}). Your current routines will be replaced.`)) {
			restoreFromSnapshot(snap);
			refreshSnapshots();
			notify('Restored.');
		}
	}

	function handleClearAllSnapshots(): void {
		if (confirm('Delete all restore points?')) {
			clearSnapshots();
			refreshSnapshots();
			notify('Restore points deleted.');
		}
	}

	async function downloadBackup(): Promise<void> {
		const blob = new Blob([await exportBackup()], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `stretch-recovery-backup-${new Date().toISOString().slice(0, 10)}.json`;
		link.click();
		URL.revokeObjectURL(url);
		notify('Backup downloaded.');
	}

	async function restoreBackup(event: Event): Promise<void> {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		try {
			const result = await importBackup(await file.text());
			const extras = [
				result.pain && `${result.pain} pain score${result.pain === 1 ? '' : 's'}`,
				result.morning && `${result.morning} morning check${result.morning === 1 ? '' : 's'}`,
				result.function && `${result.function} task check-in${result.function === 1 ? '' : 's'}`
			].filter(Boolean);
			const tail = extras.length > 1 ? `${extras.slice(0, -1).join(', ')} and ${extras.at(-1)}` : extras[0];
			notify(`${result.added} routine${result.added === 1 ? '' : 's'}${tail ? `, ${tail}` : ''} restored.`);
			refreshSnapshots();
		} catch (error) {
			notify(error instanceof Error ? error.message : 'Could not restore backup.');
		} finally {
			input.value = '';
		}
	}

	function formatWhen(ts: number): string {
		return new Date(ts).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
	}

	/** Features some people won't want; switching one off hides it everywhere and keeps its data. */
	const optionalFeatures: Array<{
		key: 'painTracking' | 'morningCheck' | 'painAlerts' | 'progressPrompts' | 'weeklyReview' | 'functionChecks';
		label: string;
		hint: string;
	}> = [
		{ key: 'painTracking', label: 'Pain scores', hint: 'Ask for a 0–10 score after routines, and chart it on Streak' },
		{ key: 'morningCheck', label: 'Morning check', hint: 'Better, same or worse, the day after a routine' },
		{ key: 'painAlerts', label: 'Rising-pain alerts', hint: 'A card on Home when pain climbs week on week' },
		{ key: 'progressPrompts', label: 'Ready to progress?', hint: 'Suggest a step up after a calm fortnight on a routine' },
		{ key: 'weeklyReview', label: 'Weekly review', hint: 'Last week’s summary on Home each Monday' },
		{ key: 'functionChecks', label: 'Task check-ins', hint: 'Every two weeks, rate a few everyday tasks your pain makes hard' }
	];

	const cues = [
		{ key: 'beepStart', cue: 'start', label: 'Stretch starts', hint: 'A beep as each stretch begins' },
		{ key: 'beepSideSwitch', cue: 'side', label: 'Switch sides', hint: 'A double beep when it’s time to swap' },
		{ key: 'beepCountdown', cue: 'tick', label: 'Countdown', hint: 'Ticks in the last 3 seconds' },
		{ key: 'beepReps', cue: 'rep', label: 'Reps', hint: 'Soft tick on each rep' },
		{ key: 'metronome', cue: 'metronome', label: 'Rep metronome', hint: 'A click as each rep starts and a lower click at the turnaround' },
		{ key: 'beepFinish', cue: 'finish', label: 'Routine complete', hint: 'A short fanfare at the end' }
	] as const;

	function setTheme(v: string): void {
		settings.theme = v as Theme;
		saveAll();
	}

	function handleClearStreak(): void {
		if (confirm('Clear your streak history? Your streak, completed days and reserve days will be reset. This can’t be undone.')) {
			clearStreakHistory();
			refreshSnapshots();
		}
	}

	function handleSimulateStreak(days: number): void {
		simulateStreak(days);
		notify(`Simulated ${days}-day streak.`);
	}

	function handleSimulateBreak(): void {
		simulateBrokenStreak();
		notify('Simulated broken streak (missed yesterday).');
	}

	function handleAddFixer(): void {
		addTestFixer();
		notify('+1 reserve day added.');
	}

	function handleSeedTestRoutines(): void {
		seedTestRoutines();
		notify('Added 5-second test routines.');
	}
</script>

<svelte:head>
	<title>Settings · Stretch & Recovery</title>
</svelte:head>

<h1 class="page-title">Settings</h1>

<section class="set-section">
	<h2 class="section-label">Appearance</h2>
	<div class="card set-card">
		<div class="set-row">
			<span class="set-label">Theme</span>
			<Segmented
				label="Theme"
				value={settings.theme}
				onchange={setTheme}
				options={[
					{ value: 'light', label: 'Light' },
					{ value: 'dark', label: 'Dark' },
					{ value: 'system', label: 'Auto' }
				]}
			/>
		</div>
	</div>
</section>

<section class="set-section">
	<h2 class="section-label">Sounds</h2>
	<div class="card set-card">
		{#each cues as c (c.key)}
			<div class="set-row cue-row">
				<button class="icon-btn cue-play" onclick={() => playCue(c.cue)} aria-label={`Play the ${c.label.toLowerCase()} sound`} title="Preview">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>
				</button>
				<div class="cue-toggle">
					<Toggle bind:checked={settings[c.key]} onchange={saveAll} label={c.label} hint={c.hint} />
				</div>
			</div>
		{/each}
		<div class="set-row cue-row">
			<div class="cue-toggle">
				<Toggle
					bind:checked={settings.voiceCues}
					onchange={() => updateSettings({ voiceCues: settings.voiceCues })}
					label="Spoken cues"
					hint="Says each move, ‘switch sides’, ‘rest’ and counts every fifth rep"
				/>
			</div>
			<button class="btn small cue-test" onclick={() => speak('Switch sides')} aria-label="Test spoken cues">Test</button>
		</div>
		<div class="set-row cue-row">
			<div class="cue-toggle">
				<Toggle
					bind:checked={settings.vibrate}
					onchange={() => updateSettings({ vibrate: settings.vibrate })}
					label="Vibrate"
					hint="A short buzz as each move or rest starts (Android; iPhones ignore it)"
				/>
			</div>
			<button class="btn small cue-test" onclick={() => vibrate([80, 60, 80])} aria-label="Test vibration">Test</button>
		</div>
	</div>
</section>

<section class="set-section">
	<h2 class="section-label">Workouts</h2>
	<div class="card set-card">
		<div class="set-row">
			<Toggle
				bind:checked={settings.breaksEnabled}
				onchange={saveAll}
				label="Rest between stretches"
				hint="Turn off to skip every rest, in all routines"
			/>
		</div>
		{#if settings.breaksEnabled}
			<div class="set-row">
				<div class="set-text">
					<span class="set-label">Default rest</span>
					<span class="muted small">For new routines — each routine can change it</span>
				</div>
				<Stepper
					bind:value={settings.breakSeconds}
					min={0}
					max={120}
					step={5}
					label="Default rest"
					format={(v) => (v === 0 ? 'Off' : `${v}s`)}
					onchange={saveAll}
				/>
			</div>
		{/if}
	</div>
</section>

<section class="set-section">
	<h2 class="section-label">Tracking &amp; prompts</h2>
	<div class="card set-card">
		{#each optionalFeatures as f (f.key)}
			<div class="set-row">
				<Toggle bind:checked={settings[f.key]} onchange={saveAll} label={f.label} hint={f.hint} />
			</div>
		{/each}
	</div>
</section>

<section class="set-section">
	<h2 class="section-label">Reminders</h2>
	<div class="card set-card">
		{#if reminderAvailability === 'unsupported'}
			<div class="set-row">
				<div class="set-text">
					<span class="set-label">Daily reminder</span>
					<span class="muted small">Needs Chrome on Android with the app installed to your home screen.</span>
				</div>
			</div>
		{:else}
			<div class="set-row">
				<Toggle
					bind:checked={settings.reminderEnabled}
					onchange={toggleReminder}
					label="Daily reminder"
					hint={reminderAvailability === 'needs-install'
						? 'Install the app to your home screen to turn this on'
						: 'A nudge if you haven’t stretched yet that day'}
				/>
			</div>
			{#if settings.reminderEnabled}
				<div class="set-row">
					<div class="set-text">
						<span class="set-label">Remind me after</span>
						<span class="muted small">Android picks the exact moment, so it may come a little later</span>
					</div>
					<Stepper
						bind:value={settings.reminderHour}
						min={5}
						max={22}
						step={1}
						label="Remind me after"
						format={hourLabel}
						onchange={saveAll}
					/>
				</div>
			{/if}
		{/if}
	</div>
</section>

<section class="set-section">
	<h2 class="section-label">Backup &amp; data</h2>
	<div class="card set-card">
		<div class="set-row set-stack">
			<div class="set-text">
				<span class="set-label">Back up your routines</span>
				<span class="muted small">Saves routines, photos and streak history to one file — keep it in Drive, iCloud or your files.</span>
			</div>
			<div class="set-actions">
				<button class="btn primary small" onclick={handleCloudShare}>Save backup…</button>
				<label class="btn small">
					Restore from file
					<input class="sr-only" type="file" accept="application/json,.json" onchange={restoreBackup} />
				</label>
			</div>
		</div>

		{#if hasFileSystemAccessSupport()}
			<div class="set-row">
				<div class="set-text">
					<span class="set-label">Linked backup file</span>
					<span class="muted small">
						{fileBackupActive ? 'Linked — every change is saved to it' : 'Keep a file on disk always up to date'}
					</span>
				</div>
				<button class="btn small" class:danger={fileBackupActive} onclick={handleToggleFileAutoBackup}>
					{fileBackupActive ? 'Unlink' : 'Link file'}
				</button>
			</div>
		{/if}

		<div class="set-row">
			<Toggle
				bind:checked={settings.autoBackupOnFinish}
				onchange={saveAll}
				label="Back up after each workout"
				hint="Updates your linked file or saves a copy when you finish"
			/>
		</div>

		<div class="set-row">
			<div class="set-text">
				<span class="set-label">
					Protect from clean-up
					{#if isPersistent}<span class="ok-badge">On</span>{/if}
				</span>
				<span class="muted small">
					{isPersistent ? 'Your browser won’t clear this app’s data when space is low.' : 'Ask your browser not to clear this app’s data when space is low.'}
				</span>
			</div>
			{#if !isPersistent}
				<button class="btn small" onclick={togglePersistence}>Turn on</button>
			{/if}
		</div>

		<details class="set-row restore-points">
			<summary>
				<span class="set-text">
					<span class="set-label">Restore points</span>
					<span class="muted small">
						{snapshots.length === 0 ? 'Saved automatically as you make changes' : `${snapshots.length} saved · latest ${formatWhen(snapshots[0].timestamp)}`}
					</span>
				</span>
				<span class="chevron" aria-hidden="true">›</span>
			</summary>
			{#if snapshots.length === 0}
				<p class="muted small" style="margin: 0.4rem 0 0">Nothing yet.</p>
			{:else}
				<ul class="snapshot-list">
					{#each snapshots as snap (snap.id)}
						<li>
							<span class="set-text">
								<span class="snap-when">{formatWhen(snap.timestamp)}</span>
								<span class="muted small">
									{snap.routineCount} routine{snap.routineCount === 1 ? '' : 's'} · {snap.streakDays} streak day{snap.streakDays === 1 ? '' : 's'}
								</span>
							</span>
							<button class="btn small" onclick={() => handleRestoreSnapshot(snap)}>Restore</button>
						</li>
					{/each}
				</ul>
				<button class="btn ghost small danger-text" onclick={handleClearAllSnapshots}>Delete all restore points</button>
			{/if}
		</details>

		<div class="set-row">
			<div class="set-text">
				<span class="set-label">Streak history</span>
				<span class="muted small">
					{streak.completedDates.length} day{streak.completedDates.length === 1 ? '' : 's'} recorded
				</span>
			</div>
			<button
				class="btn small danger"
				onclick={handleClearStreak}
				disabled={streak.completedDates.length === 0 && streak.fixersUsed === 0}
			>
				Clear
			</button>
		</div>
	</div>
	<p class="muted small set-foot">🔒 Everything stays on this device. Nothing is uploaded unless you save a backup somewhere yourself.</p>
</section>

<section class="set-section">
	<h2 class="section-label">App</h2>
	<div class="card set-card">
		<a class="set-row set-link" href="/learn">
			<div class="set-text">
				<span class="set-label">Learn: what helps RSI and why</span>
				<span class="muted small">Short, plain-English notes on the thinking behind the routines</span>
			</div>
			<span class="muted" aria-hidden="true">›</span>
		</a>
		<div class="set-row">
			<div class="set-text">
				<span class="set-label">
					Install
					{#if pwa.isStandalone || pwa.isInstalled}<span class="ok-badge">Installed</span>{/if}
				</span>
				<span class="muted small">
					{#if pwa.isStandalone || pwa.isInstalled}
						Works offline from your home screen.
					{:else if pwa.deferredPrompt}
						Add it to your home screen — it works fully offline.
					{:else}
						Use your browser’s “Add to Home screen” or “Install app” option.
					{/if}
				</span>
			</div>
			{#if !pwa.isStandalone && !pwa.isInstalled && pwa.deferredPrompt}
				<button class="btn primary small" onclick={() => pwa.install()}>Install</button>
			{/if}
		</div>
		<div class="set-row">
			<Toggle
				bind:checked={settings.testingMode}
				onchange={saveAll}
				label="Developer tools"
				hint="Speed up timers and simulate streaks"
			/>
		</div>

		{#if settings.testingMode}
			<div class="set-row">
				<span class="set-label">Playback speed</span>
				<Segmented
					label="Playback speed"
					value={String(settings.playbackSpeed || 1)}
					onchange={(v) => {
						settings.playbackSpeed = Number(v);
						saveAll();
					}}
					options={[
						{ value: '1', label: '1×' },
						{ value: '5', label: '5×' },
						{ value: '10', label: '10×' },
						{ value: '30', label: '30×' }
					]}
				/>
			</div>
			<div class="set-row set-stack">
				<div class="set-text">
					<span class="set-label">Streak simulator</span>
					<span class="muted small">
						🔥 {currentStreakNum} day{currentStreakNum === 1 ? '' : 's'} · 🩹 {fixersAvailableNum} reserve day{fixersAvailableNum === 1 ? '' : 's'} ·
						{#if activeGap.length > 0}
							{activeGap.length} missed day{activeGap.length === 1 ? '' : 's'}{canRepair ? '' : ` (needs ${activeGap.length} reserve days)`}
						{:else}
							unbroken
						{/if}
					</span>
				</div>
				<div class="set-actions">
					<button class="btn small" onclick={() => handleSimulateStreak(7)}>7-day streak</button>
					<button class="btn small" onclick={handleSimulateBreak}>Miss a day</button>
					<button class="btn small" onclick={handleAddFixer}>+1 reserve day</button>
					{#if canRepair}
						<button
							class="btn small primary"
							onclick={() => {
								applyFixer();
								notify(`Streak repaired with ${activeGap.length} reserve day${activeGap.length === 1 ? '' : 's'}.`);
							}}
						>
							Repair
						</button>
					{/if}
					<button class="btn small" onclick={handleSeedTestRoutines}>Add test routines</button>
				</div>
			</div>
		{/if}
	</div>
	<p class="muted small set-foot">Stretch & Recovery · v{__APP_VERSION__}</p>
</section>

<style>
	.page-title {
		font-size: 1.45rem;
		font-weight: 800;
		margin: 0.2rem 0 0.4rem;
	}
	.set-section {
		margin-top: 1.1rem;
	}
	.set-section .section-label {
		margin: 0 0 0.4rem 0.2rem;
	}
	.set-card {
		padding: 0 1rem;
	}
	.set-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.9rem;
		min-height: 3.4rem;
		padding: 0.55rem 0;
	}
	.set-row + .set-row {
		border-top: 1px solid var(--border);
	}
	.set-row > :global(.toggle-row) {
		flex: 1;
		padding: 0.2rem 0;
	}
	.set-stack {
		flex-direction: column;
		align-items: stretch;
		padding: 0.8rem 0;
	}
	.set-text {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}
	.set-label {
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}
	.set-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}
	.set-foot {
		margin: 0.5rem 0.2rem 0;
		line-height: 1.45;
	}
	.ok-badge {
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--ok) 18%, transparent);
		color: var(--ok);
	}

	.cue-row {
		gap: 0.6rem;
	}
	.cue-play {
		flex-shrink: 0;
		width: 2.2rem;
		height: 2.2rem;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--surface-2);
		color: var(--accent);
	}
	.cue-test {
		flex-shrink: 0;
	}
	.set-link {
		text-decoration: none;
		color: inherit;
	}
	.cue-toggle {
		flex: 1;
		min-width: 0;
	}
	.cue-toggle :global(.toggle-row) {
		padding: 0.2rem 0;
	}

	.restore-points {
		display: block;
	}
	.restore-points summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.9rem;
		cursor: pointer;
		list-style: none;
		min-height: 2.3rem;
	}
	.restore-points summary::-webkit-details-marker {
		display: none;
	}
	.restore-points .chevron {
		transition: transform 0.15s;
	}
	.restore-points[open] .chevron {
		transform: rotate(90deg);
	}
	.snapshot-list {
		list-style: none;
		margin: 0.5rem 0 0.4rem;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.snapshot-list li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		padding: 0.45rem 0.65rem;
		border-radius: 10px;
		background: var(--surface-2);
	}
	.snap-when {
		font-weight: 600;
		font-size: 0.9rem;
	}
	.danger-text {
		color: var(--danger);
		padding-left: 0;
	}
</style>
