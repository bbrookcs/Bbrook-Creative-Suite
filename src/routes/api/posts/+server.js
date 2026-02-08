import { json, error } from '@sveltejs/kit';
import { createPost } from '$lib/server/posts.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const data = await request.json();

	if (!data.title) {
		error(400, 'Title is required');
	}

	try {
		const result = await createPost(data);
		return json({ success: true, id: result.id, slug: result.slug });
	} catch (err) {
		console.error('Failed to create post:', err);
		error(500, 'Failed to create post');
	}
}
