import { getAllPosts, deletePost } from '$lib/server/posts.js';
import { fail } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
	const page = parseInt(url.searchParams.get('page') || '1');
	const result = await getAllPosts({ page, limit: 20 });

	return {
		posts: result.posts,
		total: result.total,
		page: result.page,
		totalPages: result.totalPages
	};
}

/** @type {import('./$types').Actions} */
export const actions = {
	delete: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(form.get('id')?.toString() || '0');
		if (!id) return fail(400, { error: 'Invalid post ID' });
		await deletePost(id);
		return { success: true };
	}
};
