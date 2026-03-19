import { verifyToken } from '$lib/server/auth.js';
import { initDb } from '$lib/server/db.js';

let dbReady = null;

async function ensureDb() {
	if (dbReady) return dbReady;
	dbReady = initDb();
	return dbReady;
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	await ensureDb();

	const token = event.cookies.get('auth_token');

	if (token) {
		const user = verifyToken(token);
		if (user) {
			event.locals.user = user;
		} else {
			event.cookies.delete('auth_token', { path: '/' });
		}
	}

	if (event.url.pathname.startsWith('/post/dashboard')) {
		if (!event.locals.user) {
			return new Response(null, {
				status: 302,
				headers: { location: '/post' }
			});
		}
	}

	const response = await resolve(event);
	return response;
}
