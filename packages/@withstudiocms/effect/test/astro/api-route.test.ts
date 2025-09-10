/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */
import type { APIContext } from 'astro';
import { describe, expect, it } from 'vitest';
import {
	createEffectAPIRoute,
	createEffectAPIRoutes,
	defineAPIRoute,
	EffectAPIRouteBuilder,
	withEffectAPI,
} from '../../src/astro/api-route.js';
import { Effect } from '../../src/effect.js';

describe('Api-Route Tests', () => {
	describe('defineAPIRoute tests (deprecated Utility)', () => {
		it('should call fn with context and return the response from runEffect', async () => {
			const mockContext = {};
			const mockResponse = new Response('ok', { status: 200 });

			let calledWith: any;
			const fn = (ctx: any) => {
				calledWith = ctx;
				return Effect.succeed(mockResponse);
			};
			// @ts-expect-error - Testing mocked context
			const handler = defineAPIRoute(mockContext);

			const result = await handler(fn);

			expect(calledWith).toBe(mockContext);
			expect(result).toBe(mockResponse);
		});

		it('should propagate errors from runEffect', async () => {
			const mockContext = {};
			const error = new Error('fail');

			const fn = () => Effect.fail(error);
			// @ts-expect-error - Testing mocked context
			const handler = defineAPIRoute(mockContext);

			await expect(handler(fn)).rejects.toThrow('fail');
		});
	});

	describe('createEffectAPIRoute tests', () => {
		it('should call the handler with the context and return its response', async () => {
			const mockContext = { request: new Request('http://localhost') };
			const mockResponse = new Response('ok', { status: 200 });

			let handlerCalledWith: any = null;
			const handler = (ctx: any) => {
				handlerCalledWith = ctx;
				return Effect.succeed(mockResponse);
			};

			const route = createEffectAPIRoute(handler);

			// @ts-expect-error - Testing mocked context
			const result = await route(mockContext);

			expect(handlerCalledWith).toBe(mockContext);
			expect(result).toBe(mockResponse);
		});

		it('should propagate errors thrown by the handler', async () => {
			const mockContext = { request: new Request('http://localhost') };
			const error = new Error('fail');
			const handler = () => {
				return Effect.fail(error);
			};

			const route = createEffectAPIRoute(handler);

			// @ts-expect-error - Testing mocked context
			await expect(route(mockContext)).rejects.toThrow('fail');
		});
	});

	describe('withEffectAPI tests', () => {
		it('should create an API route with the provided handler', async () => {
			const mockContext = { request: new Request('http://localhost') };
			const mockResponse = new Response('ok', { status: 200 });

			let handlerCalledWith: any = null;
			const handler = (ctx: any) => {
				handlerCalledWith = ctx;
				return Effect.succeed(mockResponse);
			};

			const route = withEffectAPI(handler);

			// @ts-expect-error - Testing mocked context
			const result = await route(mockContext);

			expect(handlerCalledWith).toBe(mockContext);
			expect(result).toBe(mockResponse);
		});

		it('should propagate errors from the handler', async () => {
			const mockContext = { request: new Request('http://localhost') };
			const error = new Error('fail');
			const handler = () => Effect.fail(error);

			const route = withEffectAPI(handler);
			// @ts-expect-error - Testing mocked context
			const result = await route(mockContext);
			const resultData = await result.json();

			expect(result.status).toBe(500);
			expect(resultData).toEqual({ error: 'fail' });
		});

		it('should apply CORS headers if configured', async () => {
			const mockContext = {
				request: new Request('https://example.com', { headers: { Origin: 'https://example.com' } }),
			};
			const handler = () =>
				Effect.succeed(new Response(JSON.stringify({ message: 'ok' }), { status: 200 }));

			const route = withEffectAPI(handler, {
				cors: {
					origin: ['https://example.com'],
				},
			});

			// @ts-expect-error - Testing mocked context
			const result = await route(mockContext);

			expect(result.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
		});

		it('should handle preflight requests with CORS', async () => {
			const mockContext = {
				request: new Request('https://example.com', {
					method: 'OPTIONS',
					headers: { Origin: 'https://example.com' },
				}),
			};
			const handler = () => Effect.succeed(new Response(null, { status: 204 }));

			const route = withEffectAPI(handler, {
				cors: {
					origin: ['https://example.com'],
					methods: ['GET', 'POST', 'OPTIONS'],
				},
			});

			// @ts-expect-error - Testing mocked context
			const result = await route(mockContext);

			expect(result.status).toBe(204);
			expect(result.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
			expect(result.headers.get('Access-Control-Allow-Methods')).toBe('OPTIONS, GET, POST');
		});

		it('should handle preflight requests without CORS', async () => {
			const mockContext = { request: new Request('https://example.com', { method: 'OPTIONS' }) };
			const handler = () => Effect.succeed(new Response(null, { status: 204 }));

			const route = withEffectAPI(handler);

			// @ts-expect-error - Testing mocked context
			const result = await route(mockContext);

			expect(result.status).toBe(204);
			expect(result.headers.get('Access-Control-Allow-Origin')).toBe('*');
		});

		it('should apply success middleware if provided', async () => {
			const mockContext = { request: new Request('http://localhost') };
			const mockResponse = new Response('ok', { status: 200 });

			let handlerCalledWith: any = null;
			const handler = (ctx: any) => {
				handlerCalledWith = ctx;
				return Effect.succeed(mockResponse);
			};

			const onSuccess = (response: Response, ctx: any) => {
				expect(ctx).toBe(mockContext);
				return new Response(response.body, {
					status: response.status,
					headers: { 'X-Custom-Header': 'value' },
				});
			};

			const route = withEffectAPI(handler, { onSuccess });

			// @ts-expect-error - Testing mocked context
			const result = await route(mockContext);

			expect(handlerCalledWith).toBe(mockContext);
			expect(result.headers.get('X-Custom-Header')).toBe('value');
			expect(result.status).toBe(200);
		});

		it('should apply error middleware if provided', async () => {
			const mockContext = { request: new Request('http://localhost') };
			const error = new Error('fail');

			const handler = () => Effect.fail(error);

			const onError = (err: unknown, ctx: APIContext) => {
				expect(ctx).toBe(mockContext);
				return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
			};

			const route = withEffectAPI(handler, { onError });

			// @ts-expect-error - Testing mocked context
			const result = await route(mockContext);
			const resultData = await result.json();

			expect(result.status).toBe(500);
			expect(resultData).toEqual({ error: 'fail' });
		});

		it('should handle multiple CORS origins', async () => {
			const mockContext = {
				request: new Request('https://example.com', { headers: { Origin: 'https://example.com' } }),
			};
			const handler = () =>
				Effect.succeed(new Response(JSON.stringify({ message: 'ok' }), { status: 200 }));

			const route = withEffectAPI(handler, {
				cors: {
					origin: ['https://example.com', 'https://another-domain.com'],
				},
			});

			// @ts-expect-error - Testing mocked context
			const result = await route(mockContext);

			expect(result.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
		});
	});

	describe('createEffectAPIRoutes tests', () => {
		it('should create multiple API routes with the provided handlers', async () => {
			const mockContext = { request: new Request('http://localhost') };
			const mockResponse1 = new Response('ok1', { status: 200 });
			const mockResponse2 = new Response('ok2', { status: 200 });

			let handlerCalledWith1: any = null;
			let handlerCalledWith2: any = null;

			const handler1 = (ctx: any) => {
				handlerCalledWith1 = ctx;
				return Effect.succeed(mockResponse1);
			};

			const handler2 = (ctx: any) => {
				handlerCalledWith2 = ctx;
				return Effect.succeed(mockResponse2);
			};

			const routes = createEffectAPIRoutes({
				GET: handler1,
				POST: handler2,
			});

			// @ts-expect-error - Testing mocked context
			const result1 = await routes.GET(mockContext);
			// @ts-expect-error - Testing mocked context
			const result2 = await routes.POST(mockContext);

			expect(handlerCalledWith1).toBe(mockContext);
			expect(result1).toBe(mockResponse1);

			expect(handlerCalledWith2).toBe(mockContext);
			expect(result2).toBe(mockResponse2);
		});
	});

	describe('EffectAPIRouteBuilder tests', () => {
		it('should build an API route with the provided handler', async () => {
			const mockContext = { request: new Request('http://localhost') };
			const mockResponse = new Response('ok', { status: 200 });

			let handlerCalledWith: any = null;
			const handler = (ctx: any) => {
				handlerCalledWith = ctx;
				return Effect.succeed(mockResponse);
			};

			const { GET, POST } = new EffectAPIRouteBuilder().get(handler).post(handler).build();

			// @ts-expect-error - Testing mocked context
			const [postResult, getResult] = await Promise.all([POST(mockContext), GET(mockContext)]);

			expect(handlerCalledWith).toBe(mockContext);
			expect(postResult).toBe(mockResponse);
			expect(getResult).toBe(mockResponse);
		});
	});
});
