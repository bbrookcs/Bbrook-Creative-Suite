import db from '$lib/server/db.js';

export const load = async () => {
    // Basic stats (Exclude overdue items by checking if they are >= CURRENT_DATE)
    const [[{ pendingTasks }]] = await db.query(`SELECT COUNT(*) as pendingTasks FROM self_tasks WHERE status = 'Pending' AND (due_date IS NULL OR due_date >= CURRENT_DATE())`);
    const [[{ pendingShopping }]] = await db.query(`SELECT COUNT(*) as pendingShopping FROM self_shopping WHERE status = 'Pending' AND (due_date IS NULL OR due_date >= CURRENT_DATE())`);
    const [[{ activePlans }]] = await db.query(`SELECT COUNT(*) as activePlans FROM self_plans WHERE status = 'Active'`);
    
    // Monthly Income
    const [[{ monthlyIncome }]] = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as monthlyIncome 
        FROM self_finances 
        WHERE type = 'income' AND MONTH(date) = MONTH(CURRENT_DATE()) AND YEAR(date) = YEAR(CURRENT_DATE())
    `);

    // Upcoming Tasks
    const [upcomingTasks] = await db.query(`
        SELECT * FROM self_tasks 
        WHERE status IN ('Pending', 'Due') AND due_date IS NOT NULL
        ORDER BY due_date ASC 
        LIMIT 5
    `);

    // Active Plans
    const [activePlanList] = await db.query(`
        SELECT *, DATEDIFF(target_date, CURRENT_DATE()) as days_remaining 
        FROM self_plans 
        WHERE status = 'Active'
        ORDER BY days_remaining ASC
    `);

    return {
        stats: {
            pendingTasks,
            pendingShopping,
            activePlans,
            monthlyIncome
        },
        upcomingTasks,
        activePlanList
    };
};
