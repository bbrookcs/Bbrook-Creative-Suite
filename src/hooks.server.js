import { verifyToken } from '$lib/server/auth.js';
import db, { initDb } from '$lib/server/db.js';

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
		const decoded = verifyToken(token);
		if (decoded) {
			/** @type {any} */
			const queryRes = await db.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
			const realUser = queryRes[0][0];

			if (realUser) {
				event.locals.user = { id: realUser.id, username: realUser.username, role: realUser.role };

				const lastActive = realUser.last_active ? new Date(realUser.last_active).getTime() : 0;
				if (Date.now() - lastActive > 5 * 60 * 1000) {
					db.query('UPDATE users SET last_active = NOW() WHERE id = ?', [realUser.id]).catch(() => {});
				}
			} else {
				event.cookies.delete('auth_token', { path: '/' });
				delete event.locals.user;
			}
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

	if (event.url.pathname.startsWith('/self') && !event.url.pathname.startsWith('/self/login')) {
		if (!event.locals.user || event.locals.user.role !== 'admin') {
			return new Response(null, {
				status: 302,
				headers: { location: '/self/login' }
			});
		}
	}

	const response = await resolve(event);
	return response;
}
