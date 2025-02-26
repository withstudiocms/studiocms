import type { APIContext, APIRoute } from 'astro';
import {
	importPagesFromWPAPI,
	importPostsFromWPAPI,
	importSettingsFromWPAPI,
} from '../utils/wp-api/index.js';

/**
 * Handles the POST request for importing data from a WordPress site.
 *
 * @param {APIContext} context - The context of the API request.
 * @param {Request} context.request - The incoming request object.
 *
 * @returns {Promise<Response>} The response object indicating the result of the import operation.
 *
 * The function expects the request to contain form data with the following fields:
 * - `url`: The URL of the WordPress site to import data from.
 * - `type`: The type of data to import (e.g., 'pages', 'posts', 'settings').
 * - `useBlogPlugin` (optional): A boolean value indicating whether to use the blog plugin for importing posts.
 *
 * The function performs the following steps:
 * 1. Extracts the form data from the request.
 * 2. Validates the presence and types of the `url` and `type` fields.
 * 3. Logs the import operation details.
 * 4. Based on the `type` field, calls the appropriate import function:
 *    - `importPagesFromWPAPI` for importing pages.
 *    - `importPostsFromWPAPI` for importing posts, optionally using the blog plugin.
 *    - `importSettingsFromWPAPI` for importing settings.
 * 5. Returns a response indicating success or failure.
 *
 * @throws {Error} If the `type` field contains an invalid value.
 */
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
