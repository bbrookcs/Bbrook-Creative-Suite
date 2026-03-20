import db from '$lib/server/db.js';
import { fail } from '@sveltejs/kit';

export const load = async () => {
    const [notes] = await db.query(`
        SELECT * FROM self_notes 
        ORDER BY created_at DESC
    `);

    return {
        notes
    };
};

export const actions = {
    add: async ({ request }) => {
        const formData = await request.formData();
        const title = formData.get('title');
        const content = formData.get('content');
        const tagsRaw = formData.get('tags');
        
        if (!title || !content) {
            return fail(400, { missing: true });
        }

        const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(t => t) : [];

        await db.query(
            `INSERT INTO self_notes (title, content, tags) VALUES (?, ?, ?)`,
            [title, content, JSON.stringify(tags)]
        );

        await db.query(
            `INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`,
            ['Added Note', 'Notes', JSON.stringify({ title, tags })]
        );

        return { success: true };
    },
    
    delete: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        
        if (!id) return fail(400, { missing: true });
        
        await db.query(`DELETE FROM self_notes WHERE id = ?`, [id]);
        
        return { success: true };
    }
};
