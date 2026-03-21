import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';

export async function DELETE({ request }) {
    try {
        const { id } = await request.json();
        if (!id) return json({ error: "Missing session ID" }, { status: 400 });

        await db.query(`DELETE FROM self_chat_sessions WHERE id = ?`, [id]);
        return json({ success: true });
    } catch (e) {
        console.error("Failed to delete session:", e);
        return json({ error: "Server error" }, { status: 500 });
    }
}

export async function PATCH({ request }) {
    try {
        const { id, title } = await request.json();
        if (!id || !title) return json({ error: "Missing required fields" }, { status: 400 });

        await db.query(`UPDATE self_chat_sessions SET title = ? WHERE id = ?`, [title, id]);
        return json({ success: true });
    } catch (e) {
        console.error("Failed to rename session:", e);
        return json({ error: "Server error" }, { status: 500 });
    }
}
