import { env } from '$env/dynamic/private';
import db from './db.js';

const TELEGRAM_API = 'https://api.telegram.org';

/**
 * Send a message to the configured Telegram bot chat.
 * @param {string} text - HTML-formatted message text
 */
export async function sendTelegramMessage(text) {
	const token = env.TELEGRAM_BOT_TOKEN;
	const chatId = env.TELEGRAM_CHAT_ID;

	if (!token || !chatId) {
		console.warn('[Telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set.');
		return;
	}

	const url = `${TELEGRAM_API}/bot${token}/sendMessage`;
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			chat_id: chatId,
			text,
			parse_mode: 'HTML'
		})
	});

	if (!res.ok) {
		const body = await res.text();
		console.error('[Telegram] Failed to send message:', body);
	} else {
		console.log('[Telegram] Notification sent successfully.');
	}
}

/**
 * Format a DB date value into a readable short string.
 * @param {any} d
 */
function dateLabel(d) {
	const date = new Date(d);
	return date.toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

/**
 * Fetch tasks/shopping due today or tomorrow and send a Telegram notification.
 */
export async function sendDailyNotification() {
	console.log('[Telegram] Running daily notification check...');

	const now = new Date();

	// Today window
	const todayStart = new Date(now);
	todayStart.setHours(0, 0, 0, 0);
	const todayEnd = new Date(now);
	todayEnd.setHours(23, 59, 59, 999);

	// Tomorrow window
	const tomorrowStart = new Date(now);
	tomorrowStart.setDate(now.getDate() + 1);
	tomorrowStart.setHours(0, 0, 0, 0);
	const tomorrowEnd = new Date(now);
	tomorrowEnd.setDate(now.getDate() + 1);
	tomorrowEnd.setHours(23, 59, 59, 999);

	/** @param {Date} d */
	const fmt = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

	// Tasks due today
	const tasksToday = /** @type {any[]} */ (
		(await db.query(
			`SELECT title, description, due_date FROM self_tasks 
			 WHERE due_date BETWEEN ? AND ? 
			 AND status NOT IN ('Completed', 'Done', 'Cancelled', 'Canceled')
			 ORDER BY due_date ASC`,
			[fmt(todayStart), fmt(todayEnd)]
		))[0]
	);

	// Tasks due tomorrow
	const tasksTomorrow = /** @type {any[]} */ (
		(await db.query(
			`SELECT title, description, due_date FROM self_tasks 
			 WHERE due_date BETWEEN ? AND ? 
			 AND status NOT IN ('Completed', 'Done', 'Cancelled', 'Canceled')
			 ORDER BY due_date ASC`,
			[fmt(tomorrowStart), fmt(tomorrowEnd)]
		))[0]
	);

	// Shopping due today
	const shoppingToday = /** @type {any[]} */ (
		(await db.query(
			`SELECT item_name, category, due_date FROM self_shopping 
			 WHERE due_date BETWEEN ? AND ? 
			 AND status NOT IN ('Bought', 'Completed', 'Cancelled', 'Canceled')
			 ORDER BY due_date ASC`,
			[fmt(todayStart), fmt(todayEnd)]
		))[0]
	);

	// Shopping due tomorrow
	const shoppingTomorrow = /** @type {any[]} */ (
		(await db.query(
			`SELECT item_name, category, due_date FROM self_shopping 
			 WHERE due_date BETWEEN ? AND ? 
			 AND status NOT IN ('Bought', 'Completed', 'Cancelled', 'Canceled')
			 ORDER BY due_date ASC`,
			[fmt(tomorrowStart), fmt(tomorrowEnd)]
		))[0]
	);

	// If nothing is due, skip notification
	const hasAnything =
		tasksToday.length > 0 ||
		tasksTomorrow.length > 0 ||
		shoppingToday.length > 0 ||
		shoppingTomorrow.length > 0;

	if (!hasAnything) {
		console.log('[Telegram] Nothing due today or tomorrow — skipping notification.');
		return;
	}

	/** @type {string[]} */
	const lines = [];
	lines.push('🔔 <b>Daily Reminder</b>');
	lines.push('');

	// Tasks Today
	if (tasksToday.length > 0) {
		lines.push('📋 <b>Tasks due TODAY:</b>');
		for (const t of tasksToday) {
			lines.push(`  • <b>${t.title}</b>${t.description ? ` — ${t.description}` : ''}`);
			if (t.due_date) lines.push(`     ${dateLabel(t.due_date)}`);
		}
		lines.push('');
	}

	// Tasks Tomorrow
	if (tasksTomorrow.length > 0) {
		lines.push('📋 <b>Tasks due TOMORROW:</b>');
		for (const t of tasksTomorrow) {
			lines.push(`  • <b>${t.title}</b>${t.description ? ` — ${t.description}` : ''}`);
			if (t.due_date) lines.push(`     ${dateLabel(t.due_date)}`);
		}
		lines.push('');
	}

	// Shopping Today
	if (shoppingToday.length > 0) {
		lines.push('🛒 <b>Shopping due TODAY:</b>');
		for (const s of shoppingToday) {
			lines.push(`  • <b>${s.item_name}</b> <i>[${s.category}]</i>`);
			if (s.due_date) lines.push(`     ${dateLabel(s.due_date)}`);
		}
		lines.push('');
	}

	// Shopping Tomorrow
	if (shoppingTomorrow.length > 0) {
		lines.push('🛒 <b>Shopping due TOMORROW:</b>');
		for (const s of shoppingTomorrow) {
			lines.push(`  • <b>${s.item_name}</b> <i>[${s.category}]</i>`);
			if (s.due_date) lines.push(`     ${dateLabel(s.due_date)}`);
		}
		lines.push('');
	}

	await sendTelegramMessage(lines.join('\n'));
}
