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
	// Add upvotes column for existing databases
	try {
		await p.query('ALTER TABLE posts ADD COLUMN upvotes INT DEFAULT 0');
	} catch (_) {
		// Column already exists
	}
	
	// Add quote columns for existing databases
	try {
		await p.query('ALTER TABLE posts ADD COLUMN quote_text TEXT');
	} catch (_) {
		// Column already exists
	}
	try {
		await p.query('ALTER TABLE posts ADD COLUMN quote_source VARCHAR(255)');
	} catch (_) {
		// Column already exists
	}
	try {
		await p.query('ALTER TABLE posts ADD COLUMN quote_url VARCHAR(1000)');
	} catch (_) {
		// Column already exists
	}
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
}

/**
 * Get a connection from the pool for queries.
 * Use execute() for prepared statements (recommended).
 */
export function query(sql, params = []) {
	return getPool().execute(sql, params);
}

export default { getPool, initDb, query };
