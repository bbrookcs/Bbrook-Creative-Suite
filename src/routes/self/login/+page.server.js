import { fail, redirect } from '@sveltejs/kit';
import { login } from '$lib/server/auth.js';

export const load = ({ locals }) => {
    if (locals.user && locals.user.role === 'self') {
        throw redirect(302, '/self');
    }
};

export const actions = {
    default: async ({ request, cookies }) => {
        const formData = await request.formData();
        const username = formData.get('username');
        const password = formData.get('password');

        if (!username || !password) {
            return fail(400, { missing: true });
        }

        const result = await login(username, password);
        if (!result) {
            return fail(401, { invalid: true });
        }

        if (result.user.role !== 'self') {
            return fail(403, { notAdmin: true });
        }

        cookies.set('auth_token', result.token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        throw redirect(302, '/self');
    }
};
