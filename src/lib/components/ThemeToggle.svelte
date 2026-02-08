<script>
	import { theme } from '$stores/theme.js';

	const themeValue = $derived($theme);

	function handleToggle() {
		theme.toggle();
	}

	const label = $derived(
		themeValue === 'system' ? 'System' : themeValue === 'dark' ? 'Dark' : 'Light'
	);
</script>

<button
	class="theme-toggle"
	onclick={handleToggle}
	aria-label="Toggle theme: {label}"
	title="Theme: {label}"
>
	{#if themeValue === 'light'}
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="12" r="5"></circle>
			<line x1="12" y1="1" x2="12" y2="3"></line>
			<line x1="12" y1="21" x2="12" y2="23"></line>
			<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
			<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
			<line x1="1" y1="12" x2="3" y2="12"></line>
			<line x1="21" y1="12" x2="23" y2="12"></line>
			<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
			<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
		</svg>
	{:else if themeValue === 'dark'}
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
		</svg>
	{:else}
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="12" r="10"></circle>
			<path d="M12 2a7 7 0 0 0 0 20z" fill="currentColor"></path>
		</svg>
	{/if}
</button>

<style>
	.theme-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border-radius: 8px;
		color: var(--color-text-secondary);
		transition: all 0.15s ease;
	}

	.theme-toggle:hover {
		background: var(--color-bg-alt);
		color: var(--color-text);
	}
</style>
