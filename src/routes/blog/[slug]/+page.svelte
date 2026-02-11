<script>
	import { goto } from '$app/navigation';
	import ImageGrid from '$components/ImageGrid.svelte';

	let { data } = $props();

	let navigatingBack = $state(false);

	/** @param {MouseEvent} e */
	async function handleBackClick(e) {
		e.preventDefault();
		if (navigatingBack) return;
		navigatingBack = true;
		await goto('/blog');
	}

	const post = $derived(data.post);

	const DEVICE_ID_KEY = 'bbrook_device_id';
	const VOTED_POSTS_KEY = 'bbrook_voted_posts';

	let count = $state(0);
	let voted = $state(false);

	$effect(() => {
		if (post?.upvotes != null && !voted) count = post.upvotes;
	});

	$effect(() => {
		if (!post?.id) return;
		try {
			const raw = localStorage.getItem(VOTED_POSTS_KEY);
			const list = raw ? JSON.parse(raw) : [];
			voted = Array.isArray(list) && list.includes(post.id);
		} catch (_) {
			voted = false;
		}
	});

	/** @param {string} dateStr */
	function formatDate(dateStr) {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	/** @param {MouseEvent} e */
	async function handleUpvote(e) {
		e.preventDefault();
		if (voted || !post?.id) return;

		let deviceId = localStorage.getItem(DEVICE_ID_KEY);
		if (!deviceId) {
			deviceId = 'bb_' + crypto.randomUUID().replace(/-/g, '');
			localStorage.setItem(DEVICE_ID_KEY, deviceId);
		}

		try {
			const res = await fetch(`/api/posts/${post.id}/upvote`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ deviceId })
			});
			if (res.ok) {
				const result = await res.json();
				count = result.count ?? count + 1;
				voted = true;
				const raw = localStorage.getItem(VOTED_POSTS_KEY);
				const list = raw ? JSON.parse(raw) : [];
				if (!list.includes(post.id)) {
					list.push(post.id);
					localStorage.setItem(VOTED_POSTS_KEY, JSON.stringify(list));
				}
			}
		} catch (_) {}
	}

	function shareOnX() {
		const url = typeof window !== 'undefined' ? window.location.href : '';
		const text = post?.title ? `${post.title}` : '';
		const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
		window.open(shareUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
	}
</script>

<svelte:head>
	<title>{post.meta_title || post.title} bbrookcs</title>
	{#if post.meta_description}
		<meta name="description" content={post.meta_description} />
	{:else if post.excerpt}
		<meta name="description" content={post.excerpt} />
	{/if}
	<meta property="og:title" content={post.meta_title || post.title} />
	<meta property="og:type" content="article" />
	{#if post.meta_description || post.excerpt}
		<meta property="og:description" content={post.meta_description || post.excerpt} />
	{/if}
	{#if post.og_image}
		<meta property="og:image" content={post.og_image} />
	{/if}
	<meta property="article:published_time" content={post.published_at} />
	{#each post.tags as tag}
		<meta property="article:tag" content={tag} />
	{/each}
</svelte:head>

<article class="container post-article">
	<a href="/blog" class="back-link back-link-top" onclick={handleBackClick}>
		{#if navigatingBack}
			<span class="back-spinner" aria-hidden="true"></span>
		{:else}
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="19" y1="12" x2="5" y2="12"></line>
				<polyline points="12 19 5 12 12 5"></polyline>
			</svg>
			Back to blog
		{/if}
	</a>

	<header class="post-header">
		<h1 class="post-title">{post.title}</h1>
	</header>

	{#if post.images && post.images.length > 0}
		<ImageGrid images={post.images} />
	{/if}

	{#if post.quote_text}
		<div class="featured-quote">
			<blockquote class="quote-text">
				{#each (post.quote_text.split(/\n\n+/).filter(Boolean)) as paragraph}
					<p>{paragraph.replace(/\n/g, ' ')}</p>
				{/each}
			</blockquote>
			{#if post.quote_source || post.quote_url}
				<div class="quote-attribution">
					{#if post.quote_url}
						<a href={post.quote_url} target="_blank" rel="noopener noreferrer" class="quote-source-link">
							See more
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
								<polyline points="15,3 21,3 21,9"></polyline>
								<line x1="10" y1="14" x2="21" y2="3"></line>
							</svg>
						</a>
					{:else if post.quote_source?.startsWith?.('http')}
						<a href={post.quote_source} target="_blank" rel="noopener noreferrer" class="quote-source-link">
							See more
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
								<polyline points="15,3 21,3 21,9"></polyline>
								<line x1="10" y1="14" x2="21" y2="3"></line>
							</svg>
						</a>
					{:else if post.quote_source}
						<span class="quote-source">— {post.quote_source}</span>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<div class="prose">
		{@html post.html}
	</div>

	<div class="post-interaction">
		<div class="interaction-upvote">
			<button
				type="button"
				class="upvote-btn"
				class:voted
				onclick={handleUpvote}
				aria-label={voted ? 'You upvoted this' : 'Upvote this post'}
				title={voted ? 'You upvoted this' : 'Upvote'}
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
				</svg>
			</button>
			<span class="upvote-count">{count}</span>
			<span class="upvote-label">Upvote</span>
		</div>
		<button
			type="button"
			class="share-x-btn"
			onclick={shareOnX}
			aria-label="Share on X (Twitter)"
			title="Share on X"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
			</svg>
			<span>Share</span>
		</button>
	</div>

	<footer class="post-footer">
		<time datetime={post.published_at} class="post-date">
			{formatDate(post.published_at)}
		</time>
	</footer>
</article>

<style>
	.post-article {
		max-width: 720px;
	}

	.back-link-top {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.post-header {
		margin-bottom: 1.25rem;
		padding-bottom: 0;
		border-bottom: none;
	}

	.post-title {
		font-family: var(--font-sans);
		font-size: 2.25rem;
		font-weight: 700;
		line-height: 1.25;
		margin-bottom: 0.5rem;
		letter-spacing: -0.01em;
	}

	/* Featured Quote Styles */
	.featured-quote {
		background: var(--color-bg-alt, #fafafa);
		border: 1px solid var(--color-border-light, #e5e7eb);
		border-radius: 12px;
		padding: 1.5rem;
		margin: 1.5rem 0;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.quote-text {
		font-size: 1.125rem;
		line-height: 1.7;
		font-style: italic;
		color: var(--color-text-secondary, #4b5563);
		margin: 0 0 1rem 0;
		padding: 0;
		border: none;
		background: none;
		position: relative;
	}

	.quote-text::before {
		content: '"';
		font-size: 2rem;
		color: var(--color-text-muted, #9ca3af);
		position: absolute;
		left: -1rem;
		top: -0.5rem;
		font-family: Georgia, serif;
	}

	.quote-text::after {
		content: '"';
		font-size: 2rem;
		color: var(--color-text-muted, #9ca3af);
		font-family: Georgia, serif;
	}

	.quote-text p {
		margin: 0 0 0.875rem 0;
	}

	.quote-text p:last-child {
		margin-bottom: 0;
	}

	.quote-attribution {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		margin-top: 0.75rem;
	}

	.quote-source-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-text-muted, #6b7280);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.quote-source-link:hover {
		color: var(--color-text);
	}

	.quote-source-link svg {
		opacity: 0.8;
	}

	.quote-source {
		font-size: 0.875rem;
		color: var(--color-text-muted, #6b7280);
		font-style: normal;
		font-weight: 500;
	}


	/* --- Prose Styles --- */
	.prose {
		font-family: var(--font-sans);
		font-size: 1.0625rem;
		line-height: 1.8;
		color: var(--color-text);
		margin-top: 0;
	}

	.prose :global(> *:first-child) {
		margin-top: 0;
	}

	.prose :global(h1) {
		font-size: 1.875rem;
		margin-top: 2.5rem;
		margin-bottom: 1rem;
	}

	.prose :global(h2) {
		font-size: 1.5rem;
		margin-top: 2.25rem;
		margin-bottom: 0.875rem;
	}

	.prose :global(h3) {
		font-size: 1.25rem;
		margin-top: 2rem;
		margin-bottom: 0.75rem;
	}

	.prose :global(p) {
		margin-bottom: 1.375rem;
	}

	.prose :global(ul),
	.prose :global(ol) {
		margin-bottom: 1.375rem;
		padding-left: 1.5rem;
	}

	.prose :global(li) {
		margin-bottom: 0.375rem;
	}

	.prose :global(blockquote) {
		border-left: 3px solid var(--color-blockquote-border);
		background: var(--color-blockquote-bg);
		padding: 1rem 1.25rem;
		margin: 1.5rem 0;
		border-radius: 0 6px 6px 0;
		font-style: italic;
		color: var(--color-text-secondary);
	}

	.prose :global(blockquote p:last-child) {
		margin-bottom: 0;
	}

	.prose :global(pre) {
		margin: 1.5rem 0;
		border-radius: 8px;
		overflow-x: auto;
	}

	.prose :global(code) {
		font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;
		font-size: 0.875em;
	}

	.prose :global(:not(pre) > code) {
		background: var(--color-code-bg);
		padding: 0.15em 0.4em;
		border-radius: 4px;
		font-size: 0.85em;
	}

	.prose :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 8px;
		margin: 1.5rem 0;
	}

	.prose :global(a) {
		color: var(--color-text);
		text-decoration: underline;
		text-decoration-color: var(--color-text-muted);
		text-underline-offset: 2px;
		transition: text-decoration-color 0.15s ease;
	}

	.prose :global(a:hover) {
		text-decoration-color: var(--color-text);
	}

	.prose :global(hr) {
		border: none;
		border-top: 1px solid var(--color-border);
		margin: 2rem 0;
	}

	.prose :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: 1.5rem 0;
		font-family: var(--font-sans);
		font-size: 0.9375rem;
	}

	.prose :global(th),
	.prose :global(td) {
		padding: 0.625rem 0.875rem;
		border: 1px solid var(--color-border);
		text-align: left;
	}

	.prose :global(th) {
		background: var(--color-bg-alt);
		font-weight: 600;
	}

	.post-interaction {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border-light);
	}

	.interaction-upvote {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.upvote-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--color-text-muted);
		border-radius: 50%;
		cursor: pointer;
		transition: transform 0.2s ease, color 0.15s ease;
	}

	.upvote-btn:hover:not(.voted) {
		color: var(--color-text);
		transform: scale(1.08);
	}

	.upvote-btn.voted {
		color: #e11d48;
		cursor: default;
	}

	.upvote-btn.voted svg {
		fill: currentColor;
	}

	.upvote-count {
		font-size: 0.9375rem;
		color: var(--color-text-muted);
	}

	.upvote-label {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.share-x-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-family: var(--font-sans);
		color: var(--color-text-secondary);
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		cursor: pointer;
		transition: border-color 0.15s ease, color 0.15s ease;
	}

	.share-x-btn:hover {
		color: var(--color-text);
		border-color: var(--color-text-muted);
	}

	/* Post footer — date at bottom */
	.post-footer {
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-border-light);
	}

	.post-date {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		transition: color 0.15s ease;
	}

	.back-link:hover {
		color: var(--color-text);
	}

	.back-spinner {
		display: inline-block;
		width: 16px;
		height: 16px;
		border: 2px solid var(--color-border-light, #e5e7eb);
		border-top-color: currentColor;
		border-radius: 50%;
		animation: back-spin 0.7s linear infinite;
	}

	@keyframes back-spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 640px) {
		.post-title {
			font-size: 1.75rem;
		}

		.prose {
			font-size: 1rem;
		}
	}
</style>
