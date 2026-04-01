import { sendDailyNotification } from '$lib/server/telegram.js';
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

/**
 * GET /api/notify
 * Manually trigger the daily Telegram notification.
 * Protected by NOTIFY_SECRET env var (optional, good practice).
 */
export async function GET({ url }) {
	// Optional secret guard — set NOTIFY_SECRET in .env for extra safety
	const secret = env.NOTIFY_SECRET;
	if (secret) {
		const provided = url.searchParams.get('secret');
		if (provided !== secret) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
	}

	try {
		await sendDailyNotification();
		return json({ ok: true, message: 'Notification sent (if items due).' });
	} catch (err) {
		console.error('[notify endpoint]', err);
		return json({ error: String(err) }, { status: 500 });
	}
}
