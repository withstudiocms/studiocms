import fs from 'node:fs';
import path from 'node:path';
import { AstroError } from 'astro/errors';
import * as cheerio from 'cheerio';
import sanitizeHtml from 'sanitize-html';
import { Console, Effect, genLogger } from 'studiocms/effect';
import TurndownService from 'turndown';

type loadHTMLContent = Parameters<(typeof cheerio)['load']>[0];

type APISupportedTypes = 'posts' | 'pages' | 'media' | 'categories' | 'tags' | 'settings';

export class WordPressAPIUtils extends Effect.Service<WordPressAPIUtils>()('WordPressAPIUtils', {
	effect: genLogger('@studiocms/devapps/effects/WordPressAPI/utils.effect')(function* () {
		const failedDownloads = new Set<string>();

		const turndownService = new TurndownService({
			bulletListMarker: '-',
			codeBlockStyle: 'fenced',
			emDelimiter: '*',
		});

		const turndown = (html: string) => Effect.try(() => turndownService.turndown(html));

		/**
		 * Removes all HTML tags from a given string.
		 *
		 * @param string - The input string containing HTML tags.
		 * @returns The input string with all HTML tags removed.
		 */
		const stripHtml = (str: string) => Effect.try(() => sanitizeHtml(str));

		/**
		 * Effectful version of 'cheerio.load()`
		 */
		const loadHTML = (
			content: loadHTMLContent,
			options?: cheerio.CheerioOptions | null,
			isDocument?: boolean
		) =>
			Effect.try({
				try: () => cheerio.load(content, options, isDocument),
				catch: (err) =>
					new AstroError('Error loading content', err instanceof Error ? err.message : `${err}`),
			});

		/**
		 * Cleans up the provided HTML string by removing certain attributes from images
		 * and modifying specific elements related to WordPress polls.
		 *
		 * @param html - The HTML string to be cleaned up.
		 * @returns The cleaned-up HTML string.
		 */
		const cleanUpHtml = (html: string) =>
			genLogger('@studiocms/devapps/effects/WordPressAPI/utils.effect.cleanUpHtml')(function* () {
				const data = yield* loadHTML(html);

				const images = data('img');
				for (const image of images) {
					data(image)
						.removeAttr('class')
						.removeAttr('width')
						.removeAttr('height')
						.removeAttr('data-recalc-dims')
						.removeAttr('sizes')
						.removeAttr('srcset');
				}

				data('.wp-polls').html(
					'<em>Polls have been temporarily removed while we migrate to a new platform.</em>'
				);
				data('.wp-polls.loading').remove();

				return data.html();
			});

		/**
		 * Fetch all pages for a paginated WP endpoint.
		 */
		const fetchAll = (
			url: URL,
			page = 1,
			// biome-ignore lint/suspicious/noExplicitAny: This is a dynamic function that could return anything as an array
			results: any[] = []
			// biome-ignore lint/suspicious/noExplicitAny: This is a dynamic function that could return anything as an array
		): Effect.Effect<any[], AstroError, never> =>
			genLogger('@studiocms/devapps/effects/WordPressAPI/utils.effect.fetchAll')(function* () {
				url.searchParams.set('per_page', '100');
				url.searchParams.set('page', String(page));

				// Fetch and return data and headers for usage later
				const res = yield* Effect.tryPromise({
					try: () => fetch(url),
					catch: (err) =>
						new AstroError(
							'Unknown Error while querying API',
							err instanceof Error ? err.message : `${err}`
						),
				});

				let data = yield* Effect.tryPromise({
					try: () => res.json(),
					catch: (err) =>
						new AstroError(
							'Unknown Error while reading API data',
							err instanceof Error ? err.message : `${err}`
						),
				});

				// Check for errors
				if (!Array.isArray(data)) {
					if (typeof data === 'object') {
						data = Object.entries(data).map(([id, val]) => {
							if (typeof val === 'object') return { id, ...val };
							return { id };
						});
					} else {
						return yield* Effect.fail(
							new AstroError(
								'Expected WordPress API to return an array of items.',
								`Received ${typeof data}:\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``
							)
						);
					}
				}

				// Append the results
				results.push(...data);

				// Check for pagination
				const totalPages = Number.parseInt(res.headers.get('X-WP-TotalPages') || '1');
				yield* Console.log('Fetched page', page, 'of', totalPages);

				// If pagination, Recurse through the pages.
				if (page < totalPages) {
					yield* Console.log('Fetching next page...');
					return yield* fetchAll(url, page + 1, results);
				}

				// Return final results
				return results;
			});

		/**
		 * Constructs a WordPress API endpoint URL based on the provided parameters.
		 *
		 * @param endpoint - The base URL of the WordPress website.
		 * @param type - The type of resource to access. Can be 'posts', 'pages', 'media', 'categories', 'tags', or 'settings'.
		 * @param path - An optional path to append to the endpoint.
		 * @returns The constructed URL object pointing to the desired API endpoint.
		 * @throws {AstroError} If the `endpoint` argument is missing.
		 */
		const apiEndpoint = (
			endpoint: string,
			type: APISupportedTypes,
			path?: string
		): Effect.Effect<URL, AstroError, never> =>
			genLogger('@studiocms/devapps/effects/WordPressAPI/utils.effect.apiEndpoint')(function* () {
				if (!endpoint) {
					return yield* Effect.fail(
						new AstroError(
							'Missing `endpoint` argument.',
							'Please pass a URL to your WordPress website as the `endpoint` option to the WordPress importer. Most commonly this looks something like `https://example.com/`'
						)
					);
				}

				let newEndpoint = endpoint;
				if (!newEndpoint.endsWith('/')) newEndpoint += '/';

				const apiBase = new URL(newEndpoint);

				if (type === 'settings') {
					apiBase.pathname = 'wp-json/';
					return apiBase;
				}

				apiBase.pathname = `wp-json/wp/v2/${type}/${path ? `${path}/` : ''}`;
				return apiBase;
			});

		/**
		 * Downloads an image from the specified URL and saves it to the given destination.
		 *
		 * @param {string | URL} imageUrl - The URL of the image to download.
		 * @param {string | URL} destination - The file path where the image should be saved.
		 */
		const downloadImage = (imageUrl: string | URL, destination: string | URL) =>
			genLogger('@studiocms/devapps/effects/WordPressAPI/utils.effect.downloadImage')(function* () {
				if (fs.existsSync(destination)) {
					yield* Console.error('File already exists:', destination);
					return true;
				}

				// Validate destination file extension
				const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
				const ext = path.extname(destination.toString()).toLowerCase();
				if (!allowedExtensions.includes(ext)) {
					yield* Console.error('Invalid file extension:', ext);
					return false;
				}

				const response = yield* Effect.tryPromise(() => fetch(imageUrl));

				// Validate content type
				const contentType = response.headers.get('content-type');
				if (!contentType?.startsWith('image/')) {
					yield* Console.error('Invalid content type:', contentType);
					return false;
				}

				// Check content length
				const contentLength = response.headers.get('content-length');
				const maxSize = 100 * 1024 * 1024; // 100MB limit
				if (contentLength && Number.parseInt(contentLength) > maxSize) {
					yield* Console.error('File too large:', contentLength);
					return false;
				}

				if (response.ok && response.body) {
					const reader = response.body.getReader();
					const chunks = [];
					let done = false;

					while (!done) {
						const { done: readerDone, value } = yield* Effect.tryPromise(() => reader.read());
						if (value) chunks.push(value);
						done = readerDone;
					}

					const fileBuffer = Buffer.concat(chunks);
					fs.writeFileSync(destination, fileBuffer, { flag: 'wx' });

					yield* Console.log('Downloaded image:', imageUrl);

					return true;
				}

				yield* Console.error('Failed to download image:', imageUrl);
				return false;
			});

		/**
		 * Downloads an image from the given source URL and saves it to the specified folder.
		 *
		 * @param src - The URL of the image to download.
		 * @param pathToFolder - The path to the folder where the image should be saved.
		 * @returns The file name of the downloaded image if successful, otherwise `undefined`.
		 *
		 * @remarks
		 * - If the `src` or `pathToFolder` parameters are not provided, the function will return immediately.
		 * - If the specified folder does not exist, it will be created recursively.
		 * - If the image already exists in the specified folder, the function will log a message and skip the download.
		 * - If the image download fails, the source URL will be added to the `imagesNotDownloaded` array.
		 */
		const downloadPostImage = (src: string, pathToFolder: string) =>
			genLogger('@studiocms/devapps/effects/WordPressAPI/utils.effect.downloadPostImage')(
				function* () {
					if (!src || !pathToFolder) return;

					if (!fs.existsSync(pathToFolder)) {
						fs.mkdirSync(pathToFolder, { recursive: true });
					}

					const baseName = path.basename(src);
					const fileName = baseName.split('?')[0];
					if (!fileName) {
						yield* Console.error('Invalid image URL:', src);
						return undefined;
					}
					const destinationFile = path.resolve(pathToFolder, fileName);

					if (fs.existsSync(destinationFile)) {
						yield* Console.log(`Post/Page image "${destinationFile}" already exists, skipping...`);
						return fileName;
					}

					const imageDownloaded = yield* downloadImage(src, destinationFile);

					if (!imageDownloaded) failedDownloads.add(src);

					return imageDownloaded ? fileName : undefined;
				}
			);

		/**
		 * Downloads and updates the image sources in the provided HTML string.
		 *
		 * This function parses the given HTML string, finds all image elements,
		 * downloads the images to the specified folder, and updates the image
		 * sources to point to the downloaded images.
		 *
		 * @param html - The HTML string containing image elements to be processed.
		 * @param pathToFolder - The path to the folder where images should be downloaded.
		 * @returns A promise that resolves to the updated HTML string with new image sources.
		 */
		const downloadAndUpdateImages = (html: string, pathToFolder: string) =>
			genLogger('@studiocms/devapps/effects/WordPressAPI/utils.effect.downloadAndUpdateImages')(
				function* () {
					const data = yield* loadHTML(html);
					const images = data('img');

					for (const image of images) {
						const src = data(image).attr('src');
						if (src) {
							const newSrc = yield* downloadPostImage(src, pathToFolder);
							if (newSrc) {
								data(image).attr('src', newSrc);
							} else {
								// Either remove the image or keep original src
								data(image).attr('src', src);
							}
						}
					}

					return data.html();
				}
			);

		return {
			turndown,
			stripHtml,
			cleanUpHtml,
			fetchAll,
			apiEndpoint,
			downloadPostImage,
			downloadAndUpdateImages,
		};
	}),
}) {}
