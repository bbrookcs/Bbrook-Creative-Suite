import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ cookies }) => {
		cookies.delete('auth_token', { path: '/' });
		redirect(302, '/admin');
	}
};
