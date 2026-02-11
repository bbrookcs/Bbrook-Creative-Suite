<script>
	import PostCard from '$components/PostCard.svelte';
	import SearchBar from '$components/SearchBar.svelte';
	import TagFilter from '$components/TagFilter.svelte';
	import Pagination from '$components/Pagination.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { data } = $props();

	function buildUrl(params) {
		const url = new URL($page.url);
		for (const [key, value] of Object.entries(params)) {
			if (value) {
				url.searchParams.set(key, String(value));
			} else {
				url.searchParams.delete(key);
			}
		}
		// Reset to page 1 when searching or filtering
		if ('q' in params || 'tag' in params) {
			url.searchParams.delete('page');
		}
		return url.pathname + url.search;
	}

	function handleSearch(q) {
		goto(buildUrl({ q }));
	}

	function handleTagSelect(tag) {
		goto(buildUrl({ tag }));
	}

	function handlePageChange(p) {
		goto(buildUrl({ page: p > 1 ? p : '' }));
	}
</script>

<svelte:head>
	<title>bbrookcs Blog</title>
	<meta name="description" content="Thoughts on technology, software, and craft." />
</svelte:head>

<div class="container">
	<div class="blog-header">
		<h1 class="blog-title">Bbrook Creative Suite</h1>
		<div class="blog-controls">
			<SearchBar value={data.search} onSearch={handleSearch} />
		</div>
	</div>

	{#if data.search || data.activeTag}
		<div class="filter-info">
			<span class="filter-count">{data.total} post{data.total !== 1 ? 's' : ''} found</span>
			{#if data.search}
				<span class="filter-label">for &ldquo;{data.search}&rdquo;</span>
			{/if}
			{#if data.activeTag}
				<span class="filter-label">tagged &ldquo;{data.activeTag}&rdquo;</span>
			{/if}
		</div>
	{/if}

	{#if data.posts.length === 0}
		<div class="empty-state">
			<p>No posts yet.</p>
			{#if data.search || data.activeTag}
				<p class="empty-sub">Try a different search or filter.</p>
			{/if}
		</div>
	{:else}
		<div class="post-list">
			{#each data.posts as post (post.id)}
				<PostCard {post} />
			{/each}
		</div>
	{/if}

	<Pagination
		page={data.page}
		totalPages={data.totalPages}
		onPageChange={handlePageChange}
	/>
</div>

<style>
	.blog-header {
		margin-bottom: 2rem;
	}

	.blog-title {
		font-family: var(--font-sans);
		font-size: 2rem;
		font-weight: 500;
		color: var(--color-logo-name);
		margin-bottom: 1.25rem;
		letter-spacing: -0.02em;
	}

	.blog-controls {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.filter-info {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-border-light);
	}

	.filter-count {
		font-weight: 500;
	}

	.post-list {
		display: flex;
		flex-direction: column;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 1rem;
		color: var(--color-text-muted);
	}

	.empty-state p {
		font-size: 1.0625rem;
	}

	.empty-sub {
		margin-top: 0.5rem;
		font-size: 0.875rem !important;
	}
</style>
