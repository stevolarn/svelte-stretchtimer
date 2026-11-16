<script lang="ts" module>
	/** Open modals; the body scroll lock is released only when the last one closes. */
	let openCount = 0;
</script>

<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	let {
		title,
		subtitle,
		onclose,
		class: extraClass = '',
		header,
		children
	}: {
		title?: string;
		subtitle?: string;
		onclose: () => void;
		class?: string;
		/** Replaces the default title/subtitle block. */
		header?: Snippet;
		children: Snippet;
	} = $props();

	const titleId = $props.id();
	let sheet: HTMLDivElement;

	onMount(() => {
		const previous = document.activeElement as HTMLElement | null;
		openCount++;
		document.body.style.overflow = 'hidden';
		sheet.focus({ preventScroll: true });
		return () => {
			if (--openCount === 0) document.body.style.overflow = '';
			if (previous?.isConnected) previous.focus({ preventScroll: true });
		};
	});

	function onkeydown(event: KeyboardEvent): void {
		// Only the topmost sheet reacts, so stacked modals close one at a time.
		const sheets = document.querySelectorAll('.modal-sheet');
		if (event.key === 'Escape' && sheets[sheets.length - 1] === sheet) {
			event.stopPropagation();
			onclose();
		}
	}
</script>

<svelte:window {onkeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="modal-backdrop" onclick={onclose}>
	<div
		bind:this={sheet}
		class="modal-sheet {extraClass}"
		role="dialog"
		aria-modal="true"
		aria-labelledby={title || header ? titleId : undefined}
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
	>
		<div class="modal-header">
			<div id={titleId} class="modal-title-block">
				{#if header}
					{@render header()}
				{:else}
					<h2 class="modal-title">{title}</h2>
					{#if subtitle}<p class="muted small modal-subtitle">{subtitle}</p>{/if}
				{/if}
			</div>
			<button class="icon-btn close-modal-btn" onclick={onclose} aria-label="Close">✕</button>
		</div>
		{@render children()}
	</div>
</div>

<style>
	.modal-sheet:focus {
		outline: none;
	}
	.modal-title-block {
		min-width: 0;
	}
	.modal-title {
		font-size: 1.15rem;
	}
	.modal-subtitle {
		margin: 0.15rem 0 0;
	}
</style>
