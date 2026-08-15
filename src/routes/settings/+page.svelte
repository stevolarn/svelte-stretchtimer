<script lang="ts">
	import { playCue } from '$lib/audio';
	import { saveAll, settings } from '$lib/stores.svelte';
	import { type Theme } from '$lib/types';
	import Segmented from '$lib/components/Segmented.svelte';
	import Stepper from '$lib/components/Stepper.svelte';
	import Toggle from '$lib/components/Toggle.svelte';

	function test(kind: 'start' | 'side' | 'tick' | 'finish'): void {
		playCue(kind);
	}

	function setTheme(v: string): void {
		settings.theme = v as Theme;
		saveAll();
	}
</script>

<svelte:head>
	<title>Settings</title>
</svelte:head>

<h1 style="font-size: 1.3rem; margin-bottom: 0.75rem">Settings</h1>

<section class="card">
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
		<div class="row">
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

<p class="muted small" style="margin-top: 1rem">
	All data stays on this device — routines, photos, and streak history are stored locally and never sent anywhere.
</p>
