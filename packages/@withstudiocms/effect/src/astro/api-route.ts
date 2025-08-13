import type { APIContext, APIRoute } from 'astro';
import { runEffect } from '../index.js';
import type {
	EffectAPIRouteHandler,
	EffectRouteOptions,
	ExtractDefinedRoutes,
	RouteHandlerConfig,
	RouteHandlers,
} from './types.js';
import { applyCors, validateRequest } from './utils/api-route.js';

/**
 * Defines an API route handler for Astro using an effect-based approach.
 *
 * @param context - The API context provided by Astro for the current request.
 * @returns A function that takes an `EffectAPIRouteHandler`, executes it with the provided context,
 *          and returns a `Promise<Response>` representing the HTTP response.
 *
 * @example
 * ```typescript
 * export const GET = defineAPIRoute(context)(async (ctx) => {
 *   // Your effectful logic here
 *   return new Response("Hello, world!");
 * });
 * ```
 *
 * @deprecated Use `createEffectRoute` instead for better clarity and consistency.
 */
export const defineAPIRoute =
	(context: APIContext) =>
	async (fn: EffectAPIRouteHandler): Promise<Response> =>
		await runEffect(fn(context));

/**
 * Creates an Astro API route handler that executes the provided effectful handler function.
 *
 * @param fn - The effectful API route handler function to be executed. It should accept an `APIContext` and return an effect.
 * @returns An Astro `APIRoute` handler that runs the effect and returns a `Response`.
 */
export const createEffectAPIRoute = (fn: EffectAPIRouteHandler): APIRoute => {
	return async (context: APIContext): Promise<Response> => {
		return await runEffect(fn(context));
	};
};

/**
 * Wraps an API route handler with effectful middleware, including CORS, validation, timeout, and custom hooks.
 *
 * @param fn - The main effectful API route handler function to execute.
 * @param options - Optional configuration for the route, including CORS, validation, timeout, and middleware hooks.
 * @returns An `APIRoute` function compatible with Astro's API routes.
 *
 * @remarks
 * This utility provides a standardized way to handle API routes with common concerns such as:
 * - Applying CORS headers and handling preflight requests.
 * - Running pre-effect middleware (`onBeforeEffect`).
 * - Validating incoming requests (`validate`).
 * - Enforcing a timeout for the effect execution.
 * - Running post-success (`onSuccess`) and error (`onError`) middleware.
 * - Ensuring CORS headers are present on all responses, including errors.
 *
 * @example
 * ```typescript
 * export const POST = withEffect(async (context) => {
 *   // Your effect logic here
 * }, {
 *   cors: { origin: '*' },
 *   validate: { body: z.object({ name: z.string() }) },
 *   timeout: 5000,
 *   onSuccess: async (response, context) => response,
 *   onError: async (error, context) => new Response('Error', { status: 500 }),
 * });
 * ```
 */
