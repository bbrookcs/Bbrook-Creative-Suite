import db from '$lib/server/db.js';
import { fail } from '@sveltejs/kit';

export const load = async () => {
    // Current month start and end dates for MySQL
    const [finances] = await db.query(`
        SELECT * FROM self_finances 
        ORDER BY date DESC
    `);
    
    // Aggregation for dashboard
    const [totals] = await db.query(`
        SELECT 
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as monthlyIncome,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as monthlyExpense
        FROM self_finances
        WHERE MONTH(date) = MONTH(CURRENT_DATE()) AND YEAR(date) = YEAR(CURRENT_DATE())
    `);

    return {
        finances,
        monthlyIncome: totals[0]?.monthlyIncome || 0,
        monthlyExpense: totals[0]?.monthlyExpense || 0,
        netBalance: (totals[0]?.monthlyIncome || 0) - (totals[0]?.monthlyExpense || 0)
    };
};

export const actions = {
    add: async ({ request }) => {
        const formData = await request.formData();
        const type = formData.get('type');
        const category = formData.get('category');
        const amount = parseFloat(formData.get('amount') || '0');
        const date = formData.get('date');
        
        if (!type || !category || isNaN(amount) || !date) {
            return fail(400, { missing: true });
        }
        
        const dateVal = new Date(date).toISOString().slice(0, 19).replace('T', ' ');

        await db.query(
            `INSERT INTO self_finances (type, category, amount, date) VALUES (?, ?, ?, ?)`,
            [type, category, amount, dateVal]
        );

        await db.query(
            `INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`,
            ['Added Transaction', 'Finances', JSON.stringify({ type, category, amount })]
        );

        return { success: true };
    },
    
    delete: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        
        if (!id) return fail(400, { missing: true });
        
        await db.query(`DELETE FROM self_finances WHERE id = ?`, [id]);
        
        return { success: true };
    }
};
