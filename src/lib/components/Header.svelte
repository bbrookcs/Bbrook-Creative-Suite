<script>
	import ThemeToggle from './ThemeToggle.svelte';
</script>

<header class="site-header">
	<div class="container header-inner">
		<a href="/blog" class="site-logo">
			<img src="/logo.png" alt="bbrookcs" class="logo-img" width="120" height="32" />
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
	}

	.header-nav {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}
</style>