export const withEffectAPI = (
	fn: EffectAPIRouteHandler,
	options: EffectRouteOptions = {}
): APIRoute => {
	return async (context: APIContext): Promise<Response> => {
		try {
			// Apply CORS headers if configured
			const corsHeaders = applyCors(context, options.cors);

			// Handle preflight requests
			if (context.request.method === 'OPTIONS') {
				return new Response(null, {
					status: 204,
					headers: corsHeaders,
				});
			}

			// Apply pre-effect middleware
			let processedContext = context;
			if (options.onBeforeEffect) {
				processedContext = await options.onBeforeEffect(context);
			}

			// Validate request if validators provided
			if (options.validate) {
				const validationError = await validateRequest(processedContext, options.validate);
				if (validationError) {
					const errorResponse = new Response(
						JSON.stringify({ error: 'Validation failed', details: validationError }),
						{ status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
					);
					return errorResponse;
				}
			}

			// Execute the effect with timeout if specified
			let effectPromise = runEffect(fn(processedContext));
			if (options.timeout) {
				effectPromise = Promise.race([
					effectPromise,
					new Promise<never>((_, reject) =>
						setTimeout(() => reject(new Error('Request timeout')), options.timeout)
					),
				]);
			}

			const response = await effectPromise;

			// Add CORS headers to response
			if (corsHeaders && Object.keys(corsHeaders).length > 0) {
				Object.entries(corsHeaders).forEach(([key, value]) => {
					response.headers.set(key, value);
				});
			}

			// Apply success middleware
			return options.onSuccess ? await options.onSuccess(response, processedContext) : response;
		} catch (error) {
			const corsHeaders = applyCors(context, options.cors);

			if (options.onError) {
				const errorResponse = await options.onError(error, context);
				// Ensure CORS headers on error responses too
				Object.entries(corsHeaders).forEach(([key, value]) => {
					errorResponse.headers.set(key, value);
				});
				return errorResponse;
			}

			// Default error handling with CORS
			return new Response(
				JSON.stringify({
					error: error instanceof Error ? error.message : 'Internal Server Error',
				}),
				{
					status: error instanceof Error && error.message === 'Request timeout' ? 408 : 500,
					headers: {
						'Content-Type': 'application/json',
						...corsHeaders,
					},
				}
			);
		}
	};
};

/**
 * Creates API route handlers with effect support for each HTTP method provided.
 *
 * This function takes a set of route handlers and an optional configuration object,
 * then returns an object mapping HTTP methods to their corresponding API route handlers,
 * each wrapped with effect middleware and merged configuration.
 *
 * The return type is precisely typed to only include the methods that were provided
 * in the handlers parameter, eliminating undefined from the union types.
 *
 * @param handlers - An object containing route handlers keyed by HTTP method (e.g., 'GET', 'POST').
 * @param config - Optional global configuration for all handlers. Can include method-specific overrides via the `methods` property.
 * @returns An object mapping each provided HTTP method to its configured API route handler.
 */
export const createEffectAPIRoutes = <T extends RouteHandlers>(
	handlers: T,
	config: RouteHandlerConfig = {}
): ExtractDefinedRoutes<T> => {
	const routes = {} as ExtractDefinedRoutes<T>;

	for (const [method, handler] of Object.entries(handlers)) {
		if (handler) {
			const methodKey = method as keyof RouteHandlers;

			// Merge global config with method-specific overrides
			const methodConfig = {
				...config,
				...(config.methods?.[methodKey] || {}),
			};

			// Remove the methods property from the final config
			const { methods: _droppedMethods, ...finalConfig } = methodConfig;

			// TypeScript knows this is safe because we checked `if (handler)` above
			// biome-ignore lint/suspicious/noExplicitAny: `routes` is typed as `ExtractDefinedRoutes<T>`
			(routes as any)[methodKey] = withEffectAPI(handler as EffectAPIRouteHandler, finalConfig);
		}
	}

	return routes;
};

/**
 * A builder class for defining API route handlers with optional per-method and global configuration.
 *
 * Provides a fluent interface for registering HTTP method handlers (`get`, `post`, `put`, `delete`, `patch`, `all`)
 * and setting global or per-method options. Use `build()` to generate the final route configuration.
 *
 * Each method returns a new builder type that accumulates the added methods, ensuring precise typing
 * in the final built routes object.
 *
 * @example
 * ```typescript
 * const routes = new EffectRouteBuilder()
 *   .withGlobalConfig({ cors: { origin: true } })
 *   .get(getHandler, { timeout: 3000 })
 *   .post(postHandler)
 *   .build();
 * // routes has type: { GET: APIRoute, POST: APIRoute } (no undefined!)
 * ```
 */

// biome-ignore lint/complexity/noBannedTypes: `T` is used to accumulate handlers
export class EffectAPIRouteBuilder<T extends Partial<RouteHandlers> = {}> {
	private handlers: T;
	private config: RouteHandlerConfig = {};

	constructor(handlers: T = {} as T) {
		this.handlers = handlers;
	}

	// Set global configuration
	public withGlobalConfig(config: EffectRouteOptions): EffectAPIRouteBuilder<T> {
		this.config = { ...this.config, ...config };
		return this;
	}

	private addHandler<K extends keyof RouteHandlers, U extends EffectAPIRouteHandler>(
		method: K,
		handler: U,
		options?: Partial<EffectRouteOptions>
	): EffectAPIRouteBuilder<T & Record<K, U>> {
		const newHandlers = { ...this.handlers, [method]: handler } as T & Record<K, U>;
		const newBuilder = new EffectAPIRouteBuilder(newHandlers);
		newBuilder.config = { ...this.config };

		if (options) {
			newBuilder.config.methods = { ...this.config.methods, [method]: options };
		}
		return newBuilder;
	}

	// Add handlers with fluent interface - each method returns a new type that includes the added method
	public get<U extends EffectAPIRouteHandler>(
		handler: U,
		options?: Partial<EffectRouteOptions>
	): EffectAPIRouteBuilder<T & { GET: U }> {
		return this.addHandler('GET', handler, options) as EffectAPIRouteBuilder<T & { GET: U }>;
	}

	public post<U extends EffectAPIRouteHandler>(
		handler: U,
		options?: Partial<EffectRouteOptions>
	): EffectAPIRouteBuilder<T & { POST: U }> {
		return this.addHandler('POST', handler, options) as EffectAPIRouteBuilder<T & { POST: U }>;
	}

	public put<U extends EffectAPIRouteHandler>(
		handler: U,
		options?: Partial<EffectRouteOptions>
	): EffectAPIRouteBuilder<T & { PUT: U }> {
		return this.addHandler('PUT', handler, options) as EffectAPIRouteBuilder<T & { PUT: U }>;
	}

	public delete<U extends EffectAPIRouteHandler>(
		handler: U,
		options?: Partial<EffectRouteOptions>
	): EffectAPIRouteBuilder<T & { DELETE: U }> {
		return this.addHandler('DELETE', handler, options) as EffectAPIRouteBuilder<T & { DELETE: U }>;
	}

	public patch<U extends EffectAPIRouteHandler>(
		handler: U,
		options?: Partial<EffectRouteOptions>
	): EffectAPIRouteBuilder<T & { PATCH: U }> {
		return this.addHandler('PATCH', handler, options) as EffectAPIRouteBuilder<T & { PATCH: U }>;
	}

	public all<U extends EffectAPIRouteHandler>(
		handler: U,
		options?: Partial<EffectRouteOptions>
	): EffectAPIRouteBuilder<T & { ALL: U }> {
		return this.addHandler('ALL', handler, options) as EffectAPIRouteBuilder<T & { ALL: U }>;
	}

	// Build the final routes with precise typing
	public build(): ExtractDefinedRoutes<T> {
		return createEffectAPIRoutes(this.handlers, this.config);
	}
}
