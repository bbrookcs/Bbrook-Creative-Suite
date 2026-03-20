<script>
	import '../app.css';
	import Header from '$components/Header.svelte';
	import { theme } from '$stores/theme.js';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let { children } = $props();

	onMount(() => {
		theme.init();

		// Listen for system theme changes
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		const handler = () => {
			const pref = localStorage.getItem('theme-preference') || 'light';
			if (pref === 'system') {
				document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light');
			}
		};
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});

	const isPost = $derived($page.url.pathname.startsWith('/post'));
	const isSelf = $derived($page.url.pathname.startsWith('/self'));
	const isError = $derived(!!$page.error);
	const hideChrome = $derived(isPost || isError || isSelf);
</script>

{#if !hideChrome}
	<Header />
{/if}

<main class:admin-layout={hideChrome}>
	{@render children()}
</main>

{#if !hideChrome}
	<footer class="site-footer">
		<div class="container">
			<p>&copy; {new Date().getFullYear()} bbrookcs</p>
		</div>
	</footer>
{/if}

<style>
	main {
		min-height: calc(100vh - 140px);
		padding-top: 1rem;
		padding-bottom: 1.5rem;
	}

	main.admin-layout {
		min-height: 100vh;
		padding-top: 0;
		padding-bottom: 0;
	}

	.site-footer {
		padding: 2rem 0;
		text-align: center;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		border-top: 1px solid var(--color-border-light);
	}
</style>
