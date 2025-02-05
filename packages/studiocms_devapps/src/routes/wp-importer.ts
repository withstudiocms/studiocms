import type { APIContext, APIRoute } from 'astro';
import {
	importPagesFromWPAPI,
	importPostsFromWPAPI,
	importSettingsFromWPAPI,
} from '../utils/wp-api/index.js';

export const POST: APIRoute = async ({ request }: APIContext) => {
	const data = await request.formData();

	const url = data.get('url');
	const type = data.get('type');
	const useBlogPlugin = data.get('useBlogPlugin');

	if (!url || !type) {
		return new Response(null, {
			status: 400,
			statusText: 'Bad Request',
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Headers': '*',
			},
		});
	}

	if (typeof url !== 'string' || typeof type !== 'string') {
		return new Response(null, {
			status: 400,
			statusText: 'Bad Request',
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Headers': '*',
			},
		});
	}

	console.log('Starting Import:', url, '\n Type:', type, '\n useBlogPlugin:', useBlogPlugin);

	const useBlogPluginValue = useBlogPlugin === 'true';

	switch (type) {
		case 'pages':
			await importPagesFromWPAPI(url);
			break;
		case 'posts':
			await importPostsFromWPAPI(url, useBlogPluginValue);
			break;
		case 'settings':
			await importSettingsFromWPAPI(url);
			break;
		default:
			throw new Error('Invalid import type');
	}

	return new Response(null, {
		status: 200,
		statusText: 'success',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Headers': '*',
		},
	});
};
