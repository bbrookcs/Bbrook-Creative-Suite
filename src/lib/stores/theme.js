import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * @typedef {'light' | 'dark' | 'system'} ThemePreference
 */

function createThemeStore() {
	/** @type {ThemePreference} */
	const initial = browser
		? /** @type {ThemePreference} */ (localStorage.getItem('theme-preference') || 'light')
		: 'light';

	const { subscribe, set, update } = writable(initial);

	return {
		subscribe,
		set(/** @type {ThemePreference} */ value) {
			if (browser) {
				localStorage.setItem('theme-preference', value);
				applyTheme(value);
			}
			set(value);
		},
		toggle() {
			update((current) => {
				/** @type {ThemePreference} */
				let next;
				if (current === 'system') {
					next = 'dark';
				} else if (current === 'dark') {
					next = 'light';
				} else {
					next = 'system';
				}
				if (browser) {
					localStorage.setItem('theme-preference', next);
					applyTheme(next);
				}
				return next;
			});
		},
		init() {
			if (browser) {
				const pref = /** @type {ThemePreference} */ (
					localStorage.getItem('theme-preference') || 'light'
				);
				applyTheme(pref);
				set(pref);
			}
		}
	};
}

/**
 * @param {ThemePreference} preference
 */
function applyTheme(preference) {
	if (!browser) return;
	const root = document.documentElement;
	if (preference === 'system') {
		const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		root.setAttribute('data-theme', isDark ? 'dark' : 'light');
	} else {
		root.setAttribute('data-theme', preference);
	}
}

export const theme = createThemeStore();
