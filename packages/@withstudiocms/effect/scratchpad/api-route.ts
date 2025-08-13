/*

	Example usage of the enhanced API route utilities with precise typing and comprehensive options.

*/

import {
	createEffectAPIRoutes,
	Effect,
	EffectAPIRouteBuilder,
	withEffectAPI,
} from '../src/index.js';

// Example 1: Enhanced withEffect with comprehensive options
export const GET1 = withEffectAPI(
	(_context) => Effect.succeed(new Response(JSON.stringify({ message: 'Hello!' }))),
	{
		cors: {
			origin: ['https://myapp.com', 'http://localhost:3000'],
			methods: ['GET', 'POST'],
			credentials: true,
		},
		timeout: 5000,
		validate: {
			query: (searchParams) => searchParams.has('id'),
			params: (params) => Boolean(params.id && !Number.isNaN(Number(params.id))),
		},
		onBeforeEffect: async (context) => {
			// Add custom properties to context
			return { ...context, timestamp: Date.now() };
		},
		onSuccess: (response, _context) => {
			response.headers.set('X-Request-ID', crypto.randomUUID());
			return response;
		},
		onError: (error, _context) => {
			console.error('API Error:', error);
			return new Response(JSON.stringify({ error: 'Something went wrong' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		},
	}
);

// Example 2: Enhanced createEffectAPIRoutes with precise typing - no undefined in union types!
const routes2 = createEffectAPIRoutes(
	{
		GET: (_context) => Effect.succeed(new Response('GET response')),
		POST: ({ request }) =>
			Effect.gen(function* (_) {
				const body = yield* _(Effect.tryPromise(() => request.json()));
				return new Response(JSON.stringify({ received: body }));
			}),
		DELETE: (_context) => Effect.succeed(new Response('Deleted', { status: 204 })),
	},
	{
		// Global configuration applied to all routes
		cors: { origin: true, credentials: true },
		timeout: 10000,
		onError: (_error) => new Response('Global error handler', { status: 500 }),

		// Method-specific overrides
		methods: {
			POST: {
				validate: {
					body: (body) => body && typeof body.name === 'string',
				},
				timeout: 30000, // Longer timeout for POST
			},
			DELETE: {
				validate: {
					params: (params) => Boolean(params.id && !Number.isNaN(Number(params.id))),
				},
			},
		},
	}
);

// TypeScript now knows: routes2.GET, routes2.POST, routes2.DELETE are all APIRoute (no undefined!)
// routes2.PUT would cause a TypeScript error - property doesn't exist
export const { GET: GET2, POST: POST2, DELETE: DELETE2 } = routes2;

// Example 3: Using the fluent EffectRouteBuilder with precise typing
const routes3 = new EffectAPIRouteBuilder()
	.withGlobalConfig({
		cors: { origin: true },
		timeout: 5000,
		onError: (_error) => new Response('Error', { status: 500 }),
	})
	.get(
		(_context) => Effect.succeed(new Response('GET')),
		{ timeout: 3000 } // Override global timeout for GET
	)
	.post(
		({ request }) =>
			Effect.gen(function* (_) {
				const body = yield* _(Effect.tryPromise(() => request.json()));
				return new Response(JSON.stringify(body));
			}),
		{
			validate: {
				body: (body) => body && typeof body === 'object',
			},
		}
	)
	.delete((_context) => Effect.succeed(new Response('', { status: 204 })), {
		validate: {
			params: (params) => !!params.id,
		},
	})
	.build();

// TypeScript knows exactly which methods exist: { GET: APIRoute, POST: APIRoute, DELETE: APIRoute }
export const { GET: GET3, POST: POST3, DELETE: DELETE3 } = routes3;

// Example 4: Complex real-world usage with precise typing
const getUserById = (userId?: string) => {
	// Simulate fetching user from a database
	return Effect.succeed({ id: userId, name: 'John Doe' });
};

// biome-ignore lint/suspicious/noExplicitAny: this is for demonstration purposes only
const updateUser = (userId?: string, updates?: Record<string, any>) => {
	// Simulate updating user in a database
	return Effect.succeed({ id: userId, ...updates });
};

const deleteUser = (userId?: string) => {
	// Simulate deleting user from a database
	return Effect.succeed({ id: userId });
};

const userRoutes = createEffectAPIRoutes(
	{
		GET: ({ params }) =>
			Effect.gen(function* (_) {
				const userId = params.id;
				const user = yield* _(getUserById(userId));
				return new Response(JSON.stringify(user));
			}),

		PUT: ({ params, request }) =>
			Effect.gen(function* (_) {
				const userId = params.id;
				const updates = yield* _(Effect.tryPromise(() => request.json()));
				const updatedUser = yield* _(updateUser(userId, updates));
				return new Response(JSON.stringify(updatedUser));
			}),

		DELETE: ({ params }) =>
			Effect.gen(function* (_) {
				const userId = params.id;
				yield* _(deleteUser(userId));
				return new Response('', { status: 204 });
			}),
	},
	{
		cors: {
			origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
			methods: ['GET', 'PUT', 'DELETE'],
			credentials: true,
		},
		timeout: 10000,
		validate: {
			params: (params) => Boolean(params.id && !Number.isNaN(Number(params.id))),
		},
		onBeforeEffect: async (context) => {
			// Add authentication/logging
			const token = context.request.headers.get('Authorization');
			if (!token) {
				throw new Error('Unauthorized');
			}
			return context;
		},
		methods: {
			PUT: {
				validate: {
					body: (body) => body && typeof body === 'object' && Object.keys(body).length > 0,
				},
			},
		},
	}
);

// TypeScript knows exactly: { GET: APIRoute, PUT: APIRoute, DELETE: APIRoute } - no POST, no undefined!
export const { GET: GET4, PUT: PUT4, DELETE: DELETE4 } = userRoutes;
