import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import db from './db.js';

const TOKEN_EXPIRY = '7d';

function getJwtSecret() {
	return env.JWT_SECRET || env.AUTH_SECRET || 'placeholder-secret-change-in-production';
}

export async function login(username, password) {
	const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
	const user = rows[0];
	if (!user) return null;

	const valid = bcrypt.compareSync(password, user.password);
	if (!valid) return null;

	const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, getJwtSecret(), {
		expiresIn: TOKEN_EXPIRY
	});

	return { token, user: { id: user.id, username: user.username, role: user.role } };
}

export function verifyToken(token) {
	try {
		const decoded = jwt.verify(token, getJwtSecret());
		return /** @type {{ id: number, username: string, role: string }} */ (decoded);
	} catch {
		return null;
	}
}

export async function changePassword(userId, newPassword) {
	const hash = bcrypt.hashSync(newPassword, 10);
	await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, userId]);
}
