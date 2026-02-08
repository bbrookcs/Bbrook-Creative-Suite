<script>
	/** @type {{ post: any }} */
	let { post } = $props();

	const hasExcerpt = $derived(post.excerpt && post.excerpt.trim().length > 0);
	
	/** Split excerpt into paragraphs and format for display */
	const excerptParagraphs = $derived(
		hasExcerpt ? post.excerpt
			.trim()
			.split(/\n\s*\n/) // Split on double line breaks
			.map(p => p.trim())
			.filter(p => p.length > 0) : []
	);
	const upvoteCount = $derived(post.upvotes ?? 0);

	/** @param {string} dateStr */
	function formatDate(dateStr) {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<article class="post-card">
	<a href="/blog/{post.slug}" class="post-card-link">
		<h2 class="post-title">{post.title}</h2>
		{#if hasExcerpt}
			<div class="post-excerpt">
				{#each excerptParagraphs as paragraph}
					<p>{paragraph}</p>
				{/each}
			</div>
		{/if}
		<div class="post-meta">
			<time datetime={post.published_at || post.created_at}>
				{formatDate(post.published_at || post.created_at)}
			</time>
			<span class="meta-sep">&middot;</span>
			<span class="upvote-text">{upvoteCount} Upvote{upvoteCount !== 1 ? 's' : ''}</span>
		</div>
		
	</a>
</article>

<style>
	.post-card {
		padding: 1rem 0;
		border-bottom: 1px solid var(--color-border-light);
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.post-card:last-child {
		border-bottom: none;
	}

	.post-card-link {
		display: block;
		text-decoration: none;
		color: inherit;
		transition: opacity 0.15s ease;
	}


	.post-title {
		font-family: var(--font-sans);
		font-size: 1.375rem;
		font-weight: 600;
		line-height: 1.35;
		margin-bottom: 0.5rem;
		color: var(--color-text);
		position: relative;
		display: inline-block;
	}

	.post-title::after {
		content: '';
		position: absolute;
		bottom: -2px;
		left: 0;
		width: 0;
		height: 2px;
		background-color: var(--color-text);
		transition: width 0.3s ease;
	}

	.post-card-link:hover .post-title::after {
		width: 100%;
	}

	.post-excerpt {
		font-size: 0.9375rem;
		line-height: 1.6;
		color: var(--color-text-secondary);
		margin-bottom: 0.75rem;
	}

	.post-excerpt p {
		margin: 0 0 0.75rem 0;
	}

	.post-excerpt p:last-of-type {
		margin-bottom: 0.25rem;
	}

	.post-meta {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		margin-bottom: 0.5rem;
	}

	.meta-sep {
		opacity: 0.6;
	}

	.upvote-text {
		color: var(--color-text-muted);
	}

</style>
