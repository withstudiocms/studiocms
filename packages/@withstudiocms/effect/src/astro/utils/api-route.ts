// Helper functions for the enhanced functionality

import type { APIContext } from 'astro';
import type { AstroAPIRequestBody, EffectRouteOptions } from '../types.js';

/**
 * Applies CORS (Cross-Origin Resource Sharing) headers to an API response based on the provided configuration.
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
 */
export function applyCors(
	context: APIContext,
	corsConfig?: EffectRouteOptions['cors']
): Record<string, string> {
	if (!corsConfig)
		return {
			'Access-Control-Allow-Origin': '*',
		};

	const headers: Record<string, string> = {};
	const origin = context.request.headers.get('Origin');

	// Handle origin
	if (corsConfig.origin === true) {
		headers['Access-Control-Allow-Origin'] = '*';
	} else if (corsConfig.origin === false) {
		// Don't set any origin header
	} else if (typeof corsConfig.origin === 'string') {
		headers['Access-Control-Allow-Origin'] = corsConfig.origin;
	} else if (Array.isArray(corsConfig.origin) && origin) {
		if (corsConfig.origin.includes(origin)) {
			headers['Access-Control-Allow-Origin'] = origin;
		}
	}

	// Handle methods
	if (corsConfig.methods) {
		headers['Access-Control-Allow-Methods'] = corsConfig.methods.join(', ');
	}

	// Handle headers
	if (corsConfig.headers) {
		headers['Access-Control-Allow-Headers'] = corsConfig.headers.join(', ');
	}

	// Handle credentials
	if (corsConfig.credentials) {
		headers['Access-Control-Allow-Credentials'] = 'true';
	}

	return headers;
}

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
	if (validate.params && !validate.params(context.params)) {
		return 'Invalid parameters';
	}

	// Validate query parameters
	if (validate.query) {
		const url = new URL(context.url);
		if (!validate.query(url.searchParams)) {
			return 'Invalid query parameters';
		}
	}

	// Validate body (if present)
	if (validate.body && context.request.method !== 'GET' && context.request.method !== 'HEAD') {
		try {
			const contentType = context.request.headers.get('content-type');
			let body: AstroAPIRequestBody<'json' | 'text' | 'formData'>;

			if (contentType?.includes('application/json')) {
				body = await context.request.clone().json();
			} else if (
				contentType?.includes('application/x-www-form-urlencoded') ||
				contentType?.includes('multipart/form-data')
			) {
				const formData = await context.request.clone().formData();
				// Preserve multiple values for the same key
				const formDataObj: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
				for (const [key, value] of formData.entries()) {
					if (formDataObj[key]) {
						if (Array.isArray(formDataObj[key])) {
							(formDataObj[key] as FormDataEntryValue[]).push(value);
						} else {
							formDataObj[key] = [formDataObj[key] as FormDataEntryValue, value];
						}
					} else {
						formDataObj[key] = value;
					}
				}
				body = formDataObj;
			} else {
				body = await context.request.clone().text();
			}

			if (!validate.body(body)) {
				return 'Invalid request body';
			}
		} catch (_error) {
			return 'Failed to parse request body';
		}
	}

	return null;
}
