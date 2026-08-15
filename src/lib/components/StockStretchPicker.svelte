<script lang="ts">
	import { stockStretches } from '$lib/stockStretches';
	import type { StockCategory, StockStretch } from '$lib/types';
	import StretchIllustration from './StretchIllustration.svelte';

	let {
		onselect,
		oncustom,
		onclose
	}: {
		onselect: (stock: StockStretch) => void;
		oncustom: () => void;
		onclose: () => void;
	} = $props();

	let selectedCategory = $state<StockCategory>('all');
	let searchQuery = $state('');
	let previewStock = $state<StockStretch | null>(null);

	const categories: Array<{ id: StockCategory; label: string }> = [
		{ id: 'all', label: 'All Stretches' },
		{ id: 'upper-body', label: 'Upper Body' },
		{ id: 'spine', label: 'Spine & Core' },
		{ id: 'hips', label: 'Hips & Glutes' },
		{ id: 'legs', label: 'Legs & Calves' }
	];

	const filteredStretches = $derived(
		stockStretches.filter((s) => {
			const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
			const query = searchQuery.trim().toLowerCase();
			const matchesQuery = !query || s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query);
			return matchesCat && matchesQuery;
		})
	);

	function categoryLabel(cat: string): string {
		switch (cat) {
			case 'upper-body':
				return 'Upper Body';
			case 'spine':
				return 'Spine & Core';
			case 'hips':
				return 'Hips & Glutes';
			case 'legs':
				return 'Legs & Calves';
			default:
				return cat;
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="modal-backdrop" onclick={onclose}>
	<div class="modal-sheet stock-picker-sheet" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header">
			<div>
				<h2 style="font-size: 1.2rem; margin: 0">Add Stretch</h2>
				<p class="muted small" style="margin: 0.15rem 0 0">Tap a stretch to preview info, or tap ＋ Add</p>
			</div>
			<button class="icon-btn close-modal-btn" onclick={onclose} aria-label="Close">✕</button>
		</div>

		<div class="stock-picker-top">
			<button class="btn primary custom-blank-btn" onclick={oncustom}>
				＋ Create custom blank stretch
			</button>

			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search stretches (e.g. neck, lunge, fold)..."
				class="stock-search-input"
				aria-label="Search stretches"
			/>

			<div class="category-pills" role="tablist">
				{#each categories as cat}
					<button
						class="cat-pill"
						class:active={selectedCategory === cat.id}
						onclick={() => (selectedCategory = cat.id)}
						role="tab"
						aria-selected={selectedCategory === cat.id}
					>
						{cat.label}
					</button>
				{/each}
			</div>
		</div>

		<div class="stock-stretches-list">
			{#if filteredStretches.length === 0}
				<div class="muted small" style="text-align: center; padding: 2rem 0">
					No stretches found matching "{searchQuery}".
				</div>
			{:else}
				{#each filteredStretches as stock (stock.id)}
					<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
					<div class="stock-stretch-card" onclick={() => (previewStock = stock)}>
						<StretchIllustration iconKey={stock.iconKey} size={54} rounded={10} />
						<div class="stock-stretch-info">
							<div class="stock-title-row">
								<span class="stock-stretch-name">{stock.name}</span>
								<div class="row" style="gap: 0.35rem">
									<span class="badge">{stock.defaultSeconds}s</span>
									{#if stock.sides === 'two'}
										<span class="badge">L → R</span>
									{/if}
								</div>
							</div>
							<p class="stock-stretch-desc">{stock.description}</p>
						</div>
						<button
							class="btn small stock-add-btn"
							onclick={(e) => {
								e.stopPropagation();
								onselect(stock);
							}}
							aria-label={`Add ${stock.name}`}
						>
							＋ Add
						</button>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>

{#if previewStock}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="modal-backdrop preview-backdrop" onclick={() => (previewStock = null)}>
		<div class="modal-sheet preview-modal-sheet" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<div>
					<span class="badge" style="text-transform: uppercase; font-size: 0.72rem; margin-bottom: 0.2rem">
						{categoryLabel(previewStock.category)}
					</span>
					<h2 style="font-size: 1.3rem; margin: 0">{previewStock.name}</h2>
				</div>
				<button class="icon-btn close-modal-btn" onclick={() => (previewStock = null)} aria-label="Close">✕</button>
			</div>

			<div class="preview-content">
				<div class="preview-illustration-box">
					<StretchIllustration iconKey={previewStock.iconKey} size={220} rounded={16} />
				</div>

				<div class="preview-meta-row">
					<span class="badge">
						⏱ {previewStock.defaultSeconds}s {previewStock.sides === 'two' ? 'per side' : 'duration'}
					</span>
					<span class="badge">
						{previewStock.sides === 'two' ? 'Two sides (Left → Right)' : 'Single side'}
					</span>
				</div>

				<div class="preview-section">
					<span class="preview-section-title">Posture & Guidance</span>
					<p class="preview-desc">{previewStock.description}</p>
				</div>
			</div>

			<div class="preview-footer-actions">
				<button
					class="btn primary preview-add-btn"
					onclick={() => {
						if (previewStock) {
							onselect(previewStock);
							previewStock = null;
						}
					}}
				>
					＋ Add to Routine
				</button>
				<button class="btn ghost small" onclick={() => (previewStock = null)}>
					← Back to list
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.stock-picker-sheet {
		max-height: 85dvh;
		display: flex;
		flex-direction: column;
	}

	.stock-picker-top {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		flex-shrink: 0;
	}

	.custom-blank-btn {
		width: 100%;
		font-weight: 700;
	}

	.stock-search-input {
		width: 100%;
		padding: 0.55rem 0.8rem;
		font-size: 0.9rem;
	}

	.category-pills {
		display: flex;
		gap: 0.35rem;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		padding-bottom: 2px;
	}
	.category-pills::-webkit-scrollbar {
		display: none;
	}

	.cat-pill {
		flex: 0 0 auto;
		border: 1px solid var(--border);
		background: var(--surface-2);
		color: var(--muted);
		border-radius: 999px;
		padding: 0.25rem 0.65rem;
		font: inherit;
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		touch-action: manipulation;
		transition: background 0.12s, color 0.12s;
	}
	.cat-pill.active {
		background: var(--accent);
		border-color: var(--accent);
		color: #ffffff;
	}

	.stock-stretches-list {
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-right: 2px;
	}

	.stock-stretch-card {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 0.5rem 0.65rem;
		cursor: pointer;
		touch-action: manipulation;
		transition: background 0.12s, border-color 0.12s, transform 0.06s;
	}
	.stock-stretch-card:hover {
		background: var(--surface);
		border-color: var(--accent);
	}
	.stock-stretch-card:active {
		transform: scale(0.99);
	}

	.stock-stretch-info {
		flex: 1;
		min-width: 0;
	}

	.stock-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.4rem;
		margin-bottom: 0.15rem;
	}

	.stock-stretch-name {
		font-weight: 700;
		font-size: 0.92rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.stock-stretch-desc {
		font-size: 0.76rem;
		color: var(--muted);
		margin: 0;
		line-height: 1.35;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.stock-add-btn {
		font-weight: 700;
		padding-inline: 0.65rem;
		flex-shrink: 0;
	}

	/* ------------------ Detail Preview Modal ------------------ */
	.preview-backdrop {
		z-index: 1100;
	}

	.preview-modal-sheet {
		max-width: 440px;
		max-height: 90dvh;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.preview-content {
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.85rem;
		padding: 0.25rem 0;
	}

	.preview-illustration-box {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0.5rem 0;
	}

	.preview-meta-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
	}

	.preview-section {
		width: 100%;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 0.75rem 0.9rem;
	}

	.preview-section-title {
		display: block;
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted);
		margin-bottom: 0.35rem;
	}

	.preview-desc {
		margin: 0;
		font-size: 0.88rem;
		line-height: 1.45;
		color: var(--text);
	}

	.preview-footer-actions {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		flex-shrink: 0;
		margin-top: 0.25rem;
	}

	.preview-add-btn {
		width: 100%;
		font-weight: 700;
		padding: 0.75rem;
		font-size: 1rem;
	}
</style>
