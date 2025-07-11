import type { APIContext } from 'astro';
import { Effect, genLogger } from 'studiocms/effect';
import { WordPressAPI } from './WordPressAPI.js';

export class WPImporter extends Effect.Service<WPImporter>()('WPImporter', {
	dependencies: [WordPressAPI.Default],
	effect: genLogger('@studiocms/devapps/effects/wp-importer.effect')(function* () {
		const WPAPI = yield* WordPressAPI;

		/**
		 * Handles the POST request for importing data from a WordPress site.
		 *
		 * @param {APIContext} context - The context of the API request.
		 * @param {Request} context.request - The incoming request object.
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
		 */
		const runPostEvent = (context: APIContext) =>
			genLogger('@studiocms/devapps/effects/wp-importer.effect.runPostEvent')(function* () {
				const formData = yield* Effect.tryPromise(() => context.request.formData());

				const url = formData.get('url')?.toString();
				const type = formData.get('type')?.toString();
				const useBlogPlugin = formData.get('useBlogPlugin') === 'true';

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

				console.log('Starting Import:', url, '\n Type:', type, '\n useBlogPlugin:', useBlogPlugin);

				switch (type) {
					case 'pages':
						yield* WPAPI.importPagesFromWPAPI(url);
						break;
					case 'posts':
						yield* WPAPI.importPostsFromWPAPI(url, useBlogPlugin);
						break;
					case 'settings':
						yield* WPAPI.importSettingsFromWPAPI(url);
						break;
					default:
						return new Response(null, {
							status: 400,
							statusText: 'Bad Request: Invalid import type',
							headers: {
								'Content-Type': 'application/json',
								'Access-Control-Allow-Headers': '*',
							},
						});
				}

				return new Response(null, {
					status: 200,
					statusText: 'success',
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Headers': '*',
					},
				});
			});

		return {
			runPostEvent,
		};
	}),
}) {
	static Provide = Effect.provide(this.Default);
}
