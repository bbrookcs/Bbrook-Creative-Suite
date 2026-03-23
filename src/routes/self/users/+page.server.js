import db from '$lib/server/db.js';
import { fail } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';

export const load = async () => {
    const [users] = await db.query(`SELECT id, username, role, created_at, last_login, last_active FROM users ORDER BY created_at DESC`);
    return { users };
};

export const actions = {
    createUser: async ({ request }) => {
        const formData = await request.formData();
        const username = formData.get('username')?.trim();
        const password = formData.get('password');
        const role = formData.get('role') || 'viewer';

        if (!username || !password) return fail(400, { error: 'Username and password are required.' });
        if (password.length < 6) return fail(400, { error: 'Password must be at least 6 characters.' });

        const [existing] = await db.query(`SELECT id FROM users WHERE username = ?`, [username]);
        if (existing.length > 0) return fail(400, { error: 'Username already exists.' });

        const hash = await bcrypt.hash(password, 10);
        await db.query(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, [username, hash, role]);

        await db.query(
            `INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`,
            ['Created User', 'Users', JSON.stringify({ username, role })]
        );

        return { success: true };
    },

    changeRole: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        const role = formData.get('role');

        if (!id || !role) return fail(400, { error: 'Missing fields.' });

        await db.query(`UPDATE users SET role = ? WHERE id = ?`, [role, id]);

        await db.query(
            `INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`,
            ['Changed User Role', 'Users', JSON.stringify({ id, role })]
        );

        return { success: true };
    },

    resetPassword: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        const newPassword = formData.get('newPassword');

        if (!id || !newPassword) return fail(400, { error: 'Missing fields.' });
        if (newPassword.length < 6) return fail(400, { error: 'Password must be at least 6 characters.' });

        const hash = await bcrypt.hash(newPassword, 10);
        await db.query(`UPDATE users SET password = ? WHERE id = ?`, [hash, id]);

        await db.query(
            `INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`,
            ['Reset Password', 'Users', JSON.stringify({ id })]
        );

        return { success: true };
    },

    deleteUser: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = parseInt(formData.get('id'));

        if (!id) return fail(400, { error: 'Missing user ID.' });
        if (locals.user?.id === id) return fail(400, { error: 'You cannot delete your own account.' });

        const [user] = await db.query(`SELECT username FROM users WHERE id = ?`, [id]);
        const username = user[0]?.username || `ID:${id}`;

        await db.query(`DELETE FROM users WHERE id = ?`, [id]);

        await db.query(
            `INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`,
            ['Deleted User', 'Users', JSON.stringify({ username })]
        );

        return { success: true };
    }
};
