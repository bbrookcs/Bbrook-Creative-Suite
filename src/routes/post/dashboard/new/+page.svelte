<script>
	import PostEditor from '$components/PostEditor.svelte';
	import { goto } from '$app/navigation';

	let saving = $state(false);
	let error = $state('');

	async function handleSave(data) {
		saving = true;
		error = '';

		try {
			const res = await fetch('/api/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({ message: 'Failed to save' }));
				error = err.message || 'Something went wrong';
				saving = false;
				return;
			}

			const result = await res.json();
			goto(`/post/dashboard/edit/${result.id}`, { replaceState: true });
		} catch (err) {
			error = 'Failed to save post. Please try again.';
		}

		saving = false;
	}
</script>

<svelte:head>
	<title>New Post</title>
</svelte:head>

<div class="page-header">
	<a href="/post/dashboard" class="back-link">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<line x1="19" y1="12" x2="5" y2="12"></line>
			<polyline points="12 19 5 12 12 5"></polyline>
		</svg>
		Posts
	</a>
	<h1 class="page-title">New Post</h1>
</div>

<PostEditor onSave={handleSave} {saving} {error} />

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

	.page-title {
		font-size: 1.5rem;
	}
</style>
