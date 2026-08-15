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
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="modal-backdrop" onclick={onclose}>
	<div class="modal-sheet stock-picker-sheet" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header">
			<div>
				<h2 style="font-size: 1.2rem; margin: 0">Add Stretch</h2>
				<p class="muted small" style="margin: 0.15rem 0 0">Choose a stock stretch or create a custom one</p>
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
					<div class="stock-stretch-card">
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
						<button class="btn small stock-add-btn" onclick={() => onselect(stock)}>
							＋ Add
						</button>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>

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
		transition: background 0.12s;
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
</style>
