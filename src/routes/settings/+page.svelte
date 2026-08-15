<script lang="ts">
	import { onMount } from 'svelte';
	import { playCue } from '$lib/audio';
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
		streak
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
	import Segmented from '$lib/components/Segmented.svelte';
	import Stepper from '$lib/components/Stepper.svelte';
	import Toggle from '$lib/components/Toggle.svelte';

	let isPersistent = $state(false);
	let fileBackupActive = $state(false);
	let snapshots = $state<StorageSnapshot[]>([]);
	let backupStatus = $state('');
	let testStatus = $state('');

	const currentStreakNum = $derived(currentStreak(streak));
	const fixersAvailableNum = $derived(fixersAvailable(streak));
	const activeGap = $derived(repairGap(streak));
	const canRepair = $derived(canRepairStreak(streak));

	onMount(async () => {
		isPersistent = await checkStoragePersistence();
		fileBackupActive = isFileAutoBackupConnected();
		refreshSnapshots();
	});

	function refreshSnapshots(): void {
		snapshots = loadSnapshots();
	}

	async function togglePersistence(): Promise<void> {
		if (isPersistent) return;
		isPersistent = await requestPersistentStorage();
		backupStatus = isPersistent ? 'Storage is now permanently protected from browser eviction.' : 'Persistent storage could not be granted.';
	}

	async function handleCloudShare(): Promise<void> {
		const res = await shareToCloudOrDrive();
		if (res.success) {
			backupStatus = res.method === 'share' ? 'Backup shared successfully (e.g. to Google Drive).' : 'Backup downloaded to device.';
		}
	}

	async function handleToggleFileAutoBackup(): Promise<void> {
		if (fileBackupActive) {
			disconnectFileAutoBackup();
			fileBackupActive = false;
			backupStatus = 'Auto-save to file disconnected.';
		} else {
			const ok = await connectFileAutoBackup();
			fileBackupActive = ok;
			backupStatus = ok ? 'Connected to local/drive backup file. Auto-saving enabled!' : 'Could not link backup file.';
		}
	}

	function handleRestoreSnapshot(snap: StorageSnapshot): void {
		if (confirm(`Restore snapshot from ${new Date(snap.timestamp).toLocaleTimeString()} (${snap.routineCount} routines, ${snap.streakDays} streak days)? Current unsaved changes will be replaced.`)) {
			restoreFromSnapshot(snap);
			refreshSnapshots();
			backupStatus = 'Snapshot restored successfully.';
		}
	}

	function handleClearAllSnapshots(): void {
		if (confirm('Clear all auto-saved snapshots?')) {
			clearSnapshots();
			refreshSnapshots();
			backupStatus = 'Snapshots cleared.';
		}
	}

	async function downloadBackup(): Promise<void> {
		const blob = new Blob([await exportBackup()], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `stretch-timer-backup-${new Date().toISOString().slice(0, 10)}.json`;
		link.click();
		URL.revokeObjectURL(url);
		backupStatus = 'Backup file downloaded.';
	}

	async function restoreBackup(event: Event): Promise<void> {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		try {
			const result = await importBackup(await file.text());
			backupStatus = `${result.added} routine${result.added === 1 ? '' : 's'} restored.`;
			refreshSnapshots();
		} catch (error) {
			backupStatus = error instanceof Error ? error.message : 'Could not restore backup.';
		} finally {
			input.value = '';
		}
	}

	function test(kind: 'start' | 'side' | 'tick' | 'finish'): void {
		playCue(kind);
	}

	function setTheme(v: string): void {
		settings.theme = v as Theme;
		saveAll();
	}

	function handleClearStreak(): void {
		if (confirm('Clear all streak history? This will reset your streak count, completed days, and fixer history.')) {
			clearStreakHistory();
			refreshSnapshots();
		}
	}

	function handleSimulateStreak(days: number): void {
		simulateStreak(days);
		testStatus = `Simulated ${days}-day streak.`;
	}

	function handleSimulateBreak(): void {
		simulateBrokenStreak();
		testStatus = 'Simulated broken streak (missed yesterday).';
	}

	function handleAddFixer(): void {
		addTestFixer();
		testStatus = '+1 streak fixer added.';
	}

	function handleSeedTestRoutines(): void {
		seedTestRoutines();
		testStatus = 'Added 5s test routines to routines list.';
	}
</script>

<svelte:head>
	<title>Settings</title>
</svelte:head>

<h1 style="font-size: 1.3rem; margin-bottom: 0.75rem">Settings</h1>

<section class="card" style="margin-bottom: 0.85rem">
	<div class="settings-group">
		<h3>Appearance</h3>
		<div class="row" style="justify-content: space-between">
			<span style="font-weight: 600">Theme</span>
			<Segmented
				value={settings.theme}
				onchange={setTheme}
				options={[
					{ value: 'light', label: 'Light' },
					{ value: 'dark', label: 'Dark' },
					{ value: 'system', label: 'System' }
				]}
			/>
		</div>
	</div>

	<div class="settings-group">
		<h3>Audible cues</h3>
		<Toggle
			bind:checked={settings.beepStart}
			onchange={saveAll}
			label="Stretch start"
			hint="Beep when each stretch begins"
		/>
		<Toggle
			bind:checked={settings.beepSideSwitch}
			onchange={saveAll}
			label="Side switch"
			hint="Beep when switching Left → Right"
		/>
		<Toggle
			bind:checked={settings.beepCountdown}
			onchange={saveAll}
			label="Last 3 seconds"
			hint="Ticks during the final seconds of each stretch and break"
		/>
		<Toggle
			bind:checked={settings.beepFinish}
			onchange={saveAll}
			label="Finish"
			hint="Fanfare when the routine completes"
		/>
		<div class="row" style="margin-top: 0.4rem">
			<button class="btn small" onclick={() => test('start')}>▶ start</button>
			<button class="btn small" onclick={() => test('side')}>▶ side</button>
			<button class="btn small" onclick={() => test('tick')}>▶ tick</button>
			<button class="btn small" onclick={() => test('finish')}>▶ finish</button>
		</div>
	</div>

	<div class="settings-group">
		<h3>Breaks</h3>
		<Toggle bind:checked={settings.breaksEnabled} onchange={saveAll} label="Breaks between stretches" />
		{#if settings.breaksEnabled}
			<div class="row" style="justify-content: space-between; padding: 0.4rem 0">
				<span style="font-weight: 600">Break length</span>
				<Stepper bind:value={settings.breakSeconds} min={0} step={5} onchange={saveAll} />
			</div>
		{/if}
	</div>
</section>

<!-- Storage & Cloud Backups -->
<section class="card" style="margin-bottom: 0.85rem">
	<div class="settings-group">
		<h3>Storage & Durability</h3>
		<div class="spread" style="padding: 0.2rem 0">
			<div>
				<div style="font-weight: 600; display: flex; align-items: center; gap: 0.4rem">
					<span>Storage Persistence</span>
					<span class="badge" style="background: {isPersistent ? 'var(--ok)' : 'var(--surface-2)'}; color: {isPersistent ? '#fff' : 'var(--muted)'}">
						{isPersistent ? '🔒 Protected' : 'Standard'}
					</span>
				</div>
				<p class="muted small" style="margin: 0.2rem 0 0">
					{isPersistent
						? 'Storage is protected: your browser will never purge this app’s data under storage pressure.'
						: 'Request persistent storage so your browser never evicts routines or streak history.'}
				</p>
			</div>
			{#if !isPersistent}
				<button class="btn small primary" onclick={togglePersistence}>Lock Storage</button>
			{/if}
		</div>
	</div>

	<div class="settings-group">
		<h3>Automated & Cloud Backups</h3>
		<p class="muted small" style="margin: 0.1rem 0 0.6rem">
			Save your routines and photos to Google Drive or local disk so you never lose your data.
		</p>
		<div class="row" style="gap: 0.5rem; margin-bottom: 0.6rem">
			<button class="btn small primary" onclick={handleCloudShare} title="Open system share sheet with Google Drive">
				📤 Save to Google Drive / Files
			</button>
			<button class="btn small" onclick={downloadBackup}>⇩ Download JSON</button>
			<label class="btn small">
				⇧ Restore Backup
				<input class="sr-only" type="file" accept="application/json,.json" onchange={restoreBackup} />
			</label>
		</div>

		{#if hasFileSystemAccessSupport()}
			<div class="spread" style="padding: 0.35rem 0; border-top: 1px dashed var(--border); margin-top: 0.4rem">
				<div>
					<span style="font-weight: 600">Auto-save to Linked File</span>
					<div class="muted small">
						{fileBackupActive ? '✓ Connected — auto-saving every routine update' : 'Link a file on disk or Drive sync folder'}
					</div>
				</div>
				<button class="btn small" class:danger={fileBackupActive} onclick={handleToggleFileAutoBackup}>
					{fileBackupActive ? 'Disconnect File' : 'Link Backup File'}
				</button>
			</div>
		{/if}

		<Toggle
			bind:checked={settings.autoBackupOnFinish}
			onchange={saveAll}
			label="Auto-backup on routine completion"
			hint="Automatically triggers backup sync when you finish a workout"
		/>

		{#if backupStatus}
			<p class="muted small" style="color: var(--accent); margin: 0.4rem 0 0" role="status">{backupStatus}</p>
		{/if}
	</div>

	<div class="settings-group">
		<div class="spread">
			<span style="font-weight: 600">Local Auto-Snapshots</span>
			{#if snapshots.length > 0}
				<button class="icon-btn small" onclick={handleClearAllSnapshots} title="Clear snapshots">✕ Clear</button>
			{/if}
		</div>
		<p class="muted small" style="margin: 0.15rem 0 0.5rem">
			Automatic rolling restore points saved whenever routines change.
		</p>

		{#if snapshots.length === 0}
			<div class="muted small" style="padding: 0.4rem 0">No auto-snapshots yet.</div>
		{:else}
			<div class="snapshots-list">
				{#each snapshots as snap (snap.id)}
					<div class="snapshot-item">
						<div>
							<div style="font-weight: 600; font-size: 0.88rem">
								{new Date(snap.timestamp).toLocaleDateString()} {new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
							</div>
							<div class="muted small">
								{snap.routineCount} routine{snap.routineCount === 1 ? '' : 's'} · {snap.streakDays} streak day{snap.streakDays === 1 ? '' : 's'}
							</div>
						</div>
						<button class="btn small" onclick={() => handleRestoreSnapshot(snap)}>Restore</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="settings-group">
		<div class="spread" style="padding: 0.2rem 0">
			<div>
				<div style="font-weight: 600">Reset Streak History</div>
				<div class="muted small">
					{streak.completedDates.length} day{streak.completedDates.length === 1 ? '' : 's'} recorded
				</div>
			</div>
			<button
				class="btn small danger"
				onclick={handleClearStreak}
				disabled={streak.completedDates.length === 0 && streak.fixersUsed === 0}
			>
				Clear streak
			</button>
		</div>
	</div>
</section>

<!-- Testing Mode Suite -->
<section class="card">
	<div class="settings-group">
		<div class="spread">
			<div>
				<h3 style="margin: 0">Testing Mode</h3>
				<p class="muted small" style="margin: 0.15rem 0 0">
					Tools for testing timers, speed multipliers, audio cues, and streak mechanics.
				</p>
			</div>
			<Toggle bind:checked={settings.testingMode} onchange={saveAll} label="" />
		</div>
	</div>

	{#if settings.testingMode}
		<div class="settings-group">
			<div class="spread" style="padding: 0.2rem 0">
				<div>
					<span style="font-weight: 600">Default Playback Speed</span>
					<div class="muted small">Fast-forward timer playback for testing</div>
				</div>
				<Segmented
					value={String(settings.playbackSpeed || 1)}
					onchange={(v) => {
						settings.playbackSpeed = Number(v);
						saveAll();
					}}
					options={[
						{ value: '1', label: '1x' },
						{ value: '5', label: '5x' },
						{ value: '10', label: '10x' },
						{ value: '30', label: '30x' }
					]}
				/>
			</div>
		</div>

		<div class="settings-group">
			<span style="font-weight: 600; display: block; margin-bottom: 0.35rem">Streak & Fixer Simulator</span>
			<div class="row" style="gap: 0.4rem; margin-bottom: 0.5rem">
				<button class="btn small" onclick={() => handleSimulateStreak(7)}>🔥 Simulate 7-day streak</button>
				<button class="btn small" onclick={handleSimulateBreak}>💔 Simulate missed day</button>
				<button class="btn small" onclick={handleAddFixer}>🩹 Add +1 Fixer</button>
			</div>

			<div class="snapshot-item" style="margin-top: 0.3rem">
				<div>
					<div style="font-weight: 600; font-size: 0.85rem">
						Current: 🔥 {currentStreakNum} days · 🩹 {fixersAvailableNum} fixer{fixersAvailableNum === 1 ? '' : 's'}
					</div>
					<div class="muted small">
						{#if activeGap.length > 0}
							Broken gap: {activeGap.length === 1 ? activeGap[0] : `${activeGap.length} days (${activeGap[0]} to ${activeGap[activeGap.length - 1]})`}
							{#if !canRepair}
								(needs {activeGap.length} fixers)
							{/if}
						{:else}
							Streak is unbroken
						{/if}
					</div>
				</div>
				{#if canRepair}
					<button
						class="btn small primary"
						onclick={() => {
							applyFixer();
							testStatus = `Streak repaired with ${activeGap.length} fixer${activeGap.length === 1 ? '' : 's'}!`;
						}}
					>
						🩹 Repair ({activeGap.length})
					</button>
				{/if}
			</div>
		</div>

		<div class="settings-group">
			<span style="font-weight: 600; display: block; margin-bottom: 0.35rem">Test Routines Seeder</span>
			<div class="row" style="gap: 0.4rem">
				<button class="btn small" onclick={handleSeedTestRoutines}>🧪 Add 5s Test Routines</button>
			</div>
			{#if testStatus}
				<p class="muted small" style="color: var(--accent); margin: 0.4rem 0 0" role="status">{testStatus}</p>
			{/if}
		</div>
	{/if}
</section>

<p class="muted small" style="margin-top: 1rem">
	All data stays on this device — routines, photos, and streak history are stored locally and never sent anywhere.
</p>
