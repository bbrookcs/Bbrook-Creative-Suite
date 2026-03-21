import db from '$lib/server/db.js';

export const load = async ({ url }) => {
    await db.initDb(); // Safely ensure memory tables exist
    
    const [sessions] = await db.query(`SELECT id, title, updated_at FROM self_chat_sessions ORDER BY updated_at DESC`);
    
    const sessionId = url.searchParams.get('session');
    let messages = [];
    
    if (sessionId) {
        const [rows] = await db.query(`SELECT role, content as text FROM self_chat_messages WHERE session_id = ? ORDER BY created_at ASC`, [sessionId]);
        messages = rows;
    }
    
    return {
        sessions,
        sessionId: sessionId ? parseInt(sessionId) : null,
        initialMessages: messages
    };
};
