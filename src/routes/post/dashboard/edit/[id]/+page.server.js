import { error } from '@sveltejs/kit';
import { getPostById } from '$lib/server/posts.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const id = parseInt(params.id);
	const post = await getPostById(id);

	if (!post) {
		error(404, 'Post not found');
	}

	return { post };
}
