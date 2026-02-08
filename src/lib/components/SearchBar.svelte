<script>
	/** @type {{ value?: string, onSearch?: (q: string) => void }} */
	let { value = '', onSearch } = $props();

	let query = $state(value);

	function handleSubmit(e) {
		e.preventDefault();
		onSearch?.(query);
	}

	function handleClear() {
		query = '';
		onSearch?.('');
	}
</script>

<form class="search-bar" onsubmit={handleSubmit} role="search">
	<svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<circle cx="11" cy="11" r="8"></circle>
		<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
	</svg>
	<input
		type="text"
		class="search-input"
		placeholder="Search posts..."
		bind:value={query}
		aria-label="Search posts"
	/>
	{#if query}
		<button type="button" class="search-clear" onclick={handleClear} aria-label="Clear search">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="18" y1="6" x2="6" y2="18"></line>
				<line x1="6" y1="6" x2="18" y2="18"></line>
			</svg>
		</button>
	{/if}
</form>

<style>
	.search-bar {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 0.75rem;
		color: var(--color-text-muted);
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.5625rem 2.25rem 0.5625rem 2.5rem;
		background: var(--color-bg-alt);
		border: 1px solid transparent;
		border-radius: 8px;
		font-size: 0.875rem;
		color: var(--color-text);
		outline: none;
		transition: all 0.15s ease;
	}

	.search-input:focus {
		background: var(--color-input-bg);
		border-color: var(--color-border);
		box-shadow: var(--shadow-sm);
	}

	.search-input::placeholder {
		color: var(--color-text-muted);
	}

	.search-clear {
		position: absolute;
		right: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 4px;
		color: var(--color-text-muted);
	}

	.search-clear:hover {
		color: var(--color-text);
		background: var(--color-bg-alt);
	}
</style>
