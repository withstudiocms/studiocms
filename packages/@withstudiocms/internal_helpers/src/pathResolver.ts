import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Create a path resolver anchored to the provided base.
 *
 * The function accepts either a file URL (for example `import.meta.url`, i.e. a string
 * that starts with `file://`) or a regular filesystem path (absolute or relative,
 * e.g. `process.cwd()` or a custom string). If a file URL is provided it will be
 * converted to the directory containing that file; otherwise the provided string is
 * used directly as the base directory.
 *
 * @param baseOption - Base location used to resolve relative paths. Either:
 *   - a file URL string (starts with "file://", e.g. `import.meta.url`), or
 *   - a filesystem path string (absolute or relative).
 * @returns An object with two helpers:
 *   - `resolve(...segments: string[]): string` — resolves the given path segments
 *     against the computed base directory and returns an absolute filesystem path.
 *   - `resolveURL(...segments: string[]): URL` — resolves the given path segments
 *     against the computed base directory and returns a `file://` URL.
 *
 * @example
 * // Using import.meta.url as the base:
 * const resolver = createPathResolver(import.meta.url);
 * const absolutePath = resolver.resolve('..', 'assets', 'image.png');
 * const fileUrl = resolver.resolveURL('..', 'assets', 'image.png');
 */
function createPathResolver(baseOption: string) {
	// Convert import.meta.url to file path if needed
	let baseDir: string;

	if (typeof baseOption === 'string' && baseOption.startsWith('file://')) {
		// It's import.meta.url - convert to directory path
		const filePath = fileURLToPath(baseOption);
		baseDir = path.dirname(filePath);
	} else {
		// It's already a regular path (process.cwd() or custom string)
		baseDir = baseOption as string;
	}

	return {
		/**
		 * Resolve path segments against the base directory.
		 *
		 * @param segments - Path segments to resolve.
		 * @returns The resolved absolute filesystem path.
		 */
		resolve: (...segments: string[]): string => path.resolve(baseDir, ...segments),

		/**
		 * Resolve path segments against the base directory and return a file URL.
		 *
		 * @param segments - Path segments to resolve.
		 * @returns The resolved file URL.
		 */
		resolveURL: (...segments: string[]): URL => pathToFileURL(path.resolve(baseDir, ...segments)),
	};
}

export default createPathResolver;
