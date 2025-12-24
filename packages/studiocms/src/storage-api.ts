import type { UrlMetadata } from './handlers/storage-manager/definitions.js';

export * from './handlers/storage-manager/definitions.js';

/**
 * A storage-file:// identifier type.
 */
export type StorageFileIdentifier = `storage-file://${string}`;

/**
 * Options for resolving storage URLs.
 */
export interface ResolveUrlOptions {
	baseUrl: string | URL;
	verbose?: boolean;
	timeoutMs?: number;
}

/**
 * Converts a storage key to a storage-file:// identifier.
 *
 * @param key - The storage key to convert.
 * @returns The corresponding storage-file:// identifier.
 */
const keyToIdentifier = (key: string): StorageFileIdentifier => `storage-file://${key}`;

/**
 * Creates a fetch request with timeout support.
 */
const fetchWithTimeout = async (
	url: URL,
	options: RequestInit,
	timeoutMs = 5000
): Promise<Response> => {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		return await fetch(url, {
			...options,
			signal: controller.signal,
		});
	} finally {
		clearTimeout(timeoutId);
	}
};

/**
 * Resolves a storage-file:// identifier to its actual URL by calling the StudioCMS storage manager API.
 *
 * @param identifier - The storage-file:// identifier to resolve.
 * @param options - Options including the base URL of the StudioCMS instance and verbosity flag.
 * @returns A promise that resolves to the actual URL or the original identifier if resolution fails.
 */
export async function resolveStorageIdentifier(
	identifier: StorageFileIdentifier,
	{ baseUrl, verbose = false, timeoutMs }: ResolveUrlOptions
): Promise<string> {
	// Get the storage manager URL for the StudioCMS API
	const endpoint = new URL('/studiocms_api/storage/manager', baseUrl);

	// Make a request to resolve the storage manager URL
	const response = await fetchWithTimeout(
		endpoint,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ identifier, action: 'resolveUrl' }),
		},
		timeoutMs
	);

	// Handle non-OK responses
	if (!response.ok) {
		verbose && console.error(`Failed to resolve storage manager for identifier: ${identifier}`);
		return identifier;
	}

	// Parse the response to get the URL metadata (may throw on malformed JSON)
	let data: UrlMetadata;
	try {
		data = await response.json();
	} catch {
		verbose && console.error(`Failed to parse response for identifier: ${identifier}`);
		return identifier;
	}

	// Return the resolved URL or the original identifier if not found
	return data.url ?? identifier;
}

/**
 * Resolves a storage key to its actual URL by calling the StudioCMS storage manager API.
 *
 * @param key - The storage key to resolve.
 * @param opts - Options including the base URL of the StudioCMS instance and verbosity flag.
 * @returns A promise that resolves to the actual URL or the original identifier if resolution fails.
 */
export async function resolveStorageKey(key: string, options: ResolveUrlOptions): Promise<string> {
	// Construct the storage-file:// identifier
	const identifier = keyToIdentifier(key);
	// Delegate to resolveStorageIdentifier
	return await resolveStorageIdentifier(identifier, options);
}
