import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const endpoint = env.S3_ENDPOINT || '';
	const accessKey = env.S3_ACCESS_KEY || '';
	const secretKey = env.S3_SECRET_KEY || '';
	const bucket = env.S3_BUCKET_NAME || 'bbrook-blog';
	const publicUrl = env.R2_PUBLIC_URL || '';

	if (!endpoint || !accessKey || !secretKey) {
		error(500, 'R2 storage is not configured. Set S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY in .env');
	}

	const s3 = new S3Client({
		region: 'auto',
		endpoint,
		credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
		forcePathStyle: true
	});

	const formData = await request.formData();
	const file = formData.get('file');

	if (!file || !(file instanceof File)) {
		error(400, 'No file provided');
	}

	const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
	if (!allowedTypes.includes(file.type)) {
		error(400, 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG');
	}

	if (file.size > 10 * 1024 * 1024) {
		error(400, 'File too large. Maximum 10MB.');
	}

	const ext = file.name.split('.').pop() || 'jpg';
	const key = `uploads/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
	const buffer = Buffer.from(await file.arrayBuffer());

	await s3.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: buffer,
			ContentType: file.type
		})
	);

	const url = publicUrl
		? `${publicUrl.replace(/\/$/, '')}/${key}`
		: `/${key}`; // key already contains "uploads/" prefix

	return json({ url, filename: key.split('/').pop() });
}
