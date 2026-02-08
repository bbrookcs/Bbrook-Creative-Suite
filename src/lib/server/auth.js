import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import db from './db.js';

const TOKEN_EXPIRY = '7d';

function getJwtSecret() {
	return env.JWT_SECRET || env.AUTH_SECRET || 'placeholder-secret-change-in-production';
}

/**
 * Initialize admin user if none exists. Call after initDb().
 */
export async function ensureAdminExists() {
	const [rows] = await db.query('SELECT id FROM users LIMIT 1');
	if (rows.length === 0) {
		const hash = bcrypt.hashSync('admin', 10);
		await db.query('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hash]);
	}
}

export async function login(username, password) {
	const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
	const user = rows[0];
	if (!user) return null;

	const valid = bcrypt.compareSync(password, user.password);
	if (!valid) return null;

	const token = jwt.sign({ id: user.id, username: user.username }, getJwtSecret(), {
		expiresIn: TOKEN_EXPIRY
	});

	return { token, user: { id: user.id, username: user.username } };
}

export function verifyToken(token) {
	try {
		const decoded = jwt.verify(token, getJwtSecret());
		return /** @type {{ id: number, username: string }} */ (decoded);
	} catch {
		return null;
	}
}

export async function changePassword(userId, newPassword) {
	const hash = bcrypt.hashSync(newPassword, 10);
	await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, userId]);
}
