import db from '$lib/server/db.js';
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

export async function GET({ request }) {
    // Basic verification for Vercel Cron. In production, Vercel populates CRON_SECRET
    const authHeader = request.headers.get('authorization');
    if (env.VERCEL_ENV === 'production' && authHeader !== `Bearer ${env.CRON_SECRET}`) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [tasks] = await db.query(`SELECT title, due_date FROM self_tasks WHERE status IN ('Pending', 'Due') AND due_date IS NOT NULL`);
        const [shopping] = await db.query(`SELECT item_name as title, due_date FROM self_shopping WHERE status IN ('Pending', 'Due') AND due_date IS NOT NULL`);

        const allItems = [
            ...tasks.map(t => ({ ...t, type: 'Task' })),
            ...shopping.map(s => ({ ...s, type: 'Shopping' }))
        ];

        // Shift to UTC+03:00 to match the user's local timezone (Saudi Arabia/Moscow etc.)
        const now = new Date();
        const localNow = new Date(now.getTime() + (3 * 60 * 60 * 1000));
        
        // Strip time to just get YYYY-MM-DD
        const localTodayStr = localNow.toISOString().split('T')[0];
        
        const tomorrow = new Date(localNow.getTime() + (24 * 60 * 60 * 1000));
        const localTomorrowStr = tomorrow.toISOString().split('T')[0];

        const todayItems = [];
        const tomorrowItems = [];

        for (const item of allItems) {
            // Format db dates string into standard YYYY-MM-DD format
            const dbDate = new Date(item.due_date);
            
            // Adjust to the right offset if dbDate is coming from mysql in UTC
            const localDue = new Date(dbDate.getTime() + (3 * 60 * 60 * 1000));
            const dueStr = localDue.toISOString().split('T')[0];

            if (dueStr === localTodayStr) {
                todayItems.push(item);
            } else if (dueStr === localTomorrowStr) {
                tomorrowItems.push(item);
            } else if (dueStr < localTodayStr) {
                // If the due date was before today and still pending, it's overdue
                todayItems.push({ ...item, overdue: true });
            }
        }

        if (todayItems.length === 0 && tomorrowItems.length === 0) {
            return json({ success: true, message: 'Nothing due today or tomorrow.' });
        }

        let message = `🌅 *Good morning!* Here is your daily briefing:\n\n`;
        
        if (todayItems.length > 0) {
            message += `📌 *DUE TODAY (Or Overdue):*\n`;
            for (const item of todayItems) {
                const prefix = item.type === 'Shopping' ? '🛒' : '✅';
                const overdueStr = item.overdue ? ' ⚠️ (Overdue)' : '';
                message += `${prefix} ${item.title}${overdueStr}\n`;
            }
            message += '\n';
        }

        if (tomorrowItems.length > 0) {
            message += `📅 *DUE TOMORROW:*\n`;
            for (const item of tomorrowItems) {
                const prefix = item.type === 'Shopping' ? '🛒' : '✅';
                message += `${prefix} ${item.title}\n`;
            }
        }

        const token = env.TELEGRAM_BOT_TOKEN;
        const chatId = env.TELEGRAM_CHAT_ID;

        if (token && chatId) {
            const botUrl = `https://api.telegram.org/bot${token}/sendMessage`;
            const tgRes = await fetch(botUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });

            if (!tgRes.ok) {
                console.error("Telegram error:", await tgRes.text());
                return json({ error: 'Failed to send telegram message' }, { status: 500 });
            }
        } else {
            return json({ error: 'Telegram credentials missing' }, { status: 400 });
        }

        return json({ success: true, message: 'Briefing sent successfully' });
    } catch (err) {
        console.error("Cron Error:", err);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
