<script>
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>{$page.status} — bbrookcs</title>
</svelte:head>

<div class="container error-page">
	<h1 class="error-code">{$page.status}</h1>
	<p class="error-message">{$page.error?.message || 'Something went wrong'}</p>
	<a href="/blog" class="back-link">Go to blog</a>
</div>

<style>
	.error-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		text-align: center;
	}

	.error-code {
		font-family: 'Inter', sans-serif;
		font-size: 4rem;
		font-weight: 700;
		color: var(--color-text-muted);
		line-height: 1;
		margin-bottom: 0.5rem;
	}

	.error-message {
		font-size: 1.0625rem;
		color: var(--color-text-secondary);
		margin-bottom: 2rem;
	}

	.back-link {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.back-link:hover {
		color: var(--color-text);
	}
</style>
