<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { lessons } from '$lib/lessons';

	const evidenceLabel = {
		strong: 'Strong evidence',
		moderate: 'Moderate evidence',
		limited: 'Limited evidence'
	} as const;

	function openFromHash() {
		const id = decodeURIComponent(location.hash.slice(1));
		if (!id || !lessons.some((l) => l.id === id)) return;
		const el = document.getElementById(id);
		if (el instanceof HTMLDetailsElement) {
			el.open = true;
			el.scrollIntoView({ block: 'start' });
		}
	}

	// Runs on arrival and on same-page hash links (SvelteKit uses pushState, which fires no hashchange).
	afterNavigate(openFromHash);
</script>

<svelte:head><title>Learn · Stretch Timer</title></svelte:head>

<a class="back-link" href="/">‹ Home</a>
<h1 class="page-title">Learn</h1>
<p class="muted">Short, honest notes on what helps.</p>

<div class="lessons">
	{#each lessons as lesson (lesson.id)}
		<details id={lesson.id} class="card lesson">
			<summary>
				<span class="head">
					<span class="title">{lesson.title}</span>
					<span class="muted small">{lesson.summary}</span>
					<span class="badge evidence {lesson.evidence}">{evidenceLabel[lesson.evidence]}</span>
				</span>
				<span class="chevron" aria-hidden="true">›</span>
			</summary>
			<div class="content">
				{#each lesson.body as para}
					<p>{para}</p>
				{/each}
				<p class="section-label">Sources</p>
				<ul class="sources small">
					{#each lesson.sources as src}
						<li><a href={src.url} target="_blank" rel="noopener">{src.label}</a></li>
					{/each}
				</ul>
			</div>
		</details>
	{/each}
</div>

<p class="muted small footer">
	General guidance, not a diagnosis. If something feels wrong, get it checked.
</p>

<style>
	.back-link {
		display: inline-flex;
		align-items: center;
		color: var(--accent);
		text-decoration: none;
		font-weight: 600;
		font-size: 0.95rem;
		padding: 0.2rem 0;
		margin-bottom: 0.35rem;
	}

	.page-title {
		font-size: 1.45rem;
		font-weight: 800;
		margin: 0.2rem 0 0.4rem;
	}

	.lessons {
		margin-top: 1rem;
	}

	.lesson {
		padding: 0;
		/* clear the sticky app header */
		scroll-margin-top: 4.5rem;
	}

	summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		min-height: 44px;
		padding: 0.85rem 1rem;
		cursor: pointer;
		list-style: none;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	summary:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
		border-radius: 16px;
	}

	.head {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.3rem;
		min-width: 0;
	}

	.title {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--text);
		line-height: 1.25;
	}

	.chevron {
		flex-shrink: 0;
		font-size: 1.6rem;
		line-height: 1;
		color: var(--muted);
		transition: transform 0.15s ease;
	}

	.lesson[open] .chevron {
		transform: rotate(90deg);
	}

	.evidence {
		color: var(--text);
		border: 1px solid var(--border);
	}

	.evidence.strong {
		background: color-mix(in srgb, var(--ok) 18%, var(--surface));
		border-color: color-mix(in srgb, var(--ok) 45%, var(--border));
	}

	.evidence.moderate {
		background: color-mix(in srgb, var(--accent) 16%, var(--surface));
		border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
	}

	.evidence.limited {
		background: var(--surface-2);
	}

	.content {
		padding: 0 1rem 1rem;
		border-top: 1px solid var(--border);
	}

	.content p {
		margin: 0.75rem 0 0;
		line-height: 1.5;
	}

	.content .section-label {
		margin: 1rem 0 0.4rem;
		line-height: 1.2;
	}

	.sources {
		margin: 0;
		padding-left: 1.1rem;
		min-width: 0;
	}

	.sources li {
		margin-top: 0.3rem;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.sources a {
		color: var(--accent);
		overflow-wrap: anywhere;
		min-width: 0;
	}

	.footer {
		margin-top: 1rem;
	}
</style>
