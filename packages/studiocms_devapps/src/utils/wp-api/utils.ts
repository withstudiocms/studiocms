import fs from 'node:fs';
import path from 'node:path';
import { AstroError } from 'astro/errors';
import * as cheerio from 'cheerio';

const imagesNotDownloaded = [];

/**
 * Removes all HTML tags from a given string.
 *
 * @param string - The input string containing HTML tags.
 * @returns The input string with all HTML tags removed.
 */
export function stripHtml(string: string) {
	return string.replace(/<[^>]*>/g, '');
}

/**
 * Cleans up the provided HTML string by removing certain attributes from images
 * and modifying specific elements related to WordPress polls.
 *
 * @param html - The HTML string to be cleaned up.
 * @returns The cleaned-up HTML string.
 */
export const cleanUpHtml = (html: string) => {
	const $ = cheerio.load(html);

	const images = $('img');
	for (const image of images) {
		$(image).removeAttr('class width height data-recalc-dims sizes srcset');
	}

	$('.wp-polls').html(
		'<em>Polls have been temporarily removed while we migrate to a new platform.</em>'
	);
	$('.wp-polls-loading').remove();

	return $.html();
};

/**
 * Downloads an image from the specified URL and saves it to the given destination.
 *
 * @param {string | URL} imageUrl - The URL of the image to download.
 * @param {string | URL} destination - The file path where the image should be saved.
 * @returns {Promise<boolean>} - A promise that resolves to true if the image was successfully downloaded,
 *                               or false if the download failed or the file already exists.
 *
 * @throws {Error} - Throws an error if there is an issue with the fetch request or file writing.
 */
export async function downloadImage(imageUrl: string | URL, destination: string | URL) {
	if (fs.existsSync(destination)) {
		console.error('File already exists:', destination);
		return true;
	}

	try {
		const response = await fetch(imageUrl);

		if (response.ok && response.body) {
			const reader = response.body.getReader();
			const chunks = [];
			let done = false;

			while (!done) {
				const { done: readerDone, value } = await reader.read();
				if (value) {
					chunks.push(value);
				}
				done = readerDone;
			}

			const fileBuffer = Buffer.concat(chunks);
			fs.writeFileSync(destination, fileBuffer, { flag: 'wx' });

			console.log('Downloaded image:', imageUrl);

			return true;
		}

		console.error('Failed to download image:', imageUrl);
		return false;
	} catch (error) {
		console.error('Failed to download image:', imageUrl, error);
		return false;
	}
}

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
export const downloadPostImage = async (src: string, pathToFolder: string) => {
	if (!src || !pathToFolder) {
		return;
	}

	if (!fs.existsSync(pathToFolder)) {
		fs.mkdirSync(pathToFolder, { recursive: true });
	}

	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const fileName = path.basename(src).split('?')[0]!;
	const destinationFile = path.resolve(pathToFolder, fileName);

	if (fs.existsSync(destinationFile)) {
		console.log(`Post/Page image "${destinationFile}" already exists, skipping...`);
		return fileName;
	}

	const imageDownloaded = await downloadImage(src, destinationFile);

	if (!imageDownloaded) {
		imagesNotDownloaded.push(src);
	}

	return imageDownloaded ? fileName : undefined;
};

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
export const downloadAndUpdateImages = async (html: string, pathToFolder: string) => {
	const $ = cheerio.load(html);
	const images = $('img');

	for (const image of images) {
		const src = $(image).attr('src');
		if (src) {
			const newSrc = await downloadPostImage(src, pathToFolder);
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			$(image).attr('src', newSrc!);
		}
	}

	return $.html();
};

/**
 * Constructs a WordPress API endpoint URL based on the provided parameters.
 *
 * @param endpoint - The base URL of the WordPress website.
 * @param type - The type of resource to access. Can be 'posts', 'pages', 'media', 'categories', 'tags', or 'settings'.
 * @param path - An optional path to append to the endpoint.
 * @returns The constructed URL object pointing to the desired API endpoint.
 * @throws {AstroError} If the `endpoint` argument is missing.
 */
export const apiEndpoint = (
	endpoint: string,
	type: 'posts' | 'pages' | 'media' | 'categories' | 'tags' | 'settings',
	path?: string
) => {
	if (!endpoint) {
		throw new AstroError(
			'Missing `endpoint` argument.',
			'Please pass a URL to your WordPress website as the `endpoint` option to the WordPress importer. Most commonly this looks something like `https://example.com/`'
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
};

/**
 * Fetch all pages for a paginated WP endpoint.
 */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function fetchAll(url: URL, page = 1, results: any[] = []) {
	// Search params
	url.searchParams.set('per_page', '100');
	url.searchParams.set('page', String(page));

	// Fetch
	const response = await fetch(url);
	let data = await response.json();

	// Check for errors
	if (!Array.isArray(data)) {
		if (typeof data === 'object') {
			data = Object.entries(data).map(([id, val]) => {
				if (typeof val === 'object') return { id, ...val };
				return { id };
			});
		} else {
			throw new AstroError(
				'Expected WordPress API to return an array of items.',
				`Received ${typeof data}:\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``
			);
		}
	}

	// Append
	results.push(...data);

	// Check for pagination
	const totalPages = Number.parseInt(response.headers.get('X-WP-TotalPages') || '1');
	console.log('Fetched page', page, 'of', totalPages);

	// Recurse
	if (page < totalPages) {
		console.log('Fetching next page...');
		return fetchAll(url, page + 1, results);
	}

	// Done
	return results;
}
