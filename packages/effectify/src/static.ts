import {
	FileSystem,
	HttpApiBuilder,
	HttpServerRequest,
	HttpServerResponse,
	Path,
} from '@effect/platform';
import { NotFound } from '@effect/platform/HttpApiError';
import type { PathInput } from '@effect/platform/HttpRouter';
import { Duration, Effect, pipe } from 'effect';

/**
 * Utility function to check if a given path corresponds to a file.
 *
 * This function uses the FileSystem service to check the status of the path and determine if it is a file. If the path does not exist or an error occurs during the check, it will return false, indicating that the path is not a file.
 *
 * @param path - The file system path to check.
 * @returns An Effect that resolves to true if the path is a file, or false if it is not a file or if an error occurs.
 */
const isFile = (path: string) =>
	pipe(
		FileSystem.FileSystem,
		Effect.andThen((fs) => fs.stat(path)),
		Effect.map((stat) => stat.type === 'File'),
		Effect.catchAll(() => Effect.succeed(false))
	);

/**
 * Creates an HTTP API router that serves static files from a specified directory. The router can be configured to serve an `index.html` file for the root path and to set appropriate caching headers for files with hashed filenames.
 *
 * @param config - Optional configuration for the static file router.
 * @returns A function that takes a variable number of path segments to specify the directory from which to serve static files, and returns an HttpApiBuilder.Router that can be used in an Effect HTTP API.
 */
export const makeStaticFileHttpApiRouter =
	(config?: {
		/**
		 * If true, the router will serve an `index.html` file from the specified directory when the root path (`/`) is requested. This is useful for single-page applications (SPAs) where you want to serve the main HTML file for all routes and let the client-side routing handle the rest.
		 *
		 * When `htmlIndex` is enabled, if a request is made to the root path (`/`), the router will look for an `index.html` file in the specified directory and serve it. If the file is not found, it will return a 404 Not Found response.
		 *
		 * If `htmlIndex` is set to false or not provided, the router will not serve an `index.html` file for the root path, and requests to `/` will be treated as requests for a static file named `index.html` in the specified directory. If such a file does not exist, it will return a 404 Not Found response.
		 */
		htmlIndex?: boolean;

		/**
		 * The web path at which the static file router will be mounted. This path will be used as a prefix for all requests that the router will handle. For example, if `path` is set to `/static`, then the router will handle requests to `/static/*` and serve files from the specified directory based on the request URL.
		 *
		 * @default '/*' - If not specified, the router will be mounted at the root path and will handle all requests to `/*`.
		 */
		path?: PathInput;
	}) =>
	(...pathToDirectory: string[]) =>
		HttpApiBuilder.Router.use((router) =>
			router.get(
				config?.path ?? '/*',
				Effect.gen(function* () {
					// Get the original request and the path utilities from the Effect environment
					const [request, path] = yield* Effect.all([
						HttpServerRequest.HttpServerRequest,
						Path.Path,
					]);

					// Resolve the full path to the static file being requested
					const resolvedDirPath = path.resolve(...pathToDirectory);

					// Resolve the full file path based on the request URL
					const filePath = path.resolve(...pathToDirectory, request.url.slice(1));

					// If htmlIndex is enabled and the request URL is the root path, serve the index.html file from the specified directory
					if (config?.htmlIndex && request.url === '/') {
						const indexPath = path.resolve(...pathToDirectory, 'index.html');
						if (yield* isFile(indexPath)) {
							return yield* HttpServerResponse.file(indexPath, {});
						}
						return yield* new NotFound();
					}

					// Check if the resolved file path is within the allowed directory and if it is a file. If not, continue with the original application flow.
					if (!filePath.startsWith(resolvedDirPath) || !(yield* isFile(filePath))) {
						return yield* new NotFound();
					}

					// Serve the static file using HttpServerResponse.file and set appropriate caching headers for files that match the specified pattern (e.g., hashed filenames).
					const response = yield* HttpServerResponse.file(filePath, {});

					// If the file does not match the pattern for hashed filenames, return the response as is. Otherwise, set a long cache duration for the file.
					if (!/\.[a-z0-9]{8,}\.[A-z0-9]+(?:\.map)?$/.exec(filePath)) {
						return yield* response;
					}

					// Set the Cache-Control header to cache the file for 365 days and mark it as immutable, which is suitable for files with hashed filenames that won't change.
					return yield* HttpServerResponse.setHeader(
						response,
						'Cache-Control',
						`public, max-age=${Duration.toSeconds('365 days')}, immutable`
					);
				})
			)
		);
