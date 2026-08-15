<script lang="ts">
		import { getPhotoData } from '$lib/storage';

	let { photoId }: { photoId: string | null } = $props();

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
	<img class="thumb-sm" src={url} alt="" />
{:else}
	<span class="thumb-ph">📷</span>
{/if}
