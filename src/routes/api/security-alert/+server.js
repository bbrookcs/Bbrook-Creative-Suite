import { sendTelegramMessage } from '$lib/server/telegram.js';
import { json } from '@sveltejs/kit';

export async function POST({ request, getClientAddress }) {
	try {
		const { message } = await request.json();
		if (!message) return json({ error: 'Message required' }, { status: 400 });

		// Grab device IP if possible for the alert
		let ip = 'Unknown IP';
		try {
			ip = getClientAddress();
		} catch (e) {
			// fallback
		}

		const userAgent = request.headers.get('user-agent') || '';

		// Parse the noisy User-Agent string into human readable names
		let os = 'Unknown Device';
		if (userAgent.includes('Win')) os = 'Windows';
		else if (userAgent.includes('Mac')) os = 'macOS';
		else if (userAgent.includes('Android')) os = 'Android';
		else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
		else if (userAgent.includes('Linux')) os = 'Linux';

		let browser = 'Unknown Browser';
		if (userAgent.includes('Firefox')) browser = 'Firefox';
		else if (userAgent.includes('OPR') || userAgent.includes('Opera')) browser = 'Opera';
		else if (userAgent.includes('Edg')) browser = 'Edge';
		else if (userAgent.includes('Chrome')) browser = 'Chrome';
		else if (userAgent.includes('Safari')) browser = 'Safari';

		const fullMessage = `🚨 <b>OS SECURITY ALERT</b> 🚨\n\n${message}\n\n📍 <i>IP: ${ip}</i>\n💻 <i>Device: ${os}</i>\n🌐 <i>Browser: ${browser}</i>`;
		await sendTelegramMessage(fullMessage);

		return json({ ok: true });
	} catch (err) {
		console.error('[security-alert endpoint]', err);
		return json({ error: String(err) }, { status: 500 });
	}
}
