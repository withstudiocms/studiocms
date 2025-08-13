import type { APIContext, APIRoute, MiddlewareNext } from 'astro';
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
 * @property priority - Optional priority for the middleware, determining the order of execution. Lower numbers execute first.
 * @property handler - The middleware handler function to execute for matched paths.
 */
export interface EffectMiddlewareRouterEntry {
	includePaths?: string | string[];
	excludePaths?: string | string[];
	priority?: number;
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
export interface CreateResponseOpts extends AllResponseOpts {
	status?: number;
	statusText?: string;
}

/**
 * Represents the resolved type of the body content from an Astro API request,
 * based on the specified body parsing method.
 *
 * @template T - The type of body parsing method to use. Can be 'json', 'text', or 'formData'.
 *               - 'json': Resolves to the parsed JSON object.
 *               - 'text': Resolves to the request body as a string.
 *               - 'formData': Resolves to a FormData object.
 *
 * This utility type extracts the return type of the corresponding method on `APIContext['request']`
 * and awaits it, providing the actual type you will receive after calling the method.
 *
 * @example
 * type JsonBody = AstroAPIRequestBody<'json'>; // Parsed JSON object
 * type TextBody = AstroAPIRequestBody<'text'>; // string
 * type FormDataBody = AstroAPIRequestBody<'formData'>; // FormData
 */
export type AstroAPIRequestBody<T extends 'json' | 'text' | 'formData'> = Awaited<
	ReturnType<APIContext['request'][T]>
>;

/**
 * Options for configuring an Effect API route.
 *
 * @property onError - Optional callback invoked when an error occurs during route handling.
 *   Receives the error and the current API context. Should return a `Response` or a promise resolving to a `Response`.
 *
 * @property onSuccess - Optional callback invoked after a successful response is generated.
 *   Receives the response and the current API context. Should return a `Response` or a promise resolving to a `Response`.
 *
 * @property onBeforeEffect - Optional callback invoked before the main effect is executed.
 *   Receives the current API context and can return a modified context or a promise resolving to one.
 *
 * @property cors - Optional CORS configuration for the route.
 *   - `origin`: Allowed origins (string, array of strings, or boolean).
 *   - `methods`: Allowed HTTP methods.
 *   - `headers`: Allowed headers.
 *   - `credentials`: Whether credentials are allowed.
 *
 * @property timeout - Optional timeout in milliseconds for the route handler.
 *
 * @property validate - Optional validation functions for incoming request data.
 *   - `params`: Function to validate route parameters.
 *   - `query`: Function to validate query parameters.
 *   - `body`: Function to validate the request body, parameterized by body type.
 */
export interface EffectRouteOptions {
	onError?: (error: unknown, context: APIContext) => Response | Promise<Response>;
	onSuccess?: (response: Response, context: APIContext) => Response | Promise<Response>;
	onBeforeEffect?: (context: APIContext) => APIContext | Promise<APIContext>;
	cors?: {
		origin?: string | string[] | boolean;
		methods?: string[];
		headers?: string[];
		credentials?: boolean;
	};
	timeout?: number;
	validate?: {
		params?: (params: APIContext['params']) => boolean;
		query?: (query: APIContext['url']['searchParams']) => boolean;
		body?: <T extends 'json' | 'text' | 'formData'>(body: AstroAPIRequestBody<T>) => boolean;
	};
}

/**
 * Configuration options for an API route handler.
 *
 * Extends {@link EffectRouteOptions} to provide additional configuration,
 * including the ability to specify method-specific overrides.
 *
 * @property methods - An optional object allowing you to override route options
 *   for specific HTTP methods. Each key corresponds to an HTTP method and its value
 *   is a partial set of {@link EffectRouteOptions} for that method.
 *   Supported methods include: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, and ALL.
 */
export interface RouteHandlerConfig extends EffectRouteOptions {
	// Allow method-specific overrides
	methods?: {
		GET?: Partial<EffectRouteOptions>;
		POST?: Partial<EffectRouteOptions>;
		PUT?: Partial<EffectRouteOptions>;
		DELETE?: Partial<EffectRouteOptions>;
		PATCH?: Partial<EffectRouteOptions>;
		HEAD?: Partial<EffectRouteOptions>;
		OPTIONS?: Partial<EffectRouteOptions>;
		ALL?: Partial<EffectRouteOptions>;
	};
}

/**
 * Represents a collection of HTTP method handlers for an API route.
 * Each property corresponds to a standard HTTP method and is optional.
 *
 * @property GET - Handler for HTTP GET requests.
 * @property POST - Handler for HTTP POST requests.
 * @property PUT - Handler for HTTP PUT requests.
 * @property DELETE - Handler for HTTP DELETE requests.
 * @property PATCH - Handler for HTTP PATCH requests.
 * @property HEAD - Handler for HTTP HEAD requests.
 * @property OPTIONS - Handler for HTTP OPTIONS requests.
 * @property ALL - Handler for all HTTP methods.
 */
export interface RouteHandlers {
	GET?: EffectAPIRouteHandler;
	POST?: EffectAPIRouteHandler;
	PUT?: EffectAPIRouteHandler;
	DELETE?: EffectAPIRouteHandler;
	PATCH?: EffectAPIRouteHandler;
	HEAD?: EffectAPIRouteHandler;
	OPTIONS?: EffectAPIRouteHandler;
	ALL?: EffectAPIRouteHandler;
}

// Type utility to extract only the defined methods from RouteHandlers
export type ExtractDefinedRoutes<T extends RouteHandlers> = {
	[K in keyof T as T[K] extends EffectAPIRouteHandler ? K : never]: APIRoute;
};
