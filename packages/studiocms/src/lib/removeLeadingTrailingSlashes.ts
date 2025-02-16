/**
 * Removes leading and trailing slashes from a URL
 *
 * @param {string} path The URL to remove slashes from (e.g. '/example/blog/')
 * @returns {string} The URL with leading and trailing slashes removed (e.g. 'example/blog')
 */
export function removeLeadingTrailingSlashes(path: string): string {
	let newPath = path;

	// Remove a single leading slash if present
	if (newPath.startsWith('/')) {
		newPath = newPath.substring(1);
	}

	// Remove a single trailing slash if present
	if (newPath.endsWith('/')) {
		newPath = newPath.substring(0, newPath.length - 1);
	}

	return newPath || '/';
}
