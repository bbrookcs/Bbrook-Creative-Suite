import db from '$lib/server/db.js';

export const load = async () => {
    const [logs] = await db.query(`
        SELECT * FROM self_timeline 
        ORDER BY created_at DESC 
        LIMIT 50
    `);

    return {
        logs
    };
};
