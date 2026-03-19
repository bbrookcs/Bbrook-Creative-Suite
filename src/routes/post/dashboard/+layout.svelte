<script>
	let { children } = $props();
</script>

<div class="admin-shell">
	<header class="admin-header">
		<div class="admin-header-inner">
			<a href="/post/dashboard" class="admin-logo">bbrookcs <span class="admin-label">admin</span></a>
			<nav class="admin-nav">
				<a href="/blog" class="admin-nav-link" target="_blank">View blog</a>
				<form method="POST" action="/post/logout" class="logout-form">
					<button type="submit" class="admin-nav-link logout-btn">Sign out</button>
				</form>
			</nav>
		</div>
	</header>
	<div class="admin-content">
		{@render children()}
	</div>
</div>

<style>
	.admin-shell {
		min-height: 100vh;
		background: var(--color-bg);
	}

	.admin-header {
		background: var(--color-bg-card);
		border-bottom: 1px solid var(--color-border);
		padding: 0 1.5rem;
	}

	.admin-header-inner {
		max-width: 1100px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 52px;
	}

	.admin-logo {
		font-family: 'Inter', sans-serif;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-text);
		letter-spacing: -0.02em;
	}

	.admin-label {
		font-weight: 400;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		margin-left: 0.25rem;
	}

	.admin-nav {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.admin-nav-link {
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
		transition: color 0.15s ease;
	}

	.admin-nav-link:hover {
		color: var(--color-text);
	}

	.logout-form {
		display: inline;
	}

	.logout-btn {
		cursor: pointer;
		background: none;
		border: none;
		font-family: inherit;
		font-size: inherit;
	}

	.admin-content {
		max-width: 1100px;
		margin: 0 auto;
		padding: 2rem 1.5rem;
	}
</style>
