<script>
	/** @type {{ tags?: string[], activeTag?: string, onSelect?: (tag: string) => void }} */
	let { tags = [], activeTag = '', onSelect } = $props();

	function handleClick(tag) {
		onSelect?.(activeTag === tag ? '' : tag);
	}
</script>

{#if tags.length > 0}
	<div class="tag-filter" role="group" aria-label="Filter by tag">
		<button
			class="tag-btn"
			class:active={!activeTag}
			onclick={() => onSelect?.('')}
		>
			All
		</button>
		{#each tags as tag}
			<button
				class="tag-btn"
				class:active={activeTag === tag}
				onclick={() => handleClick(tag)}
			>
				{tag}
			</button>
		{/each}
	</div>
{/if}

<style>
	.tag-filter {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.tag-btn {
		padding: 0.25rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 450;
		border-radius: 9999px;
		color: var(--color-text-secondary);
		background: transparent;
		border: 1px solid var(--color-border);
		transition: all 0.15s ease;
	}

	.tag-btn:hover {
		background: var(--color-bg-alt);
		color: var(--color-text);
	}

	.tag-btn.active {
		background: var(--color-accent);
		color: var(--color-bg);
		border-color: var(--color-accent);
	}
</style>
