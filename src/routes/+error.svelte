<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status === 404 ? 'Page not found' : 'Something went wrong'} · Stretch Timer</title>
</svelte:head>

<div class="card error-card">
	<h1>{page.status === 404 ? 'Page not found' : 'Something went wrong'}</h1>
	<p class="muted">
		{page.status === 404
			? 'This link doesn’t lead anywhere. Your routines are safe.'
			: (page.error?.message ?? 'Try going back to your routines.')}
	</p>
	<a class="btn primary" href="/">← Back to routines</a>
</div>

<style>
	.error-card {
		margin-top: 1rem;
		text-align: center;
		padding: 1.5rem 1rem;
	}
	h1 {
		font-size: 1.3rem;
		margin: 0 0 0.4rem;
	}
	p {
		margin: 0 0 1rem;
	}
</style>
