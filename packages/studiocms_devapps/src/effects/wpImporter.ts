import { Console, Effect, genLogger } from 'studiocms/effect';
import {
	AstroAPIContextProvider,
	ImportEndpointConfig,
	ImportPostsEndpointConfig,
} from './WordPressAPI/configs.js';
import { WordPressAPI } from './WordPressAPI/importers.js';

const createResponse = (status: number, statusText: string) =>
	new Response(null, {
		status,
		statusText,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Headers': '*',
		},
	});

const createErrorResponse = (statusText: string) => createResponse(400, statusText);

type InferType<T> = T extends 'string' ? string : T extends 'boolean' ? boolean : never;

export class WPImporter extends Effect.Service<WPImporter>()('WPImporter', {
	dependencies: [WordPressAPI.Default],
	effect: genLogger('@studiocms/devapps/effects/wpImporter.effect')(function* () {
		const WPAPI = yield* WordPressAPI;

		const parseFormData = <T extends 'string' | 'boolean'>(
			formData: FormData,
			name: string,
			type: T,
			optional = false
		) =>
			Effect.gen(function* () {
				const data = formData.get(name);

				if ((!optional && !data) || data === null) {
					throw yield* Effect.fail(new Error(`Missing required form field: ${name}`));
				}

				switch (type) {
					case 'string':
						return data.toString() as InferType<T>;
					case 'boolean': {
						const value = data.toString().toLowerCase();
						return (value === 'true' || value === '1' || value === 'yes') as InferType<T>;
					}
					default:
						throw yield* Effect.fail(
							new Error(`Unsupported type '${type}' for form field: ${name}`)
						);
				}
			}) as Effect.Effect<InferType<T>, Error, never>;

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
		const runPostEvent = genLogger('@studiocms/devapps/effects/wpImporter.effect.runPostEvent')(
			function* () {
				const { context } = yield* AstroAPIContextProvider;

				const formData = yield* Effect.tryPromise(() => context.request.formData());

				const url = yield* parseFormData(formData, 'url', 'string');
				const type = yield* parseFormData(formData, 'type', 'string');
				const useBlogPlugin = yield* Effect.orElse(
					parseFormData(formData, 'useBlogPlugin', 'boolean', true),
					() => Effect.succeed(false)
				);

				if (!url || !type) {
					return createErrorResponse('Bad Request');
				}

				yield* Console.log(
					'Starting Import:',
					url,
					'\n Type:',
					type,
					'\n useBlogPlugin:',
					useBlogPlugin
				);

				switch (type) {
					case 'pages':
						yield* WPAPI.importPagesFromWPAPI.pipe(ImportEndpointConfig.makeProvide(url));
						break;
					case 'posts':
						yield* WPAPI.importPostsFromWPAPI.pipe(
							ImportPostsEndpointConfig.makeProvide(url, useBlogPlugin)
						);
						break;
					case 'settings':
						yield* WPAPI.importSettingsFromWPAPI.pipe(ImportEndpointConfig.makeProvide(url));
						break;
					default:
						return createErrorResponse('Bad Request: Invalid import type');
				}

				return createResponse(200, 'success');
			}
		);

		return {
			runPostEvent,
		};
	}),
}) {
	static Provide = Effect.provide(this.Default);
}
