/**
 * Appends query parameters to a given path.
 *
 * @param path - The base path to which query parameters will be appended.
 * @param params - An object representing the query parameters to append.
 * @returns The path with the appended query parameters.
 */
export function appendQueryParamsToPath(path: string, params: Record<string, string>): string {
	const url = new URL(path, 'http://example.com'); // Base URL is required but irrelevant here
	for (const [key, value] of Object.entries(params)) {
		url.searchParams.append(key, value);
	}
	return url.pathname + url.search;
}
