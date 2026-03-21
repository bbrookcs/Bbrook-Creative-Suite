<script>
	import { page, navigating } from '$app/stores';
	
	let { data, children } = $props();
	
	const navItems = [
		{ name: 'Dashboard', path: '/self', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
		{ name: 'Tasks', path: '/self/tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
		{ name: 'Shop', path: '/self/shopping', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
		{ name: 'Plans', path: '/self/plans', icon: 'M9 19V6l12-3v13M9 19c-1.657 0-3-1.343-3-3S7.343 13 9 13s3 1.343 3 3-1.343 3-3 3z' },
		{ name: 'Notes', path: '/self/notes', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
		{ name: 'Timeline', path: '/self/timeline', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
		{ name: 'Finances', path: '/self/finances', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
		{ name: 'Intelligence', path: '/self/ai', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' }
	];
</script>

<div class="dashboard-shell">
	<nav class="sidebar">
		<div class="brand">
			<span class="brand-text">Personal</span>
			<span class="brand-sub">OS</span>
		</div>
		
		<ul class="nav-menu" data-sveltekit-preload-data="hover">
			{#each navItems as item}
				<li>
					<a 
						href={item.path} 
						class="nav-link {($navigating?.to?.url.pathname || $page.url.pathname) === item.path ? 'active' : ''}"
					>
						<svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
						</svg>
						<span class="nav-item-text">{item.name}</span>
					</a>
				</li>
			{/each}
		</ul>

		<div class="user-profile">
			<div class="avatar">
				{data.user?.username?.[0]?.toUpperCase() || 'A'}
			</div>
			<div class="user-info">
				<span class="user-name">{data.user?.username || 'Admin User'}</span>
				<span class="user-role">{data.user?.role || 'Admin User'}</span>
			</div>
			<form action="/self/logout" method="POST" style="margin-left:auto;">
				<button class="logout-btn" title="Logout">
					<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
					</svg>
				</button>
			</form>
		</div>
	</nav>

	<main class="main-content">
		{#if $navigating}
			<div class="nav-progress-bar"></div>
		{/if}
		
		<div class="content-area">
			{@render children()}
		</div>
	</main>
</div>

<style>
	:global(html), :global(body) {
		margin: 0;
		padding: 0;
		height: 100%;
		background-color: #0f1115;
		color: #e2e8f0;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
		color-scheme: dark;
	}

	.dashboard-shell {
		display: flex;
		height: 100vh;
		overflow: hidden;
		background: #0f1115;
	}

	.sidebar {
		width: 260px;
		background: #15181e;
		border-right: 1px solid #262b36;
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		z-index: 100;
	}

	.brand {
		padding: 24px 24px;
		display: flex;
		align-items: center;
		gap: 12px;
		border-bottom: 1px solid #262b36;
	}

	.brand-text {
		font-size: 1.25rem;
		font-weight: 700;
		color: #ffffff;
		letter-spacing: -0.02em;
	}

	.brand-sub {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		background: #2563eb;
		color: white;
		padding: 2px 6px;
		border-radius: 4px;
		font-weight: 600;
	}

	.nav-menu {
		list-style: none;
		padding: 24px 12px;
		margin: 0;
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
		overflow-y: auto;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 12px;
		text-decoration: none;
		color: #94a3b8;
		font-weight: 500;
		font-size: 0.95rem;
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.nav-link:hover {
		background: #1e222a;
		color: #f1f5f9;
	}

	.nav-link.active {
		background: rgba(37, 99, 235, 0.1);
		color: #60a5fa;
	}

	.nav-icon {
		width: 20px;
		height: 20px;
		opacity: 0.7;
	}

	.nav-link.active .nav-icon {
		opacity: 1;
	}

	.user-profile {
		padding: 16px 20px;
		border-top: 1px solid #262b36;
		display: flex;
		align-items: center;
		gap: 12px;
		background: #111318;
	}

	.avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: linear-gradient(135deg, #2563eb, #7c3aed);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		color: white;
		font-size: 1rem;
	}

	.user-info {
		display: flex;
		flex-direction: column;
	}

	.user-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: #e2e8f0;
	}

	.user-role {
		font-size: 0.75rem;
		color: #8ba1c0;
	}
	
	.logout-btn {
		background: none;
		border: none;
		color: #64748b;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		transition: all 0.2s;
	}
	
	.logout-btn:hover {
		color: #f87171;
		background: rgba(248, 113, 113, 0.1);
	}

	.main-content {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
		position: relative;
	}

	
	.nav-progress-bar {
		position: absolute;
		top: 0;
		left: 0;
		width: 0%;
		height: 3px;
		background: #3b82f6;
		box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
		animation: load-progress 1.5s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
		z-index: 1000;
		border-radius: 0 3px 3px 0;
	}

	@keyframes load-progress {
		0% {
			width: 0%;
		}
		100% {
			width: 90%;
		}
	}


	@keyframes pulse {
		0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
		70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
		100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
	}

	.content-area {
		flex-grow: 1;
		padding: 32px;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: #334155 transparent;
	}

	.content-area::-webkit-scrollbar {
		width: 6px;
	}

	.content-area::-webkit-scrollbar-track {
		background: transparent;
	}

	.content-area::-webkit-scrollbar-thumb {
		background-color: #334155;
		border-radius: 3px;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.sidebar {
			position: fixed;
			bottom: 0;
			left: 0;
			width: 100%;
			height: 64px;
			border-right: none;
			border-top: 1px solid #262b36;
			border-bottom: none;
			background: rgba(21, 24, 30, 0.95);
			backdrop-filter: blur(10px);
			z-index: 1000;
		}
		.nav-menu {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
			padding: 0 4px;
			height: 100%;
			margin: 0;
			overflow: visible;
		}
		.nav-menu li {
			flex: 1;
			display: flex;
			justify-content: center;
		}
		.nav-link {
			flex-direction: column;
			padding: 8px 0;
			gap: 4px;
			border-radius: 8px;
			justify-content: center;
			width: 100%;
		}
		.nav-item-text {
			display: none;
		}
		.nav-icon {
			margin: 0;
			width: 24px;
			height: 24px;
		}
		.brand {
			display: none;
		}
		.user-profile {
			display: none;
		}
		.content-area {
			padding: 16px;
			padding-bottom: 80px;
		}
	}
	
	/* GLOBAL UI UTILITIES FOR MODULES */
	:global(.grid-cards) {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 20px;
	}
	
	:global(.card) {
		background: #15181e;
		border: 1px solid #262b36;
		border-radius: 12px;
		padding: 24px;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}
	
	:global(.card:hover) {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
		border-color: #334155;
	}
	
	:global(.card-title) {
		font-size: 1.1rem;
		font-weight: 600;
		color: #f1f5f9;
		margin-bottom: 8px;
		margin-top: 0;
	}
	
	:global(.card-value) {
		font-size: 2.5rem;
		font-weight: 700;
		color: #ffffff;
		margin: 8px 0;
		line-height: 1;
	}
	
	:global(.btn) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 10px 16px;
		border-radius: 8px;
		font-weight: 500;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}
	
	:global(.btn-primary) {
		background: #2563eb;
		color: white;
	}
	
	:global(.btn-primary:hover) {
		background: #1d4ed8;
	}
	
	:global(.form-group) {
		margin-bottom: 16px;
	}
	
	:global(.form-label) {
		display: block;
		font-size: 0.85rem;
		font-weight: 500;
		color: #94a3b8;
		margin-bottom: 6px;
	}
	
	:global(.form-input) {
		width: 100%;
		background: #111318;
		border: 1px solid #262b36;
		color: #e2e8f0;
		padding: 10px 12px;
		border-radius: 6px;
		font-family: inherit;
		box-sizing: border-box;
		color-scheme: dark;
	}
	
	:global(.form-input[type="date"]::-webkit-calendar-picker-indicator) {
		cursor: pointer;
		opacity: 0.6;
		transition: opacity 0.2s;
	}

	:global(.form-input[type="date"]::-webkit-calendar-picker-indicator:hover) {
		opacity: 1;
	}
	
	:global(.form-input:focus) {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}
	
	:global(.badge) {
		display: inline-block;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}
	:global(.badge-pending) { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
	:global(.badge-due) { background: rgba(239, 68, 68, 0.15); color: #f87171; }
	:global(.badge-completed) { background: rgba(16, 185, 129, 0.15); color: #34d399; }
	:global(.badge-canceled) { background: rgba(100, 116, 139, 0.15); color: #94a3b8; }
</style>
