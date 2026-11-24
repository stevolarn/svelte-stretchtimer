<script lang="ts">
	import Modal from './Modal.svelte';
	import PhotoThumb from './PhotoThumb.svelte';
	import MuscleChips from './MuscleChips.svelte';
	import { musclesFor } from '$lib/muscles';
	import { stretchDurationLabel } from '$lib/timeline';
	import type { Stretch } from '$lib/types';

	/** Read-only look at one stretch: picture, dose, how to do it and muscles worked. */
	let { stretch, onclose }: { stretch: Stretch; onclose: () => void } = $props();
</script>

<Modal title={stretch.name || 'Untitled stretch'} subtitle={stretchDurationLabel(stretch)} {onclose} class="stretch-detail">
	<div class="detail-visual">
		<PhotoThumb photoId={stretch.photoId} iconKey={stretch.iconKey} name={stretch.name} size={220} rounded={16} />
	</div>
	{#if stretch.mode === 'reps' && stretch.load?.trim()}
		<p class="muted small detail-load">Load: {stretch.load.trim()}</p>
	{/if}
	{#if stretch.description}
		<p class="detail-desc">{stretch.description}</p>
	{/if}
	{#if musclesFor(stretch).length > 0}
		<div class="detail-muscles">
			<span class="muted small">Muscles worked</span>
			<MuscleChips muscles={musclesFor(stretch)} />
		</div>
	{/if}
	<button class="btn primary detail-done" onclick={onclose}>Done</button>
</Modal>

<style>
	.detail-visual {
		display: flex;
		justify-content: center;
		margin-bottom: 0.9rem;
	}
	.detail-load {
		margin: 0 0 0.4rem;
	}
	.detail-desc {
		margin: 0 0 0.9rem;
		line-height: 1.5;
	}
	.detail-muscles {
		display: grid;
		gap: 0.35rem;
		margin-bottom: 1rem;
	}
	.detail-done {
		width: 100%;
		font-weight: 700;
	}
</style>
