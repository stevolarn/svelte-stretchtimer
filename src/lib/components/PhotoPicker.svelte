<script lang="ts">
		import { deletePhotoData, downscaleImage, getPhotoData, savePhotoData } from '$lib/storage';
	import { uid } from '$lib/util';

	let {
		photoId,
		onphoto
	}: {
		photoId: string | null;
		/** Called with the new photo id (or null when removed). */
		onphoto: (id: string | null) => void;
	} = $props();

	let url = $state<string | null>(null);
	let busy = $state(false);

	$effect(() => {
		let cancelled = false;
		url = null;
		if (photoId) {
			getPhotoData(photoId)
				.then((data) => {
					if (!cancelled && data) url = data;
				})
				.catch(() => {});
		}
		return () => {
			cancelled = true;
		};
	});

	async function choose(e: Event): Promise<void> {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		busy = true;
		try {
			const dataUrl = await downscaleImage(file);
			const id = uid();
			await savePhotoData(id, dataUrl);
			if (photoId) void deletePhotoData(photoId).catch(() => {});
			onphoto(id);
		} catch {
			// keep the previous photo on failure
		} finally {
			busy = false;
			input.value = '';
		}
	}

	function remove(): void {
		if (photoId) {
			void deletePhotoData(photoId).catch(() => {});
			onphoto(null);
		}
	}
</script>

<div class="photo-picker">
	{#if url}
		<img src={url} alt="" class="thumb" />
	{:else}
		<div class="placeholder">📷</div>
	{/if}
	<div class="actions">
		<label class="btn small">
			{busy ? '…' : photoId ? 'Replace' : 'Add photo'}
			<input type="file" accept="image/*" class="hidden" onchange={choose} disabled={busy} />
		</label>
		{#if photoId}
			<button type="button" class="btn small ghost" onclick={remove}>Remove</button>
		{/if}
	</div>
</div>

<style>
	.photo-picker {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: flex-start;
	}
	.thumb {
		width: 5.5rem;
		height: 5.5rem;
		object-fit: cover;
		border-radius: 12px;
		border: 1px solid var(--border);
	}
	.placeholder {
		width: 5.5rem;
		height: 5.5rem;
		border-radius: 12px;
		border: 1px dashed var(--border);
		display: grid;
		place-items: center;
		font-size: 1.6rem;
		color: var(--muted);
		background: var(--surface-2);
	}
	.actions {
		display: flex;
		gap: 0.4rem;
		align-items: center;
	}
	.hidden {
		display: none;
	}
</style>
