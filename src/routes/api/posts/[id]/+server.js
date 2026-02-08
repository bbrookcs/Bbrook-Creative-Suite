import { json, error } from '@sveltejs/kit';
import { updatePost, deletePost } from '$lib/server/posts.js';

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, params, locals }) {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const id = parseInt(params.id);
	const data = await request.json();

	if (!data.title) {
		error(400, 'Title is required');
	}

	try {
		const result = await updatePost(id, data);
		if (!result) {
			error(404, 'Post not found');
		}
		return json({ success: true, id: result.id, slug: result.slug });
	} catch (err) {
		console.error('Failed to update post:', err);
		error(500, 'Failed to update post');
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params, locals }) {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const id = parseInt(params.id);

	try {
		await deletePost(id);
		return json({ success: true });
	} catch (err) {
		console.error('Failed to delete post:', err);
		error(500, 'Failed to delete post');
	}
}
