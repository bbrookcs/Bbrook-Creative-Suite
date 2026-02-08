<script>
	/** @type {{ page?: number, totalPages?: number, onPageChange?: (page: number) => void }} */
	let { page = 1, totalPages = 1, onPageChange } = $props();
</script>

{#if totalPages > 1}
	<nav class="pagination" aria-label="Pagination">
		<button
			class="page-btn"
			disabled={page <= 1}
			onclick={() => onPageChange?.(page - 1)}
			aria-label="Previous page"
		>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="15 18 9 12 15 6"></polyline>
			</svg>
			Prev
		</button>

		<span class="page-info">
			{page} <span class="page-sep">/</span> {totalPages}
		</span>

		<button
			class="page-btn"
			disabled={page >= totalPages}
			onclick={() => onPageChange?.(page + 1)}
			aria-label="Next page"
		>
			Next
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="9 18 15 12 9 6"></polyline>
			</svg>
		</button>
	</nav>
{/if}

<style>
	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 2rem 0 0;
	}

	.page-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		transition: all 0.15s ease;
	}

	.page-btn:hover:not(:disabled) {
		background: var(--color-bg-alt);
		color: var(--color-text);
	}

	.page-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.page-info {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.page-sep {
		opacity: 0.4;
		margin: 0 0.125rem;
	}
</style>
