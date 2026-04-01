import { verifyToken } from '$lib/server/auth.js';
import db, { initDb } from '$lib/server/db.js';
import { sendDailyNotification } from '$lib/server/telegram.js';

let dbReady = null;
let schedulerStarted = false;

async function ensureDb() {
	if (dbReady) return dbReady;
	dbReady = initDb();
	return dbReady;
}

/**
 * Start the 24-hour Telegram notification scheduler.
 * Runs once on server cold-start, then every 24 hours.
 * Guard with `schedulerStarted` to prevent duplicate intervals on HMR reloads.
 */
async function startNotificationScheduler() {
	if (schedulerStarted) return;
	schedulerStarted = true;

	// Wait for DB to be ready first
	await ensureDb();

	// Fire immediately on startup
	sendDailyNotification().catch((e) => console.error('[Telegram] Startup notification error:', e));

	// Then repeat every 24 hours
	setInterval(() => {
		sendDailyNotification().catch((e) => console.error('[Telegram] Scheduled notification error:', e));
	}, 24 * 60 * 60 * 1000);

	console.log('[Telegram] Daily notification scheduler started (every 24h).');
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	await ensureDb();
	startNotificationScheduler();

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
		if (!event.locals.user || event.locals.user.role !== 'self') {
			return new Response(null, {
				status: 302,
				headers: { location: '/self/login' }
			});
		}
	}

	const response = await resolve(event);
	return response;
}
