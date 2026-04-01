import db from '$lib/server/db.js';
import { json } from '@sveltejs/kit';

export async function DELETE({ request }) {
    try {
        const { id } = await request.json();
        
        if (!id) {
            return json({ error: 'Missing message id' }, { status: 400 });
        }

        await db.query(`DELETE FROM self_chat_messages WHERE id = ?`, [id]);
        
        return json({ success: true });
    } catch (err) {
        console.error("Message delete failed: ", err);
        return json({ error: 'System error' }, { status: 500 });
    }
}
