import db from '$lib/server/db.js';
import { fail } from '@sveltejs/kit';

export const load = async () => {
    const [items] = await db.query(`
        SELECT * FROM self_shopping 
        ORDER BY category ASC, 
        CASE 
            WHEN status = 'Pending' THEN 1
            WHEN status = 'Due' THEN 2
            WHEN status = 'Bought' THEN 3
            ELSE 4
        END, due_date ASC
    `);

    return {
        items
    };
};

export const actions = {
    add: async ({ request }) => {
        const formData = await request.formData();
        const itemName = formData.get('itemName');
        const category = formData.get('category') || 'General';
        const dueDate = formData.get('dueDate');
        
        if (!itemName) {
            return fail(400, { itemName, missing: true });
        }
        
        const dateVal = dueDate ? new Date(dueDate).toISOString().slice(0, 19).replace('T', ' ') : null;

        await db.query(
            `INSERT INTO self_shopping (item_name, category, due_date, status) VALUES (?, ?, ?, 'Pending')`,
            [itemName, category, dateVal]
        );

        await db.query(
            `INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`,
            ['Added Item', 'Shopping', JSON.stringify({ item: itemName, category })]
        );

        return { success: true };
    },
    
    updateStatus: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        const status = formData.get('status');
        
        if (!id || !status) return fail(400, { missing: true });
        
        await db.query(`UPDATE self_shopping SET status = ? WHERE id = ?`, [status, id]);
        
        const [item] = await db.query(`SELECT item_name FROM self_shopping WHERE id = ?`, [id]);
        if (Array.isArray(item) && item.length > 0) {
            await db.query(
                `INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`,
                [`Item ${status}`, 'Shopping', JSON.stringify({ item: item[0].item_name })]
            );
        }
        
        return { success: true };
    }
};
