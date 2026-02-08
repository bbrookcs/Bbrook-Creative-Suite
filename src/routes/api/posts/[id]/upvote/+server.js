import { json, error } from '@sveltejs/kit';
import { upvotePost } from '$lib/server/posts.js';
import crypto from 'crypto';

/** @type {import('./$types').RequestHandler} */
export async function POST({ params, request }) {
	const id = parseInt(params.id);
	if (!id) {
		error(400, 'Invalid post id');
	}

	let deviceId = null;
	try {
		const body = await request.json();
		deviceId = typeof body?.deviceId === 'string' ? body.deviceId.trim() : null;
	} catch (_) {
		// No body or invalid JSON
	}

	// Fallback: derive a device fingerprint from IP (soft limiting)
	if (!deviceId || deviceId.length > 120) {
		const forwarded = request.headers.get('x-forwarded-for');
		const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
		deviceId = 'ip-' + crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);
	}

	const result = await upvotePost(id, deviceId);
	if (!result) {
		error(404, 'Post not found');
	}

	return json(result);
}
