<script lang="ts">
	import Modal from './Modal.svelte';
	import { stockStretches } from '$lib/stockStretches';
	import type { BodyArea, MovementPosition, MovementType, StockStretch } from '$lib/types';
	import StretchIllustration from './StretchIllustration.svelte';
	import MuscleChips from './MuscleChips.svelte';
	import { musclesFor } from '$lib/muscles';
	import {
		equipmentLabels,
		equipmentOf,
		focusLabels,
		focusOf,
		searchText,
		type Equipment,
		type Focus
	} from '$lib/stockTags';

	let {
		onselect,
		oncustom,
		onclose
	}: {
		onselect: (stock: StockStretch) => void;
		oncustom: () => void;
		onclose: () => void;
	} = $props();

	/** how many times each stock stretch was added while the picker has been open */
	let addedCounts = $state<Record<string, number>>({});

	function add(stock: StockStretch): void {
		addedCounts[stock.id] = (addedCounts[stock.id] ?? 0) + 1;
		onselect(stock);
	}

	let selectedType = $state<MovementType>('all');
	let selectedPosition = $state<MovementPosition>('all');
	let selectedArea = $state<BodyArea>('all');
	let selectedFocus = $state<Focus | 'all'>('all');
	let selectedEquipment = $state<Equipment | 'all'>('all');
	let sortBy = $state<'library' | 'name' | 'shortest'>('library');
	let showMoreFilters = $state(false);
	let searchQuery = $state('');
	let filterSection = $state<HTMLElement>();

	// Rows scroll sideways, so bring chosen pills back into view when the extra rows open.
	$effect(() => {
		if (!showMoreFilters || !filterSection) return;
		for (const pill of filterSection.querySelectorAll<HTMLElement>('.cat-pill.active')) {
			const row = pill.parentElement!;
			row.scrollLeft = pill.offsetLeft - row.offsetLeft - 8;
		}
	});
	let previewStock = $state<StockStretch | null>(null);

	const typeFilters: Array<{ id: MovementType; label: string }> = [
		{ id: 'all', label: 'All Types' },
		{ id: 'static', label: 'Static' },
		{ id: 'dynamic', label: 'Dynamic' },
		{ id: 'mobility', label: 'Mobility' },
		{ id: 'yoga', label: 'Yoga' },
		{ id: 'isometrics', label: 'Isometrics' },
		{ id: 'eccentrics', label: 'Eccentrics' },
		{ id: 'calisthenics', label: 'Calisthenics' },
		{ id: 'cardio', label: 'Cardio' }
	];

	const positionFilters: Array<{ id: MovementPosition; label: string }> = [
		{ id: 'all', label: 'All Positions' },
		{ id: 'standing', label: 'Standing 🧍' },
		{ id: 'seated', label: 'Seated 🧘' },
		{ id: 'floor', label: 'Floor 🧎' }
	];

	const areaFilters: Array<{ id: BodyArea; label: string }> = [
		{ id: 'all', label: 'All Areas' },
		{ id: 'upper-body', label: 'Upper Body' },
		{ id: 'spine', label: 'Spine & Core' },
		{ id: 'hips', label: 'Hips & Glutes' },
		{ id: 'legs', label: 'Legs & Calves' },
		{ id: 'full-body', label: 'Full Body' }
	];

	const focusFilters: Array<{ id: Focus | 'all'; label: string }> = [
		{ id: 'all', label: 'Everything' },
		...(Object.entries(focusLabels) as Array<[Focus, string]>).map(([id, label]) => ({ id, label }))
	];

	const equipmentFilters: Array<{ id: Equipment | 'all'; label: string }> = [
		{ id: 'all', label: 'Any' },
		...(Object.entries(equipmentLabels) as Array<[Equipment, string]>).map(([id, label]) => ({ id, label }))
	];

	/** Filters tucked behind "More filters"; counted on its button so hidden ones aren't forgotten. */
	const hiddenFilterCount = $derived(
		[selectedType, selectedPosition, selectedArea, selectedEquipment].filter((v) => v !== 'all').length
	);

	const hasActiveFilters = $derived(
		hiddenFilterCount > 0 || selectedFocus !== 'all' || searchQuery.trim().length > 0
	);

	function resetFilters() {
		selectedType = 'all';
		selectedPosition = 'all';
		selectedArea = 'all';
		selectedFocus = 'all';
		selectedEquipment = 'all';
		searchQuery = '';
	}

	const filteredStretches = $derived.by(() => {
		// Every word must appear somewhere, so "wrist band hold" narrows instead of widening.
		const words = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
		const hits = stockStretches.filter((s) => {
			if (selectedType !== 'all' && s.type !== selectedType) return false;
			if (selectedPosition !== 'all' && s.position !== selectedPosition) return false;
			if (selectedArea !== 'all' && s.area !== selectedArea && s.category !== selectedArea) return false;
			if (selectedFocus !== 'all' && !focusOf(s).includes(selectedFocus)) return false;
			if (selectedEquipment !== 'all' && !equipmentOf(s).includes(selectedEquipment)) return false;
			if (!words.length) return true;
			const haystack = searchText(s);
			return words.every((w) => haystack.includes(w));
		});

		if (sortBy === 'name') return [...hits].sort((a, b) => a.name.localeCompare(b.name));
		if (sortBy === 'shortest') return [...hits].sort((a, b) => a.defaultSeconds - b.defaultSeconds);
		if (!words.length) return hits;
		// Rank words found in the name above ones that only turn up in the cues.
		const score = (s: StockStretch) => {
			const name = s.name.toLowerCase();
			const tags = [...focusOf(s).map((f) => focusLabels[f]), ...equipmentOf(s).map((e) => equipmentLabels[e]), s.type]
				.join(' ')
				.toLowerCase();
			return words.reduce((n, w) => n + (name.includes(w) ? 3 : tags.includes(w) ? 2 : 0), 0);
		};
		const scores = new Map(hits.map((s) => [s.id, score(s)]));
		return [...hits].sort((a, b) => scores.get(b.id)! - scores.get(a.id)!);
	});

	/** Duration for holds, rep count for rep-based moves. */
	function amountLabel(s: StockStretch): string {
		return s.defaultReps ? `${s.defaultReps} reps` : `${s.defaultSeconds}s`;
	}

	function formatLabel(val: string): string {
		switch (val) {
			case 'upper-body':
				return 'Upper Body';
			case 'spine':
				return 'Spine & Core';
			case 'hips':
				return 'Hips & Glutes';
			case 'legs':
				return 'Legs & Calves';
			case 'full-body':
				return 'Full Body';
			case 'isometrics':
				return 'Isometric';
			case 'eccentrics':
				return 'Eccentric';
			case 'calisthenics':
				return 'Calisthenic';
			default:
				return val.charAt(0).toUpperCase() + val.slice(1);
		}
	}
