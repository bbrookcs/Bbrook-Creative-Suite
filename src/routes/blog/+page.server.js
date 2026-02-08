import { getPublishedPosts, getAllTags } from '$lib/server/posts.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
	const page = parseInt(url.searchParams.get('page') || '1');
	const search = url.searchParams.get('q') || '';
	const tag = url.searchParams.get('tag') || '';

	const result = await getPublishedPosts({ page, limit: 10, search, tag });
	const tags = await getAllTags();

	return {
		posts: result.posts,
		total: result.total,
		page: result.page,
		totalPages: result.totalPages,
		tags,
		search,
		activeTag: tag
	};
}
