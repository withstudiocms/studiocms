import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	createEffectAPIRoute,
	createEffectAPIRoutes,
	defineAPIRoute,
	EffectAPIRouteBuilder,
	withEffectAPI,
} from '../../dist/astro/api-route.js';
import { Effect } from '../../dist/effect.js';

describe('Api-Route Tests', () => {
	describe('defineAPIRoute tests (deprecated Utility)', () => {
		it('should call fn with context and return the response from runEffect', async () => {
			const mockContext = {};
			const mockResponse = new Response('ok', { status: 200 });

			let calledWith;
			const fn = (ctx) => {
				calledWith = ctx;
				return Effect.succeed(mockResponse);
			};
			const handler = defineAPIRoute(mockContext);

			const result = await handler(fn);

			assert.strictEqual(calledWith, mockContext);
			assert.strictEqual(result, mockResponse);
		});

		it('should propagate errors from runEffect', async () => {
			const mockContext = {};
			const error = new Error('fail');

			const fn = () => Effect.fail(error);
			const handler = defineAPIRoute(mockContext);

			await assert.rejects(() => handler(fn), { message: 'fail' });
		});
	});

	describe('createEffectAPIRoute tests', () => {
		it('should call the handler with the context and return its response', async () => {
			const mockContext = { request: new Request('http://localhost') };
			const mockResponse = new Response('ok', { status: 200 });

			let handlerCalledWith = null;
			const handler = (ctx) => {
				handlerCalledWith = ctx;
				return Effect.succeed(mockResponse);
			};

			const route = createEffectAPIRoute(handler);

			const result = await route(mockContext);

			assert.strictEqual(handlerCalledWith, mockContext);
			assert.strictEqual(result, mockResponse);
		});

		it('should propagate errors thrown by the handler', async () => {
			const mockContext = { request: new Request('http://localhost') };
			const error = new Error('fail');
			const handler = () => { return Effect.fail(error) };

			const route = createEffectAPIRoute(handler);

			await assert.rejects(() => route(mockContext), { message: 'fail' });
		});
	});

	describe('withEffectAPI tests', () => {
		it('should create an API route with the provided handler', async () => {
			const mockContext = { request: new Request('http://localhost') };
			const mockResponse = new Response('ok', { status: 200 });

			let handlerCalledWith = null;
			const handler = (ctx) => {
				handlerCalledWith = ctx;
				return Effect.succeed(mockResponse);
			};

			const route = withEffectAPI(handler);

			const result = await route(mockContext);

			assert.strictEqual(handlerCalledWith, mockContext);
			assert.strictEqual(result, mockResponse);
		});

		it('should propagate errors from the handler', async () => {
			const mockContext = { request: new Request('http://localhost') };
			const error = new Error('fail');
			const handler = () => Effect.fail(error);

			const route = withEffectAPI(handler);
			const result = await route(mockContext);
			const resultData = await result.json();

			assert.strictEqual(result.status, 500);
			assert.deepEqual(resultData, { error: 'fail' });
		});

		it('should apply CORS headers if configured', async () => {
			const mockContext = { request: new Request('https://example.com', { headers: { Origin: 'https://example.com' } }) };
			const handler = () => Effect.succeed(new Response(JSON.stringify({ message: 'ok' }), { status: 200 }));

			const route = withEffectAPI(handler, {
				cors: {
					origin: ['https://example.com'],
				},
			});

			const result = await route(mockContext);

			assert.strictEqual(result.headers.get('Access-Control-Allow-Origin'), 'https://example.com');
		});

		it('should handle preflight requests with CORS', async () => {
			const mockContext = { request: new Request('https://example.com', { method: 'OPTIONS', headers: { Origin: 'https://example.com' } }) };
			const handler = () => Effect.succeed(new Response(null, { status: 204 }));

			const route = withEffectAPI(handler, {
				cors: {
					origin: ['https://example.com'],
					methods: ['GET', 'POST', 'OPTIONS'],
				},
			});

			const result = await route(mockContext);

			assert.strictEqual(result.status, 204);
			assert.strictEqual(result.headers.get('Access-Control-Allow-Origin'), 'https://example.com');
			assert.strictEqual(result.headers.get('Access-Control-Allow-Methods'), 'GET, POST, OPTIONS');
		});

		it('should handle preflight requests without CORS', async () => {
			const mockContext = { request: new Request('https://example.com', { method: 'OPTIONS' }) };
			const handler = () => Effect.succeed(new Response(null, { status: 204 }));

			const route = withEffectAPI(handler);

			const result = await route(mockContext);

			assert.strictEqual(result.status, 204);
			assert.strictEqual(result.headers.get('Access-Control-Allow-Origin'), '*');
		});

		it('should apply success middleware if provided', async () => {
			const mockContext = { request: new Request('http://localhost') };
			const mockResponse = new Response('ok', { status: 200 });

			let handlerCalledWith = null;
			const handler = (ctx) => {
				handlerCalledWith = ctx;
				return Effect.succeed(mockResponse);
			};

			const onSuccess = (response, ctx) => {
				assert.strictEqual(ctx, mockContext);
				return new Response(response.body, { status: response.status, headers: { 'X-Custom-Header': 'value' } });
			};

			const route = withEffectAPI(handler, { onSuccess });

			const result = await route(mockContext);

			assert.strictEqual(handlerCalledWith, mockContext);
			assert.strictEqual(result.headers.get('X-Custom-Header'), 'value');
			assert.strictEqual(result.status, 200);
		});

		it('should apply error middleware if provided', async () => {
			const mockContext = { request: new Request('http://localhost') };
			const error = new Error('fail');

			const handler = () => Effect.fail(error);

			const onError = (err, ctx) => {
				assert.strictEqual(ctx, mockContext);
				return new Response(JSON.stringify({ error: err.message }), { status: 500 });
			};

			const route = withEffectAPI(handler, { onError });

			const result = await route(mockContext);
			const resultData = await result.json();

			assert.strictEqual(result.status, 500);
			assert.deepEqual(resultData, { error: 'fail' });
		});

		it('should handle multiple CORS origins', async () => {
			const mockContext = { request: new Request('https://example.com', { headers: { Origin: 'https://example.com' } }) };
			const handler = () => Effect.succeed(new Response(JSON.stringify({ message: 'ok' }), { status: 200 }));

			const route = withEffectAPI(handler, {
				cors: {
					origin: ['https://example.com', 'https://another-domain.com'],
				},
			});

			const result = await route(mockContext);

			assert.strictEqual(result.headers.get('Access-Control-Allow-Origin'), 'https://example.com');
		});
	});

	describe('createEffectAPIRoutes tests', () => {
		it('should create multiple API routes with the provided handlers', async () => {
			const mockContext = { request: new Request('http://localhost') };
			const mockResponse1 = new Response('ok1', { status: 200 });
			const mockResponse2 = new Response('ok2', { status: 200 });

			let handlerCalledWith1 = null;
			let handlerCalledWith2 = null;

			const handler1 = (ctx) => {
				handlerCalledWith1 = ctx;
				return Effect.succeed(mockResponse1);
			};

			const handler2 = (ctx) => {
				handlerCalledWith2 = ctx;
				return Effect.succeed(mockResponse2);
			};

			const routes = createEffectAPIRoutes({
				GET: handler1,
				POST: handler2,
			});

			const result1 = await routes.GET(mockContext);
			const result2 = await routes.POST(mockContext);

			assert.strictEqual(handlerCalledWith1, mockContext);
			assert.strictEqual(result1, mockResponse1);

			assert.strictEqual(handlerCalledWith2, mockContext);
			assert.strictEqual(result2, mockResponse2);
		});
	});

	describe('EffectAPIRouteBuilder tests', () => {
		it('should build an API route with the provided handler', async () => {
			const mockContext = { request: new Request('http://localhost') };
			const mockResponse = new Response('ok', { status: 200 });

			let handlerCalledWith = null;
			const handler = (ctx) => {
				handlerCalledWith = ctx;
				return Effect.succeed(mockResponse);
			};

			const { GET, POST } =
				new EffectAPIRouteBuilder()
					.get(handler)
					.post(handler)
					.build();

			const [postResult, getResult] = await Promise.all([
				POST(mockContext),
				GET(mockContext),
			]);

			assert.strictEqual(handlerCalledWith, mockContext);
			assert.strictEqual(postResult, mockResponse);
			assert.strictEqual(getResult, mockResponse);
		});
	});
});
