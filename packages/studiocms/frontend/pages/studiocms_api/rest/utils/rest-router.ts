import {
	AllResponse,
	createEffectAPIRoute,
	createJsonResponse,
	genLogger,
	type HTTPMethod,
} from '@withstudiocms/effect';
import type { APIRoute } from 'astro';
import { Effect, type ParseResult, Schema, type SchemaAST } from 'effect';
import type { NonEmptyReadonlyArray } from 'effect/Array';
import { extractParams } from './param-extractor';

/**
 * An entry in the route registry defining handlers for a specific ID type.
 *
 * @template IdType - The type of ID used in the routes, either 'number' or 'string'
 *
 * @remarks
 * This type defines a structure for registering API route handlers based on
 * the type of ID used. It includes a mapping for general routes (`__index`)
 * and a function to retrieve handlers for specific IDs.
 *
 * @example
 * ```typescript
 * const userRouteEntry: RegistryEntry<'number'> = {
 *   __idType: 'number',
 *   __index: { GET: async (ctx) => { ... } },
 *   id: (id: number) => ({ GET: async (ctx) => { ... } })
 * };
 * ```
 */
export type RegistryEntry<IdType extends 'number' | 'string' = 'number'> = {
	__idType: IdType;
	__index: Partial<Record<HTTPMethod | 'ALL', APIRoute>>;
	id?: (
		id: IdType extends 'number' ? number : string
	) => Partial<Record<HTTPMethod | 'ALL', APIRoute>>;
};

/**
 * A union type representing an endpoint route configuration.
 *
 * @remarks
 * This type can either be a `RegistryEntry` configured for numeric IDs
 * or for string IDs, allowing flexibility in defining API endpoint routes.
 *
 * @example
 * ```typescript
 * const numericRoute: EndpointRoute = {
 *   __idType: 'number',
 *   __index: { GET: async (ctx) => { ... } },
 *   id: (id: number) => ({ GET: async (ctx) => { ... } })
 * };
 *
 * const stringRoute: EndpointRoute = {
 *   __idType: 'string',
 *   __index: { GET: async (ctx) => { ... } },
 *   id: (id: string) => ({ GET: async (ctx) => { ... } })
 * };
 * ```
 */
export type EndpointRoute = RegistryEntry<'number'> | RegistryEntry<'string'>;

/**
 * A registry mapping route types to their corresponding endpoint routes.
 *
 * @remarks
 * This type defines a flexible registry structure where each key represents
 * a route type identifier (string) and maps to an `EndpointRoute` configuration.
 * It allows dynamic registration and lookup of API endpoint routes.
 *
 * @example
 * ```typescript
 * const routes: RouteRegistry = {
 *   'user': userEndpointRoute,
 *   'posts': postsEndpointRoute
 * };
 * ```
 */
export type RouteRegistry = {
	[type: string]: EndpointRoute;
};

/**
 * A function type that defines a sub-page router for REST API endpoints.
 *
 * @param id - The unique identifier for the route or resource
 * @param params - Optional record of string key-value pairs representing route parameters
 * @returns A partial record mapping HTTP methods (or 'ALL' for all methods) to their corresponding API route handlers
 *
 * @example
 * ```typescript
 * const myRouter: SubPageRouter = (id, params) => ({
 *   GET: async (context) => { ... },
 *   POST: async (context) => { ... }
 * });
 * ```
 */
export type SubPageRouter = (
	id: string,
	params?: Record<string, string>
) => Partial<Record<HTTPMethod | 'ALL', APIRoute>>;

/**
 * A record type mapping sub-path strings to their corresponding sub-page router functions.
 *
 * @remarks
 * This type defines a structure for associating specific sub-paths with their
 * respective router functions, enabling modular handling of REST API endpoints.
 *
 * @example
 * ```typescript
 * const subRouters: SubPathRouter = {
 *   'history': (id) => ({ GET: async (ctx) => { ... } }),
 *   'comments': (id) => ({ POST: async (ctx) => { ... } })
 * };
 * ```
 */
export type SubPathRouter = Record<string, SubPageRouter>;

const firstLetterUppercase = (str: string) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

function isNumber(value: unknown): value is number {
	return typeof value === 'number' && !Number.isNaN(value);
}

function isString(value: unknown): value is string {
	return typeof value === 'string';
}

/**
 * A router function that handles both root paths and sub-paths for REST API endpoints.
 *
 * @param id - The unique identifier for the route or resource, which may include sub-paths
 * @param rootRoute - A function that generates the root route handlers based on the provided ID
 * @param subPathRouter - A record mapping sub-path strings to their corresponding sub-page router functions
 * @returns A partial record mapping HTTP methods (or 'ALL' for all methods) to their corresponding API route handlers
 *
 * @example
 * ```typescript
 * const router = idOrPathRouter(
 *   '123/history/456',
 *   (id) => ({ GET: async (ctx) => { ... } }),
 *   {
 *     'history': (id) => ({ GET: async (ctx) => { ... } }),
 *     'history/[diffid]': (id, params) => ({ GET: async (ctx) => { ... } })
 *   }
 * );
 * ```
 */
