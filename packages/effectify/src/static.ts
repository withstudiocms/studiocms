import {
	FileSystem,
	HttpApiBuilder,
	HttpMiddleware,
	HttpRouter,
	HttpServerRequest,
	HttpServerResponse,
	Path,
} from '@effect/platform';
import { DateTime, Duration, Effect, pipe } from 'effect';

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
 * A catch-all route that matches any path and returns a 404 Not Found response. This is used as a fallback in the static file router to ensure that if a requested file is not found, the server responds with a 404 status instead of hanging or returning an unexpected response.
 */
const catchAll = HttpRouter.all('*', HttpServerResponse.text('Not Found', { status: 404 }));

/**
 * Utility function to log the time taken for a specific operation, which can be useful for debugging and performance monitoring. It takes a start time and a message, calculates the duration since the start time, and logs the message along with the time taken in milliseconds.
 *
 * @param start - The starting time of the operation, typically obtained using DateTime.unsafeNow() at the beginning of the operation.
 * @param message - A descriptive message to include in the log output, which can help identify which operation is being measured.
 * @returns An Effect that performs the logging of the message and the time taken for the operation.
 */
const reportEnding = Effect.fn(function* (start: DateTime.Utc, message: string) {
	const end = DateTime.unsafeNow();
	const duration = end.epochMillis - start.epochMillis;
	yield* Effect.logDebug(`${message} Time taken: ${duration}ms`);
});

/**
 * Configuration options for the Static File Middleware.
 *
 * This interface defines the optional configuration parameters for the static file middleware, including whether to serve an `index.html` file for the root path and an optional path prefix for serving static files.
 */
export interface StaticFileConfig {
	/**
	 * If set to true, the middleware will serve an `index.html` file from the specified directory when the root path (`/`) is requested. This is useful for single-page applications where the `index.html` file serves as the entry point for the application.
	 */
	htmlIndex?: boolean;
	/**
	 * An optional path prefix for serving static files. If specified, the middleware will only serve files that match this prefix, allowing you to serve static files under a specific URL path.
	 */
	pathPrefix?: string;
}

/**
 * Creates an HTTP middleware that serves static files from a specified directory. The middleware can be configured to serve an `index.html` file for the root path and to set appropriate caching headers for files with hashed filenames.
 *
 * This middleware can be used in an Effect HTTP API to serve static files alongside your API routes. It checks if the requested file exists and is a file, and if so, serves it with appropriate caching headers for files that match a specific pattern (e.g., hashed filenames). If the file does not exist or is not a file, it allows the request to continue to the next middleware or route handler.
 *
 * @param config - Optional configuration for the static file middleware.
 * @returns A function that takes a variable number of path segments to specify the directory from which to serve static files, and returns an HttpApiBuilder.Router that can be used in an Effect HTTP API.
 */
export const makeStaticFileMiddleware =
	(config?: StaticFileConfig) =>
	(...pathToDirectory: string[]) =>
		HttpMiddleware.make((app) =>
			Effect.gen(function* () {
				// Start a timer to measure the time taken to process the static file request, which can be useful for debugging and performance monitoring.
				const start = DateTime.unsafeNow();

				// Log the incoming request for debugging purposes
				yield* Effect.logDebug('Received request for static file');

				// Get the original request and the path utilities from the Effect environment
				const [request, path] = yield* Effect.all([HttpServerRequest.HttpServerRequest, Path.Path]);

				// Resolve the full path to the static file being requested
				const resolvedDirPath = path.resolve(...pathToDirectory);

				// Determine the current URL by removing the path prefix if it is configured. This allows the middleware to correctly resolve the file path even if the static files are served under a specific path prefix.
				const currentUrl =
					config?.pathPrefix && request.url.startsWith(config.pathPrefix)
						? request.url.slice(config.pathPrefix.length)
						: request.url;

				// If htmlIndex is enabled and the request URL is the root path, serve the index.html file from the specified directory. Otherwise, resolve the file path based on the request URL.
				const urlToTest = config?.htmlIndex && currentUrl === '/' ? '/index.html' : currentUrl;

				// Resolve the full file path based on the request URL
				const filePath = path.resolve(...pathToDirectory, urlToTest.slice(1));

				// Check if the resolved file path is within the allowed directory and if it is a file. If not, log a debug message and continue with the original application flow. This check is performed before the htmlIndex check to ensure that if the root path is requested and htmlIndex is enabled, it will correctly serve the index.html file if it exists, while still ensuring that any other requested files are properly validated.
				if (
					!(filePath === resolvedDirPath || filePath.startsWith(`${resolvedDirPath}${path.sep}`)) ||
					!(yield* isFile(filePath))
				) {
					// Log that the requested file was not found or is not a file for debugging purposes
					yield* reportEnding(
						start,
						`Static file request for ${urlToTest} not found or is not a file.`
					);

					// Continue with the original application flow if the file is not found or is not a file, allowing other middleware or route handlers to process the request as needed.
					return yield* app;
				}

				// Serve the static file using HttpServerResponse.file and set appropriate caching headers for files that match the specified pattern (e.g., hashed filenames).
				const response = yield* HttpServerResponse.file(filePath, {});

				// If the file does not match the pattern for hashed filenames, return the response as is. Otherwise, set a long cache duration for the file.
				if (!/\.[a-z0-9]{8,}\.[A-Za-z0-9]+(?:\.map)?$/.exec(filePath)) {
					// Log that we are serving a file without caching headers for debugging purposes
					yield* reportEnding(start, `Served static file ${urlToTest} without caching headers.`);

					// Return the response without setting caching headers for files that do not match the hashed filename pattern, as these files may change frequently and should not be cached aggressively.
					return response;
				}

				// Log that we are serving a file with caching headers for debugging purposes
				yield* reportEnding(start, `Served static file ${urlToTest} with caching headers.`);

				// Set the Cache-Control header to cache the file for 365 days and mark it as immutable, which is suitable for files with hashed filenames that won't change.
				return yield* HttpServerResponse.setHeader(
					response,
					'Cache-Control',
					`public, max-age=${Duration.toSeconds('365 days')}, immutable`
				);
			}).pipe(Effect.withLogSpan('effectify.StaticFileMiddleware'))
		);

/**
 * Creates an HTTP API router that serves static files from a specified directory. The router can be configured to serve an `index.html` file for the root path and to set appropriate caching headers for files with hashed filenames.
 *
 * @param config - Optional configuration for the static file router.
 * @returns A function that takes a variable number of path segments to specify the directory from which to serve static files, and returns an HttpApiBuilder.Router that can be used in an Effect HTTP API.
 */
export const makeStaticFileHttpApiRouter =
	(config?: StaticFileConfig) =>
	(...pathToDirectory: string[]) => {
		const staticFileRouter = HttpRouter.empty.pipe(
			catchAll,
			HttpRouter.use(makeStaticFileMiddleware(config)(...pathToDirectory))
		);
		return HttpApiBuilder.Router.use((_) => _.concat(staticFileRouter));
	};
