import type { Node } from 'ultrahtml';
import type { UrlMetadata } from '#storage-manager/definitions';

/**
 * Options for the storage-file transformer.
 */
export interface StorageFileOptions {
	/** The server endpoint to resolve storage-file:// URLs */
	site: string | undefined;

	/**
	 * Attributes to check for storage-file:// URLs
	 * @default ['src', 'href', 'poster', 'data-src']
	 */
	attributes?: string[];
}

/**
 * Default attributes to check for storage-file:// URLs
 */
const defaultAttributes = ['src', 'href', 'poster', 'data-src'];

/**
 * Default site URL for resolving storage-file:// URLs
 */
const defaultSite = 'http://localhost:4321';

/**
 * Transformer that resolves storage-file:// URLs by calling a server endpoint
 *
 * @example
 * ```ts
 * import { parseSync as parse, renderSync as render } from 'ultrahtml';
 * import storageFile from './storage-file';
 *
 * const html = '<img src="storage-file://abc123.jpg">';
 * const doc = parse(html);
 * const resolved = render(doc, [storageFile({ endpoint: '/api/resolve' })]);
 * ```
 */
export default function transformStorageAPI(
	{ attributes = defaultAttributes, site = defaultSite }: StorageFileOptions = {
		attributes: defaultAttributes,
		site: defaultSite,
	}
) {
	return async (doc: Node): Promise<Node> => {
		await walkAndResolve(doc, attributes, site);
		return doc;
	};
}

/**
 * Recursively walks the HTML node tree and resolves storage-file:// URLs in specified attributes.
 *
 * @param node - The current HTML node to process.
 * @param attributes - The list of attributes to check for storage-file:// URLs.
 * @param site - The server endpoint to call for URL resolution.
 */
async function walkAndResolve(node: Node, attributes: string[], site: string): Promise<void> {
	// Process element nodes
	if (node.type === 1 && node.attributes) {
		const updates: Record<string, string> = {};

		for (const attr of attributes) {
			const value = node.attributes[attr];
			if (typeof value === 'string' && value.startsWith('storage-file://')) {
				try {
					const resolved = await resolveUrl(value, site);
					updates[attr] = resolved;
				} catch (error) {
					console.error(`Failed to resolve ${value}:`, error);
					// Keep original URL on error
				}
			}
		}

		// Apply updates
		if (Object.keys(updates).length > 0) {
			Object.assign(node.attributes, updates);
		}
	}

	// Recursively process children
	if (node.children && node.children.length > 0) {
		await Promise.all(node.children.map((child: Node) => walkAndResolve(child, attributes, site)));
	}
}

/**
 * Resolves a storage-file:// URL by calling the server endpoint.
 *
 * @param identifier - The storage-file:// URL to resolve.
 * @param site - The server endpoint to call for resolution.
 * @returns A promise that resolves to the actual URL.
 */
async function resolveUrl(identifier: string, site: string): Promise<string> {
	// Get the storage manager URL for the StudioCMS API
	const endpoint = new URL('/studiocms_api/storage/manager', site);

	// Make a request to resolve the storage manager URL
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ identifier, action: 'resolveUrl' }),
	});

	// Handle non-OK responses
	if (!response.ok) {
		console.error(`Failed to resolve storage manager for identifier: ${identifier}`);
		return identifier;
	}

	// Parse the response to get the URL metadata (may throw on malformed JSON)
	let data: UrlMetadata;
	try {
		data = await response.json();
	} catch {
		console.error(`Failed to parse response for identifier: ${identifier}`);
		return identifier;
	}

	// Return the resolved URL or the original identifier if not found
	return data.url || identifier;
}
