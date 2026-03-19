<script>
	import { page } from '$app/stores';

	const status = $derived($page.status);
	const message = $derived($page.error?.message || 'Something went wrong');

	const isNotFound = $derived(status === 404);
</script>

<svelte:head>
	<title>{status} — bbrookcs</title>
</svelte:head>

<div class="error-root">
	<!-- Animated background grid -->
	<div class="bg-grid" aria-hidden="true"></div>

	<!-- Floating orbs -->
	<div class="orb orb-1" aria-hidden="true"></div>
	<div class="orb orb-2" aria-hidden="true"></div>

	<div class="error-card">
		<!-- Status code with glitch effect -->
		<div class="status-wrap" aria-hidden="true">
			<span class="status-code" data-text={status}>{status}</span>
		</div>

		<!-- Divider line -->
		<div class="divider"></div>

		<!-- Icon -->
		<div class="error-icon">
			{#if isNotFound}
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="8"/>
					<line x1="21" y1="21" x2="16.65" y2="16.65"/>
					<line x1="11" y1="8" x2="11" y2="14"/>
					<line x1="8" y1="11" x2="14" y2="11"/>
				</svg>
			{:else}
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10"/>
					<line x1="12" y1="8" x2="12" y2="12"/>
					<line x1="12" y1="16" x2="12.01" y2="16"/>
				</svg>
			{/if}
		</div>

		<h1 class="error-title">
			{isNotFound ? 'Page not found' : 'Something went wrong'}
		</h1>

		<p class="error-message">{message}</p>

		<div class="error-actions">
			<a href="./" class="btn-primary-action">
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
					<polyline points="9 22 9 12 15 12 15 22"/>
				</svg>
				Go home
			</a>
			<a href="/blog" class="btn-secondary-action">
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
					<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
				</svg>
				Read the blog
			</a>
		</div>

		<!-- subtle status badge -->
		<p class="status-badge">Error {status}</p>
	</div>
</div>

<style>
	/* ── Root layout ── */
	.error-root {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		overflow: hidden;
		background: var(--color-bg);
		padding: 2rem 1.5rem;
	}

	/* ── Animated grid background ── */
	.bg-grid {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(var(--color-border) 1px, transparent 1px),
			linear-gradient(90deg, var(--color-border) 1px, transparent 1px);
		background-size: 40px 40px;
		opacity: 0.45;
		animation: grid-drift 20s linear infinite;
		mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
		-webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
	}

	@keyframes grid-drift {
		0%   { background-position: 0 0; }
		100% { background-position: 40px 40px; }
	}

	/* ── Floating background orbs ── */
	.orb {
		position: absolute;
		border-radius: 50%;
		pointer-events: none;
		filter: blur(80px);
		opacity: 0.15;
	}

	.orb-1 {
		width: 420px;
		height: 420px;
		background: var(--color-logo-name);
		top: -120px;
		right: -100px;
		animation: float-orb 8s ease-in-out infinite;
	}

	.orb-2 {
		width: 300px;
		height: 300px;
		background: var(--color-logo-name);
		bottom: -80px;
		left: -80px;
		animation: float-orb 10s ease-in-out infinite reverse;
	}

	@keyframes float-orb {
		0%, 100% { transform: translateY(0px) scale(1); }
		50%       { transform: translateY(-30px) scale(1.05); }
	}

	/* ── Card ── */
	.error-card {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		max-width: 460px;
		width: 100%;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		border-radius: 18px;
		padding: 2.75rem 2.5rem 2.25rem;
		box-shadow: var(--shadow-lg), 0 0 0 1px var(--color-border-light);
		animation: card-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	@keyframes card-in {
		from { opacity: 0; transform: translateY(24px) scale(0.97); }
		to   { opacity: 1; transform: translateY(0) scale(1); }
	}

	/* ── Giant glitch status number ── */
	.status-wrap {
		margin-bottom: 1.25rem;
	}

	.status-code {
		display: block;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		font-size: clamp(5rem, 18vw, 7rem);
		font-weight: 800;
		letter-spacing: -0.04em;
		line-height: 1;
		color: var(--color-logo-name);
		position: relative;
		animation: glitch-base 4s infinite;
	}

	.status-code::before,
	.status-code::after {
		content: attr(data-text);
		position: absolute;
		inset: 0;
		font-size: inherit;
		font-weight: inherit;
		letter-spacing: inherit;
		line-height: inherit;
	}

	.status-code::before {
		color: #ef4444;
		clip-path: polygon(0 0, 100% 0, 100% 33%, 0 33%);
		animation: glitch-before 4s infinite;
	}

	.status-code::after {
		color: #3b82f6;
		clip-path: polygon(0 66%, 100% 66%, 100% 100%, 0 100%);
		animation: glitch-after 4s infinite;
	}

	@keyframes glitch-base {
		0%, 90%, 100% { transform: none; }
		92%            { transform: skewX(-2deg); }
		94%            { transform: skewX(2deg); }
		96%            { transform: skewX(-1deg); }
	}

	@keyframes glitch-before {
		0%, 90%, 100% { transform: none; opacity: 0; }
		91%            { transform: translateX(-3px); opacity: 0.7; }
		93%            { transform: translateX(3px);  opacity: 0.7; }
		95%            { transform: translateX(-2px); opacity: 0; }
	}

	@keyframes glitch-after {
		0%, 90%, 100% { transform: none; opacity: 0; }
		92%            { transform: translateX(3px); opacity: 0.7; }
		94%            { transform: translateX(-3px); opacity: 0.7; }
		96%            { transform: none; opacity: 0; }
	}

	/* ── Divider ── */
	.divider {
		width: 40px;
		height: 2px;
		background: linear-gradient(90deg, var(--color-logo-name), transparent);
		border-radius: 2px;
		margin-bottom: 1.5rem;
		animation: divider-in 0.6s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	@keyframes divider-in {
		from { width: 0; opacity: 0; }
		to   { width: 40px; opacity: 1; }
	}

	/* ── Icon ── */
	.error-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		border-radius: 14px;
		background: var(--color-bg-alt);
		border: 1px solid var(--color-border);
		color: var(--color-logo-name);
		margin-bottom: 1.125rem;
		animation: icon-in 0.5s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	@keyframes icon-in {
		from { opacity: 0; transform: scale(0.7) rotate(-10deg); }
		to   { opacity: 1; transform: scale(1) rotate(0deg); }
	}

	/* ── Text ── */
	.error-title {
		font-size: 1.3125rem;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 0.5rem;
		letter-spacing: -0.01em;
		animation: text-in 0.5s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	.error-message {
		font-size: 0.9375rem;
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin-bottom: 2rem;
		max-width: 320px;
		animation: text-in 0.5s 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	@keyframes text-in {
		from { opacity: 0; transform: translateY(8px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	/* ── Actions ── */
	.error-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		justify-content: center;
		margin-bottom: 1.75rem;
		animation: text-in 0.5s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	.btn-primary-action,
	.btn-secondary-action {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5625rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 8px;
		transition: all 0.18s ease;
		white-space: nowrap;
	}

	.btn-primary-action {
		background: var(--color-logo-name);
		color: #ffffff;
		border: 1px solid transparent;
	}

	.btn-primary-action:hover {
		opacity: 0.88;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(27, 35, 114, 0.25);
		color: #ffffff;
	}

	.btn-secondary-action {
		background: transparent;
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.btn-secondary-action:hover {
		background: var(--color-bg-alt);
		border-color: var(--color-text-muted);
		transform: translateY(-1px);
	}

	/* ── Status badge ── */
	.status-badge {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-muted);
		animation: text-in 0.5s 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	/* ── Responsive ── */
	@media (max-width: 480px) {
		.error-card {
			padding: 2rem 1.5rem 1.75rem;
			border-radius: 14px;
		}

		.error-actions {
			flex-direction: column;
			width: 100%;
		}

		.btn-primary-action,
		.btn-secondary-action {
			justify-content: center;
		}
	}
</style>
