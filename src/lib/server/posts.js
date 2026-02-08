import db from './db.js';
import slugify from 'slugify';

function calculateReadingTime(content) {
	const text = content.replace(/<[^>]*>/g, '').replace(/[#*`~\[\]]/g, '');
	const words = text.split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.ceil(words / 200));
}

async function generateSlug(title, excludeId = null) {
	let slug = slugify(title, { lower: true, strict: true });
	const [rows] = excludeId
		? await db.query('SELECT id FROM posts WHERE slug = ? AND id != ?', [slug, excludeId])
		: await db.query('SELECT id FROM posts WHERE slug = ?', [slug]);
	if (rows.length > 0) slug = `${slug}-${Date.now()}`;
	return slug;
}

function parseJson(val) {
	if (val == null) return [];
	if (typeof val === 'object') return val;
	try {
		return JSON.parse(val);
	} catch {
		return [];
	}
}

export async function getPublishedPosts({ page = 1, limit = 10, search = '', tag = '' } = {}) {
	const offset = (parseInt(page) - 1) * parseInt(limit);
	const limitInt = parseInt(limit);
	
	let where = "WHERE status = 'published'";
	const params = [];

	if (search) {
		where += ' AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ?)';
		const s = `%${search}%`;
		params.push(s, s, s);
	}
	if (tag) {
		where += ' AND JSON_CONTAINS(tags, ?)';
		params.push(JSON.stringify(String(tag)));
	}

	const [countRows] = await db.query(`SELECT COUNT(*) as count FROM posts ${where}`, params);
	const total = countRows[0]?.count ?? 0;

	// Use string interpolation for LIMIT/OFFSET since MySQL has issues with parameterized LIMIT/OFFSET
	const [posts] = await db.query(
		`SELECT id, title, slug, excerpt, content, tags, reading_time, upvotes, published_at, created_at
     FROM posts ${where}
     ORDER BY published_at DESC
     LIMIT ${limitInt} OFFSET ${offset}`,
		params
	);

	return {
		posts: posts.map((p) => ({ ...p, tags: parseJson(p.tags) })),
		total: Number(total),
		page: parseInt(page),
		totalPages: Math.ceil(Number(total) / limitInt)
	};
}

export async function getPostBySlug(slug) {
	const [rows] = await db.query(
		"SELECT * FROM posts WHERE slug = ? AND status = 'published'",
		[slug]
	);
	const post = rows[0];
	if (!post) return null;
	return {
		...post,
		tags: parseJson(post.tags),
		images: parseJson(post.images)
	};
}

export async function getAllPosts({ page = 1, limit = 20 } = {}) {
	const offset = (parseInt(page) - 1) * parseInt(limit);
	const limitInt = parseInt(limit);
	
	const [countRows] = await db.query('SELECT COUNT(*) as count FROM posts');
	const total = countRows[0]?.count ?? 0;

	// Use string interpolation for LIMIT/OFFSET since MySQL has issues with parameterized LIMIT/OFFSET
	const [posts] = await db.query(
		`SELECT id, title, slug, excerpt, status, tags, reading_time, created_at, updated_at, published_at
     FROM posts ORDER BY updated_at DESC LIMIT ${limitInt} OFFSET ${offset}`,
		[]
	);

	return {
		posts: posts.map((p) => ({ ...p, tags: parseJson(p.tags) })),
		total: Number(total),
		page: parseInt(page),
		totalPages: Math.ceil(Number(total) / limitInt)
	};
}

export async function getPostById(id) {
	const [rows] = await db.query('SELECT * FROM posts WHERE id = ?', [id]);
	const post = rows[0];
	if (!post) return null;
	return {
		...post,
		tags: parseJson(post.tags),
		images: parseJson(post.images)
	};
}

export async function createPost(data) {
	const slug = await generateSlug(data.title);
	const readingTime = calculateReadingTime(data.content || '');
	const now = new Date();
	const publishedAt = data.status === 'published' ? now : null;

	const tagsJson = JSON.stringify(data.tags || []);
	const imagesJson = JSON.stringify(data.images || []);

	const [result] = await db.query(
		`INSERT INTO posts (title, slug, excerpt, content, status, meta_title, meta_description, og_image, tags, images, reading_time, created_at, updated_at, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			data.title,
			slug,
			data.excerpt || '',
			data.content || '',
			data.status || 'draft',
			data.meta_title || '',
			data.meta_description || '',
			data.og_image || '',
			tagsJson,
			imagesJson,
			readingTime,
			now,
			now,
			publishedAt
		]
	);

	return { id: result.insertId, slug };
}

export async function updatePost(id, data) {
	const [existingRows] = await db.query('SELECT * FROM posts WHERE id = ?', [id]);
	const ex = existingRows[0];
	if (!ex) return null;

	const slug =
		data.title !== ex.title ? await generateSlug(data.title, id) : ex.slug;
	const readingTime = calculateReadingTime(data.content || ex.content);
	const now = new Date();

	let publishedAt = ex.published_at;
	if (data.status === 'published' && ex.status !== 'published') {
		publishedAt = now;
	} else if (data.status === 'draft') {
		publishedAt = null;
	}

	const tagsJson = JSON.stringify(
		data.tags ?? parseJson(ex.tags)
	);
	const imagesJson = JSON.stringify(
		data.images ?? parseJson(ex.images)
	);

	await db.query(
		`UPDATE posts SET title=?, slug=?, excerpt=?, content=?, status=?, meta_title=?, meta_description=?, og_image=?, tags=?, images=?, reading_time=?, updated_at=?, published_at=? WHERE id=?`,
		[
			data.title ?? ex.title,
			slug,
			data.excerpt ?? ex.excerpt,
			data.content ?? ex.content,
			data.status ?? ex.status,
			data.meta_title ?? ex.meta_title,
			data.meta_description ?? ex.meta_description,
			data.og_image ?? ex.og_image,
			tagsJson,
			imagesJson,
			readingTime,
			now,
			publishedAt,
			id
		]
	);

	return { id, slug };
}

export async function deletePost(id) {
	await db.query('DELETE FROM posts WHERE id = ?', [id]);
}

export async function getAllTags() {
	const [rows] = await db.query("SELECT tags FROM posts WHERE status = 'published'");
	const tagSet = new Set();
	for (const row of rows) {
		const tags = parseJson(row.tags);
		for (const tag of tags) tagSet.add(tag);
	}
	return [...tagSet].sort();
}

/**
 * Upvote a post. One vote per device (deviceId). Returns { count, voted }.
 */
export async function upvotePost(postId, deviceId) {
	const id = parseInt(postId);
	if (!id || !deviceId || deviceId.length > 120) {
		return null;
	}
	const [postRows] = await db.query('SELECT id, upvotes FROM posts WHERE id = ? AND status = ?', [
		id,
		'published'
	]);
	if (!postRows.length) return null;

	const [existing] = await db.query('SELECT id FROM post_votes WHERE post_id = ? AND device_id = ?', [
		id,
		deviceId
	]);
	if (existing.length > 0) {
		return { count: postRows[0].upvotes, voted: true };
	}

	await db.query('INSERT INTO post_votes (post_id, device_id) VALUES (?, ?)', [id, deviceId]);
	await db.query('UPDATE posts SET upvotes = upvotes + 1 WHERE id = ?', [id]);
	const [updated] = await db.query('SELECT upvotes FROM posts WHERE id = ?', [id]);
	return { count: updated[0].upvotes, voted: true };
}

/**
 * Get upvote count and whether current device has voted (optional).
 */
export async function getPostUpvoteInfo(postId, deviceId = null) {
	const id = parseInt(postId);
	if (!id) return { count: 0, voted: false };
	const [rows] = await db.query('SELECT upvotes FROM posts WHERE id = ?', [id]);
	const count = rows[0]?.upvotes ?? 0;
	if (!deviceId) return { count, voted: false };
	const [votedRows] = await db.query('SELECT id FROM post_votes WHERE post_id = ? AND device_id = ?', [
		id,
		deviceId
	]);
	return { count, voted: votedRows.length > 0 };
}
