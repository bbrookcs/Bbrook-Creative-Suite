<script>
	import { enhance } from '$app/forms';

	let { form } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Admin Login — bbrookcs</title>
</svelte:head>

<div class="login-page">
	<div class="login-card">
		<div class="login-header">
			<h1 class="login-title">bbrookcs</h1>
			<p class="login-subtitle">Admin</p>
		</div>

		{#if form?.error}
			<div class="error-msg">{form.error}</div>
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
		>
			<div class="form-group">
				<label for="username" class="form-label">Username</label>
				<input
					id="username"
					name="username"
					type="text"
					class="input"
					autocomplete="username"
					required
				/>
			</div>

			<div class="form-group">
				<label for="password" class="form-label">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					class="input"
					autocomplete="current-password"
					required
				/>
			</div>

			<button type="submit" class="btn btn-primary login-btn" disabled={loading}>
				{loading ? 'Signing in...' : 'Sign in'}
			</button>
		</form>
	</div>
</div>

<style>
	.login-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 2rem;
		background: var(--color-bg);
	}

	.login-card {
		width: 100%;
		max-width: 360px;
	}

	.login-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.login-title {
		font-family: 'Inter', sans-serif;
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.login-subtitle {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin-top: 0.25rem;
	}

	.error-msg {
		background: rgba(220, 38, 38, 0.08);
		color: var(--color-danger);
		padding: 0.625rem 0.875rem;
		border-radius: 6px;
		font-size: 0.8125rem;
		margin-bottom: 1rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		margin-bottom: 0.375rem;
	}

	.login-btn {
		width: 100%;
		margin-top: 0.5rem;
		padding: 0.625rem;
	}

	.login-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
