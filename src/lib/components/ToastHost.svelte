<script lang="ts">
	import { fly } from 'svelte/transition';
	import { dismissToast, runToastAction, toast } from '$lib/toast.svelte';

	let { raised = false }: { raised?: boolean } = $props();
</script>

<div class="toast-region" class:raised aria-live="polite">
	{#if toast.current}
		{#key toast.current.id}
			<div class="toast" role="status" transition:fly={{ y: 16, duration: 180 }}>
				<span class="toast-message">{toast.current.message}</span>
				{#if toast.current.action}
					<button class="toast-action" onclick={runToastAction}>{toast.current.action}</button>
				{/if}
				<button class="toast-close" onclick={dismissToast} aria-label="Dismiss">✕</button>
			</div>
		{/key}
	{/if}
</div>

<style>
	.toast-region {
		position: fixed;
		left: 0;
		right: 0;
		bottom: calc(1rem + env(safe-area-inset-bottom));
		z-index: 80;
		display: flex;
		justify-content: center;
		padding: 0 0.9rem;
		pointer-events: none;
	}
	.toast-region.raised {
		bottom: calc(5rem + env(safe-area-inset-bottom));
	}
	@media (min-width: 601px) {
		.toast-region.raised {
			bottom: calc(1.5rem + env(safe-area-inset-bottom));
		}
	}
	.toast {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: 0.35rem;
		max-width: 480px;
		width: 100%;
		background: var(--text);
		color: var(--bg);
		border-radius: 14px;
		padding: 0.45rem 0.45rem 0.45rem 1rem;
		box-shadow: var(--shadow-lg);
		font-size: 0.92rem;
	}
	.toast-message {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.toast-action,
	.toast-close {
		background: none;
		border: none;
		color: inherit;
		font: inherit;
		cursor: pointer;
		border-radius: 9px;
		min-height: 36px;
	}
	.toast-action {
		font-weight: 800;
		color: var(--accent);
		padding: 0 0.75rem;
		filter: brightness(1.15);
	}
	.toast-close {
		opacity: 0.6;
		padding: 0 0.6rem;
	}
	.toast-action:hover,
	.toast-close:hover {
		background: color-mix(in srgb, var(--bg) 14%, transparent);
	}
</style>
