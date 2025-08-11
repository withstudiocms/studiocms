import type { APIContext, MiddlewareNext } from 'astro';
import type { Effect } from '../effect.js';

/**
 * Represents a middleware handler function for processing API requests within the Effect system.
 *
 * @param context - The API context object containing request and environment information.
 * @param next - The next middleware function in the chain.
 * @returns An Effect that resolves to either a Response or a Promise of Response.
 */
export type EffectMiddlewareHandler = (
	context: APIContext,
	next: MiddlewareNext
) => Effect.Effect<Promise<Response> | Response, unknown, never>;

/**
 * Represents an entry in the middleware router configuration.
 *
 * @property includePaths - Optional path(s) to include for this middleware. Can be a string or an array of strings.
 * @property excludePaths - Optional path(s) to exclude from this middleware. Can be a string or an array of strings.
 * @property handler - The middleware handler function to execute for matched paths.
 */
export interface EffectMiddlewareRouterEntry {
	includePaths?: string | string[];
	excludePaths?: string | string[];
	handler: EffectMiddlewareHandler;
}

/**
 * Represents a handler function for an API route using the Effect system.
 *
 * @param context - The API context provided to the route handler.
 * @returns An Effect that resolves to a `Response` or a `Promise<Response>`.
 */
export type EffectAPIRouteHandler = (
	context: APIContext
) => Effect.Effect<Promise<Response> | Response, unknown, never>;

/**
 * Options for configuring the response of an API endpoint.
 *
 * @property allowedOrigins - An optional array of allowed origin URLs for CORS.
 * @property headers - An optional record of additional HTTP headers to include in the response.
 */
export interface AllResponseOpts {
	allowedOrigins?: string[];
	headers?: Record<string, string>;
}

/**
 * Extends {@link AllResponseOpts} to include HTTP methods allowed for the response.
 *
 * @remarks
 * This interface is typically used to specify additional options for API responses,
 * including which HTTP methods are permitted.
 *
 * @extends AllResponseOpts
 *
 * @property allowedMethods - An array of strings representing the HTTP methods that are allowed (e.g., 'GET', 'POST').
 */
export interface OptionsResponseOpts extends AllResponseOpts {
	allowedMethods: string[];
}

/**
 * Options for creating a response object, extending all base response options.
 *
 * @extends AllResponseOpts
 * @property {number} [status] - Optional HTTP status code for the response.
 * @property {string} [statusText] - Optional HTTP status text for the response.
 */
export interface createResponseOpts extends AllResponseOpts {
	status?: number;
	statusText?: string;
}
