import { error } from '@sveltejs/kit';
import { getPostBySlug } from '$lib/server/posts.js';
import { parseMarkdown } from '$lib/utils/markdown.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const post = await getPostBySlug(params.slug);

	if (!post) {
		error(404, 'Post not found');
	}

	return {
		post: {
			...post,
			html: parseMarkdown(post.content)
		}
	};
}
