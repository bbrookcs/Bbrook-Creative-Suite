import db from '$lib/server/db.js';
import { fail } from '@sveltejs/kit';

export const load = async () => {
    const [plans] = await db.query(`
        SELECT *, DATEDIFF(target_date, CURRENT_DATE()) as days_remaining 
        FROM self_plans 
        ORDER BY status ASC, days_remaining ASC
    `);

    return {
        plans
    };
};

export const actions = {
    add: async ({ request }) => {
        const formData = await request.formData();
        const title = formData.get('title');
        const description = formData.get('description');
        const targetDate = formData.get('targetDate');
        
        if (!title || !targetDate) {
            return fail(400, { missing: true });
        }
        
        const dateVal = new Date(targetDate).toISOString().slice(0, 19).replace('T', ' ');

        await db.query(
            `INSERT INTO self_plans (title, description, target_date, status) VALUES (?, ?, ?, 'Active')`,
            [title, description || '', dateVal]
        );

        await db.query(
            `INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`,
            ['Created Plan', 'Plans', JSON.stringify({ title, targetDate })]
        );

        return { success: true };
    },
    
    updateStatus: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        const status = formData.get('status');
        
        if (!id || !status) return fail(400, { missing: true });
        
        await db.query(`UPDATE self_plans SET status = ? WHERE id = ?`, [status, id]);
        
        const [plan] = await db.query(`SELECT title FROM self_plans WHERE id = ?`, [id]);
        if (Array.isArray(plan) && plan.length > 0) {
            await db.query(
                `INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`,
                [`Plan ${status}`, 'Plans', JSON.stringify({ title: plan[0].title })]
            );
        }
        
        return { success: true };
    }
};