</script>

<Modal title="Add a stretch" subtitle="Pick from the library or create your own" class="stock-picker-sheet" {onclose}>
		<div class="stock-picker-top">
			<button class="btn primary custom-blank-btn" onclick={oncustom}>
				＋ Create custom blank stretch
			</button>

			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search e.g. wrist, band, neck, hold..."
				class="stock-search-input"
				aria-label="Search movements"
			/>

			<!-- Multi-dimensional Filter Groups -->
			<div class="filter-section" bind:this={filterSection}>
				<div class="filter-row-wrap">
					<span class="filter-group-label">Focus:</span>
					<div class="category-pills wrap" role="group" aria-label="Body focus">
						{#each focusFilters as ff (ff.id)}
							<button
								class="cat-pill"
								class:active={selectedFocus === ff.id}
								onclick={() => (selectedFocus = ff.id)}
								aria-pressed={selectedFocus === ff.id}
							>
								{ff.label}
							</button>
						{/each}
					</div>
				</div>

				{#if showMoreFilters}
					<div class="filter-row-wrap">
						<span class="filter-group-label">Type:</span>
						<div class="category-pills" role="group">
							{#each typeFilters as tf}
								<button
									class="cat-pill"
									class:active={selectedType === tf.id}
									onclick={() => (selectedType = tf.id)}
									
									aria-pressed={selectedType === tf.id}
								>
									{tf.label}
								</button>
							{/each}
						</div>
					</div>

					<div class="filter-row-wrap">
						<span class="filter-group-label">Position:</span>
						<div class="category-pills" role="group">
							{#each positionFilters as pf}
								<button
									class="cat-pill"
									class:active={selectedPosition === pf.id}
									onclick={() => (selectedPosition = pf.id)}
									
									aria-pressed={selectedPosition === pf.id}
								>
									{pf.label}
								</button>
							{/each}
						</div>
					</div>

					<div class="filter-row-wrap">
						<span class="filter-group-label">Area:</span>
						<div class="category-pills" role="group">
							{#each areaFilters as af}
								<button
									class="cat-pill"
									class:active={selectedArea === af.id}
									onclick={() => (selectedArea = af.id)}
									
									aria-pressed={selectedArea === af.id}
								>
									{af.label}
								</button>
							{/each}
						</div>
					</div>

					<div class="filter-row-wrap">
						<span class="filter-group-label">Kit:</span>
						<div class="category-pills" role="group" aria-label="Equipment">
							{#each equipmentFilters as ef (ef.id)}
								<button
									class="cat-pill"
									class:active={selectedEquipment === ef.id}
									onclick={() => (selectedEquipment = ef.id)}
									aria-pressed={selectedEquipment === ef.id}
								>
									{ef.label}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<div class="filter-tools">
					<button
						class="more-filters-btn"
						onclick={() => (showMoreFilters = !showMoreFilters)}
						aria-expanded={showMoreFilters}
					>
						{showMoreFilters ? '▴ Fewer filters' : '▾ More filters'}{hiddenFilterCount ? ` (${hiddenFilterCount})` : ''}
					</button>
					<label class="sort-label">
						Sort
						<select bind:value={sortBy} class="sort-select">
							<option value="library">Suggested</option>
							<option value="name">A–Z</option>
							<option value="shortest">Shortest first</option>
						</select>
					</label>
				</div>
			</div>

			<!-- Filter Results Bar -->
			<div class="filter-status-bar">
				<span class="muted small">
					Showing {filteredStretches.length} movement{filteredStretches.length === 1 ? '' : 's'}
				</span>
				{#if hasActiveFilters}
					<button class="reset-filter-btn" onclick={resetFilters}>
						✕ Reset filters
					</button>
				{/if}
			</div>
		</div>

		<div class="stock-stretches-list">
			{#if filteredStretches.length === 0}
				<div class="no-results-box">
					<p class="muted small" style="margin-bottom: 0.5rem">
						No movements match your current filter combination.
					</p>
					<button class="btn small ghost" onclick={resetFilters}>
						Clear all filters
					</button>
				</div>
			{:else}
				{#each filteredStretches as stock (stock.id)}
					<div
						class="stock-stretch-card"
						role="button"
						tabindex="0"
						aria-label={`${stock.name} — show details`}
						onclick={() => (previewStock = stock)}
						onkeydown={(e) => {
							if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
								e.preventDefault();
								previewStock = stock;
							}
						}}
					>
						<StretchIllustration iconKey={stock.iconKey} size={56} rounded={10} />
						<div class="stock-stretch-info">
							<div class="stock-title-row">
								<span class="stock-stretch-name">{stock.name}</span>
							</div>
							<div class="stock-tag-row">
								<span class="micro-tag time-tag">{amountLabel(stock)}{stock.sides === 'two' ? ' · L → R' : ''}</span>
								<span class="micro-tag type-tag">{formatLabel(stock.type)}</span>
								<span class="micro-tag pos-tag">{formatLabel(stock.position)}</span>
								<span class="micro-tag area-tag">{formatLabel(stock.area)}</span>
								{#each equipmentOf(stock).filter((e) => e !== 'none') as e (e)}
									<span class="micro-tag kit-tag">{equipmentLabels[e]}</span>
								{/each}
							</div>
							<p class="stock-stretch-desc">{stock.description}</p>
						</div>
						<button
							class="btn small stock-add-btn"
							onclick={(e) => {
								e.stopPropagation();
								add(stock);
							}}
							class:added={addedCounts[stock.id]}
							aria-label={addedCounts[stock.id] ? `Add ${stock.name} again (added ${addedCounts[stock.id]})` : `Add ${stock.name}`}
						>
							{#if addedCounts[stock.id]}✓ Added{addedCounts[stock.id] > 1 ? ` ×${addedCounts[stock.id]}` : ''}{:else}＋ Add{/if}
						</button>
					</div>
				{/each}
			{/if}
		</div>
</Modal>

{#if previewStock}
	<Modal class="preview-modal-sheet" onclose={() => (previewStock = null)}>
		{#snippet header()}
			<div class="row" style="gap: 0.35rem; margin-bottom: 0.3rem">
				<span class="badge" style="background: var(--accent); color: #fff; font-weight: 700">
					{formatLabel(previewStock!.type)}
				</span>
				<span class="badge">{formatLabel(previewStock!.position)}</span>
				<span class="badge">{formatLabel(previewStock!.area)}</span>
			</div>
			<h2 style="font-size: 1.3rem; margin: 0">{previewStock!.name}</h2>
		{/snippet}
			<div class="preview-content">
				<div class="preview-illustration-box">
					<StretchIllustration iconKey={previewStock.iconKey} size={220} rounded={16} />
				</div>

				<div class="preview-meta-row">
					<span class="badge">
						⏱ {amountLabel(previewStock)} {previewStock.sides === 'two' ? 'per side' : previewStock.defaultReps ? '' : 'duration'}
					</span>
					<span class="badge">
						{previewStock.sides === 'two' ? 'Two sides (Left → Right)' : 'Single side'}
					</span>
				</div>

				<div class="preview-section">
					<span class="preview-section-title">Posture & Guidance</span>
					<p class="preview-desc">{previewStock.description}</p>
				</div>

				{#if musclesFor(previewStock).length > 0}
					<div class="preview-section">
						<span class="preview-section-title">Muscles worked</span>
						<MuscleChips muscles={musclesFor(previewStock)} />
					</div>
				{/if}
			</div>

			<div class="preview-footer-actions">
				<button
					class="btn primary preview-add-btn"
					onclick={() => {
						if (previewStock) {
							add(previewStock);
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
	</Modal>
{/if}

<style>
	/* Fixed full-height sheet so changing filters doesn't resize it; only the list scrolls. */
	:global(.modal-sheet.stock-picker-sheet) {
		height: 100dvh;
		max-height: 100dvh;
		max-width: none;
		border-radius: 0;
		border: none;
		padding-top: max(1.1rem, env(safe-area-inset-top));
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	@media (min-width: 600px) {
		:global(.modal-sheet.stock-picker-sheet) {
			height: 85vh;
			max-height: 85vh;
			max-width: 540px;
			border-radius: 20px;
			border: 1px solid var(--border);
		}
	}

	.stock-picker-top {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		margin-bottom: 0.55rem;
		flex-shrink: 0;
	}

	.custom-blank-btn {
		width: 100%;
		font-weight: 700;
	}

	.stock-search-input {
		width: 100%;
		padding: 0.55rem 0.8rem;
		font-size: 0.88rem;
	}

	.filter-section {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 0.45rem 0.55rem;
	}

	.filter-row-wrap {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}

	.filter-tools {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding-top: 0.15rem;
	}

	.more-filters-btn {
		background: none;
		border: none;
		padding: 0.2rem 0;
		font: inherit;
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--accent);
		cursor: pointer;
	}

	.sort-label {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.sort-select {
		font: inherit;
		font-size: 0.8rem;
		text-transform: none;
		letter-spacing: 0;
		color: var(--text);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.2rem 0.4rem;
	}

	.filter-group-label {
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		width: 54px;
		flex-shrink: 0;
	}

	.category-pills {
		display: flex;
		gap: 0.3rem;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		padding-bottom: 2px;
		flex: 1;
	}
	.filter-row-wrap:has(.wrap) {
		align-items: flex-start;
	}
	.filter-row-wrap:has(.wrap) .filter-group-label {
		padding-top: 0.3rem;
	}
	.category-pills.wrap {
		flex-wrap: wrap;
		overflow-x: visible;
	}
	.category-pills::-webkit-scrollbar {
		display: none;
	}

	.cat-pill {
		flex: 0 0 auto;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--muted);
		border-radius: 999px;
		padding: 0.2rem 0.55rem;
		font: inherit;
		font-size: 0.74rem;
		font-weight: 600;
		cursor: pointer;
		touch-action: manipulation;
		transition: background 0.12s, color 0.12s, border-color 0.12s;
	}
	.cat-pill.active {
		background: var(--accent);
		border-color: var(--accent);
		color: #ffffff;
	}

	.filter-status-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 0.2rem;
	}

	.reset-filter-btn {
		background: none;
		border: none;
		color: var(--accent);
		font-size: 0.76rem;
		font-weight: 600;
		cursor: pointer;
		padding: 0;
		text-decoration: underline;
	}

	.stock-stretches-list {
		flex: 1;
		min-height: 0;
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
	.stock-stretch-card:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
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
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.4rem;
		margin-bottom: 0.15rem;
	}

	.stock-stretch-name {
		font-weight: 700;
		font-size: 0.9rem;
		line-height: 1.25;
		/* Two lines so names like "Dumbbell Ulnar Deviation Hold" stay readable. */
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.micro-tag.time-tag {
		font-weight: 700;
		color: var(--text);
	}

	.stock-tag-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-bottom: 0.25rem;
	}

	.micro-tag {
		font-size: 0.68rem;
		font-weight: 600;
		padding: 0.1rem 0.35rem;
		border-radius: 4px;
		background: var(--surface);
		border: 1px solid var(--border);
		color: var(--muted);
		white-space: nowrap;
	}

	.stock-stretch-desc {
		font-size: 0.75rem;
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

	.stock-add-btn.added {
		color: var(--accent);
		border-color: var(--accent);
	}

	.no-results-box {
		text-align: center;
		padding: 2rem 1rem;
		background: var(--surface-2);
		border-radius: 12px;
		border: 1px dashed var(--border);
	}

	/* ------------------ Detail Preview Modal ------------------ */
	:global(.preview-modal-sheet) {
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