export function idOrPathRouter(
	id: string,
	rootRoute: (id: string) => Partial<Record<HTTPMethod | 'ALL', APIRoute>>,
	subPathRouter: SubPathRouter
): Partial<Record<HTTPMethod | 'ALL', APIRoute>> {
	// Handle root path
	if (!id.includes('/')) {
		return rootRoute(id);
	}

	// Handle sub-paths
	const parts = id.split('/'); // /[id]/subpath/...

	// parse id and subpath
	const pageId = parts[0];
	const subPath = parts.slice(1).join('/');

	// Find sub-router (e.g., /[id]/history)
	const subRouter = subPathRouter[subPath];
	if (subRouter) {
		const router = subRouter(pageId);
		return router;
	}

	// if no sub-router found, look for sub-paths with parameters (e.g., /[id]/history/[diffid])
	for (const key in subPathRouter) {
		if (key.includes('[') && key.includes(']')) {
			// create a regex to match the pattern
			const pattern = key.replace(/\[([^\]]+)\]/g, '([^/]+)');
			const regex = new RegExp(`^${pattern}$`);
			const match = subPath.match(regex);
			if (match) {
				const params: Record<string, string> = {};
				const paramNames = Array.from(key.matchAll(/\[([^\]]+)\]/g)).map((m) => m[1]);
				paramNames.forEach((name, index) => {
					params[name] = match[index + 1];
				});
				const router = subPathRouter[key](pageId, params);
				return router;
			}
		}
	}

	// If no matching sub-router found, return an empty router
	return {};
}

/**
 * Creates a REST router that handles HTTP requests based on route type and optional ID parameters.
 *
 * @template Literals - A non-empty readonly array of literal values representing valid route types
 *
 * @param prefix - A prefix string used for logging purposes to identify the route group
 * @param types - A Schema.Literal containing the valid type literals that can be used in the routes
 * @param registry - A RouteRegistry object mapping route types to their handler configurations
 *
 * @returns An Effect API route handler that:
 * - Extracts and validates `type` and `id` parameters from the request
 * - Determines the appropriate handler based on the route type and ID
 * - Supports both numeric and string ID types based on the route configuration
 * - Handles special `__index` routes when no ID is provided
 * - Dispatches requests to the appropriate HTTP method handler (GET, POST, etc.) or ALL handler
 * - Returns appropriate error responses for invalid IDs or missing handlers
 * - Logs errors and returns 500 status for handler execution failures
 *
 * @example
 * ```typescript
 * const router = createRestRouter(
 *   'api',
 *   Schema.Literal('users', 'posts'),
 *   routeRegistry
 * );
 * ```
 */
export const createRestRouter = <
	const Literals extends NonEmptyReadonlyArray<SchemaAST.LiteralValue>,
>(
	prefix: string,
	types: Schema.Literal<Literals>,
	registry: RouteRegistry
) => {
	const paramSchemaBase = Schema.Struct({
		type: types,
		id: Schema.optional(Schema.String),
	});

	const getTypeLabel = ({ actual }: ParseResult.ParseIssue) => {
		if (Schema.is(paramSchemaBase)(actual)) {
			return `Type: ${
				// biome-ignore lint/style/noNonNullAssertion: we know it's defined here
				firstLetterUppercase(actual.type!.toString())
			}`;
		}
	};

	const paramSchema = paramSchemaBase.annotations({
		identifier: 'TypeParams',
		parseIssueTitle: getTypeLabel,
	});

	return createEffectAPIRoute(
		extractParams(paramSchema)(({ type, id = '__index' }, ctx) =>
			genLogger(`${prefix}:${type}${id !== '__index' ? `:${id}` : ''}:${ctx.request.method}`)(
				function* () {
					const method = ctx.request.method.toUpperCase() as keyof Record<
						HTTPMethod | 'ALL',
						APIRoute
					>;
					const routeGroup = registry[type as string];

					let handlers: Partial<Record<HTTPMethod | 'ALL', APIRoute>> | undefined;

					switch (routeGroup.__idType) {
						case 'number': {
							if (id === '__index') {
								handlers = routeGroup.__index;
							} else {
								const numericId = Number(id);
								if (!isNumber(numericId)) {
									return createJsonResponse(
										{ error: `Invalid ID for type ${type}: ${id}` },
										{ status: 400 }
									);
								}
								handlers = routeGroup.id ? routeGroup.id(numericId) : undefined;
							}
							break;
						}
						case 'string': {
							if (id === '__index') {
								handlers = routeGroup.__index;
							} else {
								if (!isString(id)) {
									return createJsonResponse(
										{ error: `Invalid ID for type ${type}: ${id}` },
										{ status: 400 }
									);
								}
								handlers = routeGroup.id ? routeGroup.id(id) : undefined;
							}
							break;
						}
					}

					const handler = handlers ? handlers[method] || handlers.ALL : undefined;

					if (!handler) {
						return AllResponse();
					}

					const response = yield* Effect.tryPromise({
						try: async () => await handler(ctx),
						catch: (error) =>
							new Error(`Error in handler for ${type}/${id} [${method}]: ${String(error)}`),
					}).pipe(
						Effect.catchAll((error) =>
							Effect.logError(`API Route Error: ${String(error)}`).pipe(
								Effect.as(createJsonResponse({ error: 'Internal Server Error' }, { status: 500 }))
							)
						)
					);

					return response;
				}
			)
		)
	);
};
