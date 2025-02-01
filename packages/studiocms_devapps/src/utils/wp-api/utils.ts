import fs from 'node:fs';
import path from 'node:path';
import { AstroError } from 'astro/errors';
import * as cheerio from 'cheerio';

const imagesNotDownloaded = [];

export function stripHtml(string: string) {
	return string.replace(/<[^>]*>/g, '');
}

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
