import db from '$lib/server/db.js';
import { redirect } from '@sveltejs/kit';

export const load = async ({ url }) => {
    await db.initDb(); // Safely ensure memory tables exist
    
    const [sessions] = await db.query(`SELECT id, title, updated_at FROM self_chat_sessions ORDER BY updated_at DESC`);
    
    const isNew = url.searchParams.has('new');
    const sessionId = url.searchParams.get('session');
    
    // Default to the latest previous conversation
    if (!sessionId && !isNew && sessions.length > 0) {
        throw redirect(302, `/self/ai?session=${sessions[0].id}`);
    }

    let messages = [];
    
    if (sessionId) {
        const [rows] = await db.query(`SELECT id, role, content as text, created_at FROM self_chat_messages WHERE session_id = ? ORDER BY created_at ASC`, [sessionId]);
        messages = rows;
    }
    
    return {
        sessions,
        sessionId: sessionId ? parseInt(sessionId) : null,
        initialMessages: messages
    };
};
