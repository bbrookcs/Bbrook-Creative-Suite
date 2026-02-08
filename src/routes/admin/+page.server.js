import { redirect, fail } from '@sveltejs/kit';
import { login } from '$lib/server/auth.js';

/** @type {import('./$types').PageServerLoad} */
export function load({ locals }) {
	if (locals.user) {
		redirect(302, '/admin/dashboard');
	}
}

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const username = form.get('username')?.toString() || '';
		const password = form.get('password')?.toString() || '';

		if (!username || !password) {
			return fail(400, { error: 'Username and password are required' });
		}

		const result = await login(username, password);
		if (!result) {
			return fail(401, { error: 'Invalid credentials' });
		}

		cookies.set('auth_token', result.token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false, // Set to true in production with HTTPS
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		redirect(302, '/admin/dashboard');
	}
};
