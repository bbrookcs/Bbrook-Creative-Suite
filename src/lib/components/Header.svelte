<script>
	import ThemeToggle from './ThemeToggle.svelte';
	import { theme } from '$stores/theme.js';
	import { onMount } from 'svelte';
	
	let isDarkMode = $state(false);
	
	// Check if the current applied theme is dark
	function checkTheme() {
		if (typeof document !== 'undefined') {
			const currentTheme = document.documentElement.getAttribute('data-theme');
			isDarkMode = currentTheme === 'dark';
		}
	}
	
	// Watch for theme changes
	$effect(() => {
		$theme; // Subscribe to theme changes
		checkTheme();
	});
	
	onMount(() => {
		checkTheme();
		
		// Listen for manual theme attribute changes
		const observer = new MutationObserver(() => {
			checkTheme();
		});
		
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});
		
		return () => observer.disconnect();
	});
</script>

<header class="site-header">
	<div class="container header-inner">
		<a href="/blog" class="site-logo">
			<img 
				src={isDarkMode ? "/logowhite.png" : "/logo.png"} 
				alt="bbrookcs" 
				class="logo-img" 
				width="120" 
				height="32" 
			/>
		</a>
		<nav class="header-nav">
			<ThemeToggle />
		</nav>
	</div>
</header>

<style>
	.site-header {
		background: var(--color-bg);
		border-bottom: 1px solid var(--color-border-light);
	}

	.header-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 56px;
	}

	.site-logo {
		display: flex;
		align-items: center;
		line-height: 0;
	}

	.logo-img {
		height: 40px;
		width: auto;
		object-fit: contain;
		vertical-align: middle;
		transition: opacity 0.2s ease;
	}

	.header-nav {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}
</style>
