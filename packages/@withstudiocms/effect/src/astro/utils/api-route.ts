// Helper functions for the enhanced functionality

import type { APIContext } from 'astro';
import type { AstroAPIRequestBody, EffectRouteOptions } from '../types.js';

/**
 * Generates CORS (Cross-Origin Resource Sharing) headers for an API response based on the provided configuration.
 *
 * @param context - The API context containing the incoming request, used to extract the `Origin` header.
 * @param corsConfig - Optional CORS configuration specifying allowed origins, methods, headers, and credentials.
 * @returns An object containing the appropriate CORS headers to be set on the response.
 *
 * @remarks
 * - If `corsConfig.origin` is `true`, allows all origins (`*`).
 * - If `corsConfig.origin` is a string, allows only the specified origin.
 * - If `corsConfig.origin` is an array, allows only origins included in the array.
 * - If `corsConfig.methods` is provided, sets the allowed HTTP methods.
 * - If `corsConfig.headers` is provided, sets the allowed request headers.
 * - If `corsConfig.credentials` is `true`, allows credentials to be included in requests.
 * - When credentials are enabled, the wildcard origin '*' is not permitted by browsers; the origin will be reflected and 'Vary: Origin' will be set.
 */
export function getCorsHeaders(
	context: APIContext,
	corsConfig?: EffectRouteOptions['cors']
): Record<string, string> {
	if (!corsConfig)
		return {
			'Access-Control-Allow-Origin': '*',
		};

	const headers: Record<string, string> = {};
	const origin =
		context.request.headers.get('origin') ?? context.request.headers.get('Origin') ?? '';
	// Handle origin according to configuration
	const cfgOrigin = corsConfig.origin;
	if (cfgOrigin === true) {
		headers['Access-Control-Allow-Origin'] = '*';
	} else if (typeof cfgOrigin === 'string') {
		headers['Access-Control-Allow-Origin'] = cfgOrigin;
	} else if (Array.isArray(cfgOrigin)) {
		if (origin && cfgOrigin.includes(origin)) {
			headers['Access-Control-Allow-Origin'] = origin;
		}
	}
	// If cfgOrigin is false or undefined, do not set the header here.
	// Handle methods
	if (corsConfig.methods) {
		headers['Access-Control-Allow-Methods'] = corsConfig.methods.join(', ');
		headers.Allow = corsConfig.methods.join(', ');
	}
	// Handle headers
	if (corsConfig.headers) {
		headers['Access-Control-Allow-Headers'] = corsConfig.headers.join(', ');
	} else if (context.request.method === 'OPTIONS') {
		const acrh =
			context.request.headers.get('access-control-request-headers') ??
			context.request.headers.get('Access-Control-Request-Headers');
		if (acrh) {
			headers['Access-Control-Allow-Headers'] = acrh;
		}
	}
	// Handle credentials and adjust origin accordingly
	if (corsConfig.credentials) {
		headers['Access-Control-Allow-Credentials'] = 'true';
		// If credentials are enabled, '*' is not allowed. Reflect the request origin instead.
		if (headers['Access-Control-Allow-Origin'] === '*') {
			if (origin) {
				headers['Access-Control-Allow-Origin'] = origin;
			} else {
				// No Origin to reflect – avoid sending '*' with credentials
				delete headers['Access-Control-Allow-Origin'];
			}
		}
	}
	// When reflecting origin, set Vary: Origin for correct caching behavior
	if (origin && headers['Access-Control-Allow-Origin'] === origin) {
		headers['Vary'] = headers['Vary'] ? `${headers['Vary']}, Origin` : 'Origin';
	}
	return headers;
}

/**
 * Enum representing supported content types for API routes.
 *
 * @remarks
 * This enum is used to specify the expected format of request or response bodies
 * in API route utilities.
 *
 * @enum
 * @property JSON - Represents JSON content type.
 * @property FORM_DATA - Represents form data content type (e.g., multipart/form-data).
 * @property TEXT - Represents plain text content type.
 */
