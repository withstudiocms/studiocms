import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Creates a path resolver function with a configured base directory.
 *
 * @param baseOption - The base directory to resolve paths from:
 *   - `process.cwd()` for project root
 *   - `import.meta.url` for current module directory
 *   - Any string path for custom base directory
 * @returns A resolver function that resolves paths relative to the configured base
 *
 * @example
 * // Resolve relative to project root
 * const resolveFromRoot = createPathResolver(process.cwd());
 * const configPath = resolveFromRoot('./config/app.json');
 *
 * @example
 * // Resolve relative to current module
 * const resolveFromModule = createPathResolver(import.meta.url);
 * const dataPath = resolveFromModule('./data.json');
 *
 * @example
 * // Resolve relative to custom directory
 * const resolveFromPublic = createPathResolver('./public');
 * const imagePath = resolveFromPublic('./images/logo.png');
 */
function createPathResolver(baseOption) {
	// Convert import.meta.url to file path if needed
	let baseDir;

	if (typeof baseOption === 'string' && baseOption.startsWith('file://')) {
		// It's import.meta.url - convert to directory path
		const filePath = fileURLToPath(baseOption);
		baseDir = path.dirname(filePath);
	} else {
		// It's already a regular path (process.cwd() or custom string)
		baseDir = baseOption;
	}

	return {
		/**
		 * Resolve path segments against the base directory.
		 *
		 * @param segments - Path segments to resolve.
		 * @returns The resolved absolute filesystem path.
		 */
		resolve: (...segments) => path.resolve(baseDir, ...segments),

		/**
		 * Resolve path segments against the base directory and return a file URL.
		 *
		 * @param segments - Path segments to resolve.
		 * @returns The resolved file URL.
		 */
		resolveURL: (...segments) => pathToFileURL(path.resolve(baseDir, ...segments)),
	};
}

export default createPathResolver;
