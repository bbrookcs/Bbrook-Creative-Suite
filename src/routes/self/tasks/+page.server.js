import db from '$lib/server/db.js';
import { fail } from '@sveltejs/kit';

export const load = async () => {
    const [tasks] = await db.query(`
        SELECT * FROM self_tasks 
        ORDER BY CASE 
            WHEN status = 'Due' THEN 1
            WHEN status = 'Pending' THEN 2
            WHEN status = 'Completed' THEN 3
            ELSE 4
        END, due_date ASC
    `);

    return {
        tasks
    };
};

export const actions = {
    add: async ({ request }) => {
        const formData = await request.formData();
        const title = formData.get('title');
        const description = formData.get('description');
        const dueDate = formData.get('dueDate');
        
        if (!title) {
            return fail(400, { title, missing: true });
        }
        
        const dateVal = dueDate ? new Date(dueDate).toISOString().slice(0, 19).replace('T', ' ') : null;

        await db.query(
            `INSERT INTO self_tasks (title, description, due_date, status) VALUES (?, ?, ?, 'Pending')`,
            [title, description || '', dateVal]
        );

        await db.query(
            `INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`,
            ['Created Task', 'Tasks', JSON.stringify({ title })]
        );

        return { success: true };
    },
    
    updateStatus: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        const status = formData.get('status');
        
        if (!id || !status) return fail(400, { missing: true });
        
        await db.query(`UPDATE self_tasks SET status = ? WHERE id = ?`, [status, id]);
        
        const [task] = await db.query(`SELECT title FROM self_tasks WHERE id = ?`, [id]);
        if (task.length > 0) {
            await db.query(
                `INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`,
                [`Task ${status}`, 'Tasks', JSON.stringify({ title: task[0].title })]
            );
        }
        
        return { success: true };
    }
};