enum SupportedValidatorContentType {
	JSON = 'json',
	FORM_DATA = 'formData',
	TEXT = 'text',
}

/**
 * Maps HTTP `Content-Type` header values to their corresponding request body parsing strategies.
 *
 * - `'application/json'` maps to `'json'`, indicating the body should be parsed as JSON.
 * - `'application/x-www-form-urlencoded'` and `'multipart/form-data'` both map to `'formData'`, indicating the body should be parsed as form data.
 *
 * This map is useful for determining how to process incoming request bodies based on their `Content-Type` header.
 */
const SupportedContentTypeHeadersMap = {
	'application/json': SupportedValidatorContentType.JSON,
	'application/x-www-form-urlencoded': SupportedValidatorContentType.FORM_DATA,
	'multipart/form-data': SupportedValidatorContentType.FORM_DATA,
} as const;

type SupportedContentType = keyof typeof SupportedContentTypeHeadersMap;

/**
 * Validates the incoming API request based on the provided validation options.
 *
 * @param context - The API context containing request details such as params, URL, and request object.
 * @param validate - An object specifying validation functions for params, query, and body.
 * @returns A promise that resolves to a string describing the validation error, or `null` if the request is valid.
 *
 * @remarks
 * - Validates route parameters if a `params` validator is provided.
 * - Validates query parameters if a `query` validator is provided.
 * - Validates the request body (for non-GET/HEAD requests) if a `body` validator is provided.
 * - Attempts to parse the request body as JSON, form data, or text based on the `Content-Type` header.
 * - Returns a specific error message for each validation failure or parsing error.
 */
export async function validateRequest(
	context: APIContext,
	validate: EffectRouteOptions['validate']
): Promise<string | null> {
	if (!validate) return null;

	// Validate params
	if (validate.params && !(await validate.params(context.params))) {
		return 'Invalid parameters';
	}

	// Validate query parameters
	if (validate.query) {
		const url = context.url instanceof URL ? context.url : new URL(context.url);
		if (!(await validate.query(url.searchParams))) {
			return 'Invalid query parameters';
		}
	}

	// Validate body (if present)
	if (validate.body && context.request.method !== 'GET' && context.request.method !== 'HEAD') {
		try {
			const contentType = context.request.headers.get('content-type')?.toLowerCase() ?? '';

			let bodyType: SupportedValidatorContentType = SupportedValidatorContentType.TEXT;
			let body: AstroAPIRequestBody<'json' | 'text' | 'formData'>;

			// Determine body type based on content type
			const mediaType = contentType.split(';', 1)[0].trim();
			if (mediaType && mediaType in SupportedContentTypeHeadersMap) {
				bodyType = SupportedContentTypeHeadersMap[mediaType as SupportedContentType];
				body = await context.request.clone()[bodyType]();
			} else if (mediaType.endsWith('+json')) {
				bodyType = SupportedValidatorContentType.JSON;
				body = await context.request.clone().json();
			} else {
				bodyType = SupportedValidatorContentType.TEXT;
				body = await context.request.clone().text();
			}

			// Validate body based on type
			switch (bodyType) {
				case SupportedValidatorContentType.JSON:
					if (validate.body.kind !== 'json') {
						return 'Invalid body content type';
					}
					if (!(await validate.body.json(body))) {
						return 'Invalid JSON body';
					}
					break;
				case SupportedValidatorContentType.FORM_DATA:
					if (validate.body.kind !== 'formData') {
						return 'Invalid body content type';
					}
					if (!(await validate.body.formData(body as FormData))) {
						return 'Invalid form data body';
					}
					break;
				case SupportedValidatorContentType.TEXT:
					if (validate.body.kind !== 'text') {
						return 'Invalid body content type';
					}
					if (!(await validate.body.text(body as string))) {
						return 'Invalid text body';
					}
					break;
			}
		} catch (_error) {
			return 'Failed to parse request body';
		}
	}

	return null;
}
