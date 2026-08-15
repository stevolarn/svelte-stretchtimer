<script lang="ts">
	import { getPhotoData } from '$lib/storage';
	import StretchIllustration from '$lib/components/StretchIllustration.svelte';

	let {
		photoId = null,
		iconKey,
		name,
		size = 44,
		rounded = 8
	}: {
		photoId?: string | null;
		iconKey?: string;
		name?: string;
		size?: number;
		rounded?: number;
	} = $props();

	let url = $state<string | null>(null);

	$effect(() => {
		let cancelled = false;
		url = null;
		if (photoId) {
			getPhotoData(photoId)
				.then((d) => {
					if (!cancelled && d) url = d;
				})
				.catch(() => {});
		}
		return () => {
			cancelled = true;
		};
	});
</script>

{#if url}
	<img
		class="thumb-sm"
		src={url}
		alt={name || 'Stretch photo'}
		style="width: {size}px; height: {Math.round(size * 0.8)}px; border-radius: {rounded}px; object-fit: cover;"
	/>
{:else}
	<StretchIllustration {iconKey} {name} {size} {rounded} />
{/if}
