import type { AllResponseOpts, createResponseOpts, OptionsResponseOpts } from './types.js';

/**
 * Generates a 204 No Content HTTP response for OPTIONS requests with appropriate CORS and allowed methods headers.
 *
 * @param opts - Configuration options for the response.
 * @param opts.allowedMethods - Array of HTTP methods allowed for the route (e.g., ['GET', 'POST']).
 * @param opts.allowedOrigins - Optional array of allowed origins for CORS. If not provided, defaults to '*'.
 * @param opts.headers - Optional additional headers to include in the response.
 * @returns A `Response` object configured for an OPTIONS request.
 */
export const OptionsResponse = (opts: OptionsResponseOpts): Response =>
	new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			...opts.headers,
			Allow: `OPTIONS, ${opts.allowedMethods.join(', ')}`,
			'Access-Control-Allow-Origin': opts.allowedOrigins?.join(', ') || '*',
			Date: new Date().toUTCString(),
		},
	});

/**
 * Creates a `Response` object with a 405 "Method Not Allowed" status.
 *
 * @param opts - Options for configuring the response.
 * @param opts.allowedOrigins - An optional array of allowed origins for CORS. If not provided, defaults to '*'.
 * @param opts.headers - Optional additional headers to include in the response.
 * @returns A `Response` object with the specified headers and a 405 status.
 */
export const AllResponse = (opts?: AllResponseOpts): Response =>
	new Response(null, {
		status: 405,
		statusText: 'Method Not Allowed',
		headers: {
			...opts?.headers,
			'Access-Control-Allow-Origin': opts?.allowedOrigins?.join(', ') || '*',
			Date: new Date().toUTCString(),
		},
	});

/**
 * Creates a JSON HTTP response with customizable status, headers, and CORS settings.
 *
 * @template T - The type of the data to be serialized as JSON.
 * @param data - The data to be included in the response body.
 * @param opts - Optional settings for the response, including status code, status text, headers, and allowed origins.
 * @returns A `Response` object with the serialized JSON data and specified options.
 */
export const createJsonResponse = <T>(data: T, opts: createResponseOpts = {}) =>
	new Response(JSON.stringify(data), {
		status: opts.status || 200,
		statusText: opts.statusText || 'OK',
		headers: {
			'Content-Type': 'application/json',
			...opts?.headers,
			'Access-Control-Allow-Origin': opts?.allowedOrigins?.join(', ') || '*',
			Date: new Date().toUTCString(),
		},
	});

/**
 * Creates a `Response` object with a plain text body and customizable options.
 *
 * @param data - The string content to be sent in the response body.
 * @param opts - Optional settings for the response, including status, statusText, headers, and allowed origins.
 * @returns A `Response` object with the specified text content and options.
 */
export const createTextResponse = (data: string, opts: createResponseOpts = {}) =>
	new Response(data, {
		status: opts.status || 200,
		statusText: opts.statusText || 'OK',
		headers: {
			'Content-Type': 'text/plain',
			...opts?.headers,
			'Access-Control-Allow-Origin': opts?.allowedOrigins?.join(', ') || '*',
			Date: new Date().toUTCString(),
		},
	});

/**
 * Creates an HTML response with customizable status, headers, and allowed origins.
 *
 * @param data - The HTML string to be sent in the response body.
 * @param opts - Optional settings for the response, including status, statusText, headers, and allowedOrigins.
 * @returns A `Response` object with the specified HTML content and headers.
 */
export const createHtmlResponse = (data: string, opts: createResponseOpts = {}) =>
	new Response(data, {
		status: opts.status || 200,
		statusText: opts.statusText || 'OK',
		headers: {
			'Content-Type': 'text/html',
			...opts?.headers,
			'Access-Control-Allow-Origin': opts?.allowedOrigins?.join(', ') || '*',
			Date: new Date().toUTCString(),
		},
	});

/**
 * Creates a HTTP 302 redirect response with customizable headers.
 *
 * @param url - The URL to redirect to, set in the `Location` header.
 * @param opts - Optional settings for the response.
 * @param opts.headers - Additional headers to include in the response.
 * @param opts.allowedOrigins - Array of allowed origins for CORS, joined and set in the `Access-Control-Allow-Origin` header. Defaults to `*` if not provided.
 * @returns A `Response` object configured for a 302 redirect.
 */
export const createRedirectResponse = (url: string, opts: createResponseOpts = {}) =>
	new Response(null, {
		status: 302,
		statusText: 'Found',
		headers: {
			Location: url,
			...opts?.headers,
			'Access-Control-Allow-Origin': opts?.allowedOrigins?.join(', ') || '*',
			Date: new Date().toUTCString(),
		},
	});
