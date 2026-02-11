<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	function formatDate(dateStr) {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	let deletingId = $state(null);
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<div class="dashboard-header">
	<h1 class="dashboard-title">Posts</h1>
	<a href="/admin/dashboard/new" class="btn btn-primary">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<line x1="12" y1="5" x2="12" y2="19"></line>
			<line x1="5" y1="12" x2="19" y2="12"></line>
		</svg>
		New post
	</a>
</div>

{#if data.posts.length === 0}
	<div class="empty-state">
		<p>No posts yet.</p>
		<a href="/admin/dashboard/new" class="btn btn-secondary" style="margin-top: 1rem;">Create your first post</a>
	</div>
{:else}
	<div class="posts-table-wrapper">
		<table class="posts-table">
			<thead>
				<tr>
					<th>Title</th>
					<th>Status</th>
					<th>Date</th>
					<th class="th-actions">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.posts as post (post.id)}
					<tr>
						<td>
							<a href="/admin/dashboard/edit/{post.id}" class="post-title-link">{post.title}</a>
						
						</td>
						<td>
							<span class="badge" class:badge-published={post.status === 'published'} class:badge-draft={post.status === 'draft'}>
								{post.status}
							</span>
						</td>
						<td class="cell-date">
							{formatDate(post.published_at || post.created_at)}
						</td>
						<td class="cell-actions">
							<a href="/admin/dashboard/edit/{post.id}" class="btn btn-secondary btn-sm">Edit</a>
							{#if post.status === 'published'}
								<a href="/blog/{post.slug}" class="btn btn-secondary btn-sm" target="_blank">View</a>
							{/if}
							<form
								method="POST"
								action="?/delete"
								class="inline-form"
								use:enhance={() => {
									deletingId = post.id;
									return async ({ update }) => {
										deletingId = null;
										await update();
									};
								}}
							>
								<input type="hidden" name="id" value={post.id} />
								<button
									type="submit"
									class="btn btn-danger btn-sm"
									disabled={deletingId === post.id}
									onclick={(e) => {
										if (!confirm('Delete this post?')) e.preventDefault();
									}}
								>
									{deletingId === post.id ? '...' : 'Delete'}
								</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if data.totalPages > 1}
		<div class="table-pagination">
			{#each Array(data.totalPages) as _, i}
				<a
					href="/admin/dashboard?page={i + 1}"
					class="page-link"
					class:active={data.page === i + 1}
				>
					{i + 1}
				</a>
			{/each}
		</div>
	{/if}
{/if}

<style>
	.dashboard-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	.dashboard-title {
		font-size: 1.5rem;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 1rem;
		color: var(--color-text-muted);
	}

	.posts-table-wrapper {
		overflow-x: auto;
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	.posts-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.posts-table th {
		text-align: left;
		padding: 0.625rem 1rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		background: var(--color-bg-alt);
		border-bottom: 1px solid var(--color-border);
	}

	.posts-table td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border-light);
		vertical-align: middle;
	}

	.posts-table tr:last-child td {
		border-bottom: none;
	}

	.post-title-link {
		font-weight: 500;
		color: var(--color-text);
	}

	.post-title-link:hover {
		text-decoration: underline;
	}

	.cell-date {
		color: var(--color-text-secondary);
		white-space: nowrap;
		font-size: 0.8125rem;
	}

	.th-actions,
	.cell-actions {
		text-align: right;
	}

	.cell-actions {
		display: flex;
		gap: 0.375rem;
		justify-content: flex-end;
	}

	.inline-form {
		display: inline;
	}

	.table-pagination {
		display: flex;
		gap: 0.375rem;
		justify-content: center;
		margin-top: 1.5rem;
	}

	.page-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		font-size: 0.8125rem;
		border-radius: 6px;
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border);
	}

	.page-link:hover {
		background: var(--color-bg-alt);
	}

	.page-link.active {
		background: var(--color-accent);
		color: var(--color-bg);
		border-color: var(--color-accent);
	}

	@media (max-width: 640px) {
		.cell-actions {
			flex-direction: column;
			gap: 0.25rem;
		}
	}
</style>
