<script>
	import PostEditor from '$components/PostEditor.svelte';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';

	let { data } = $props();

	let saving = $state(false);
	let error = $state('');
	let saved = $state(false);

	async function handleSave(postData) {
		saving = true;
		error = '';
		saved = false;

		const postId = $page.params.id;

		try {
			const res = await fetch(`/api/posts/${postId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(postData)
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({ message: 'Failed to save' }));
				error = err.message || 'Something went wrong';
				saving = false;
				return;
			}

			saved = true;
			await invalidateAll();
			setTimeout(() => (saved = false), 2500);
		} catch (err) {
			error = 'Failed to save post. Please try again.';
		}

		saving = false;
	}
</script>

<svelte:head>
	<title>Edit: {data.post.title} — bbrookcs Admin</title>
</svelte:head>

<div class="page-header">
	<a href="/admin/dashboard" class="back-link">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<line x1="19" y1="12" x2="5" y2="12"></line>
			<polyline points="12 19 5 12 12 5"></polyline>
		</svg>
		Posts
	</a>
	<div class="page-title-row">
		<h1 class="page-title">Edit Post</h1>
		{#if saved}
			<span class="saved-indicator">Saved</span>
		{/if}
	</div>
</div>

<PostEditor post={data.post} onSave={handleSave} {saving} {error} />

<style>
	.page-header {
		margin-bottom: 1.5rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		margin-bottom: 0.5rem;
	}

	.back-link:hover {
		color: var(--color-text);
	}

	.page-title-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.page-title {
		font-size: 1.5rem;
	}

	.saved-indicator {
		font-size: 0.8125rem;
		color: var(--color-success);
		font-weight: 500;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
