<script lang="ts">
	let {
		checked = $bindable(false),
		label = '',
		hint = '',
		onchange
	}: {
		checked?: boolean;
		label?: string;
		hint?: string;
		onchange?: () => void;
	} = $props();
</script>

<label class="toggle-row">
	<span class="text">
		<strong>{label}</strong>
		{#if hint}<small>{hint}</small>{/if}
	</span>
	<button
		type="button"
		class="switch"
		class:on={checked}
		role="switch"
		aria-checked={checked}
		aria-label={label}
		onclick={() => {
			checked = !checked;
			onchange?.();
		}}
	>
		<span class="knob"></span>
	</button>
</label>

<style>
	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 0;
		cursor: pointer;
	}
	.text {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.text small {
		color: var(--muted);
	}
	.switch {
		flex: none;
		width: 3rem;
		height: 1.7rem;
		border-radius: 999px;
		border: none;
		background: var(--surface-2);
		border: 1px solid var(--border);
		position: relative;
		cursor: pointer;
		transition: background 0.15s;
	}
	.switch.on {
		background: var(--accent);
		border-color: var(--accent);
	}
	.knob {
		position: absolute;
		top: 0.15rem;
		left: 0.2rem;
		width: 1.2rem;
		height: 1.2rem;
		border-radius: 50%;
		background: #fff;
		transition: transform 0.15s;
	}
	.switch.on .knob {
		transform: translateX(1.3rem);
	}
</style>
