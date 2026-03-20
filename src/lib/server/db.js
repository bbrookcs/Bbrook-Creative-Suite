import mysql from 'mysql2/promise';
import { env } from '$env/dynamic/private';

/** @type {mysql.Pool} */
let pool;

function getPool() {
	if (!pool) {
		const url = env.DATABASE_URL;
		if (!url) {
			throw new Error('DATABASE_URL is not set. Add it to .env and restart the dev server.');
		}
		pool = mysql.createPool(url);
	}
	return pool;
}

/**
 * Run schema: create tables if they don't exist (safe to run on every cold start).
 */
export async function initDb() {
	const p = getPool();
	await p.query(`
		CREATE TABLE IF NOT EXISTS users (
			id INT AUTO_INCREMENT PRIMARY KEY,
			username VARCHAR(255) UNIQUE NOT NULL,
			password VARCHAR(255) NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);
	await p.query(`
		CREATE TABLE IF NOT EXISTS posts (
			id INT AUTO_INCREMENT PRIMARY KEY,
			title VARCHAR(500) NOT NULL,
			slug VARCHAR(500) UNIQUE NOT NULL,
			excerpt TEXT,
			content LONGTEXT,
			status VARCHAR(20) DEFAULT 'draft',
			meta_title VARCHAR(500) DEFAULT '',
			meta_description TEXT,
			og_image VARCHAR(1000) DEFAULT '',
			tags JSON,
			images JSON,
			quote_text TEXT,
			quote_source VARCHAR(255),
			quote_url VARCHAR(1000),
			reading_time INT DEFAULT 1,
			upvotes INT DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			published_at DATETIME NULL,
			INDEX idx_slug (slug),
			INDEX idx_status (status),
			INDEX idx_published_at (published_at)
		)
	`);
	await p.query(`
		CREATE TABLE IF NOT EXISTS post_votes (
			id INT AUTO_INCREMENT PRIMARY KEY,
			post_id INT NOT NULL,
			device_id VARCHAR(128) NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE KEY unique_vote (post_id, device_id),
			INDEX idx_post_id (post_id)
		)
	`);

	try {
		await p.query(`ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'admin'`);
	} catch (e) {
		// Ignore if column already exists
	}

	await p.query(`
		CREATE TABLE IF NOT EXISTS self_tasks (
			id INT AUTO_INCREMENT PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			description TEXT,
			due_date DATETIME,
			status VARCHAR(50) DEFAULT 'Pending',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		)
	`);

	await p.query(`
		CREATE TABLE IF NOT EXISTS self_shopping (
			id INT AUTO_INCREMENT PRIMARY KEY,
			item_name VARCHAR(255) NOT NULL,
			category VARCHAR(255) DEFAULT 'General',
			status VARCHAR(50) DEFAULT 'Pending',
			due_date DATETIME,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		)
	`);

	await p.query(`
		CREATE TABLE IF NOT EXISTS self_plans (
			id INT AUTO_INCREMENT PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			description TEXT,
			target_date DATETIME,
			status VARCHAR(50) DEFAULT 'Active',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		)
	`);

	await p.query(`
		CREATE TABLE IF NOT EXISTS self_notes (
			id INT AUTO_INCREMENT PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			content LONGTEXT,
			tags JSON,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		)
	`);

	await p.query(`
		CREATE TABLE IF NOT EXISTS self_timeline (
			id INT AUTO_INCREMENT PRIMARY KEY,
			action VARCHAR(255) NOT NULL,
			module VARCHAR(255) NOT NULL,
			details JSON,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	await p.query(`
		CREATE TABLE IF NOT EXISTS self_finances (
			id INT AUTO_INCREMENT PRIMARY KEY,
			type VARCHAR(50) NOT NULL,
			category VARCHAR(255) NOT NULL,
			amount DECIMAL(10, 2) NOT NULL,
			date DATETIME NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		)
	`);

	await p.query(`
		CREATE TABLE IF NOT EXISTS self_chat_sessions (
			id INT AUTO_INCREMENT PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		)
	`);

	await p.query(`
		CREATE TABLE IF NOT EXISTS self_chat_messages (
			id INT AUTO_INCREMENT PRIMARY KEY,
			session_id INT NOT NULL,
			role VARCHAR(50) NOT NULL,
			content LONGTEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (session_id) REFERENCES self_chat_sessions(id) ON DELETE CASCADE
		)
	`);

	await p.query(`
		CREATE TABLE IF NOT EXISTS self_ai_memory (
			id INT AUTO_INCREMENT PRIMARY KEY,
			fact_text TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);
}

/**
 * Get a connection from the pool for queries.
 * Use execute() for prepared statements (recommended).
 */
export function query(sql, params = []) {
	return getPool().execute(sql, params);
}

export default { getPool, initDb, query };
