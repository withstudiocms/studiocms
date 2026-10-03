/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */

import * as allure from 'allure-js-commons';
import type { APIContext } from 'astro';
import { describe, expect, test } from 'vitest';
import {
	createEffectAPIRoute,
	createEffectAPIRoutes,
	defineAPIRoute,
	EffectAPIRouteBuilder,
	withEffectAPI,
} from '../../src/astro/api-route.js';
import { Effect } from '../../src/effect.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'API Route Helpers Tests';

describe(parentSuiteName, () => {
	test('API Route - defineAPIRoute (deprecated Utility)', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('defineAPIRoute Tests (Deprecated)');
		await allure.tags(...sharedTags, 'deprecated');

		await allure.step('Testing defineAPIRoute with successful Effect', async (ctx) => {
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

			await ctx.parameter('Expected Status', String(mockResponse.status));
			await ctx.parameter('Result Status', String(result.status));

			expect(calledWith).toBe(mockContext);
			expect(result).toBe(mockResponse);
		});

		await allure.step('Testing defineAPIRoute with failing Effect', async () => {
			const mockContext = {};
			const error = new Error('fail');

			const fn = () => Effect.fail(error);
			// @ts-expect-error - Testing mocked context
			const handler = defineAPIRoute(mockContext);

			await expect(handler(fn)).rejects.toThrow('fail');
		});
	});

	test('API Route - createEffectAPIRoute', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('createEffectAPIRoute Tests');
		await allure.tags(...sharedTags);

		await allure.step('Testing createEffectAPIRoute with successful Effect', async (ctx) => {
			const mockContext = { request: new Request('http://localhost') };
			const mockResponse = new Response('ok', { status: 200 });

			let calledWith: any = null;
			const handler = (ctx: any) => {
				calledWith = ctx;
				return Effect.succeed(mockResponse);
			};

			const route = createEffectAPIRoute(handler);

			// @ts-expect-error - Testing mocked context
			const result = await route(mockContext);

			await ctx.parameter('Expected Status', String(mockResponse.status));
			await ctx.parameter('Result Status', String(result.status));

			expect(calledWith).toBe(mockContext);
			expect(result).toBe(mockResponse);
		});

		await allure.step('Testing createEffectAPIRoute with failing Effect', async () => {
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

	test('API Route - withEffectAPI', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('withEffectAPI Tests');
		await allure.tags(...sharedTags);

		await allure.step('Testing withEffectAPI with successful Effect', async (ctx) => {
			const mockContext = { request: new Request('http://localhost') };
			const mockResponse = new Response('ok', { status: 200 });

			let calledWith: any = null;
			const handler = (ctx: any) => {
				calledWith = ctx;
				return Effect.succeed(mockResponse);
			};

			const route = withEffectAPI(handler);

			// @ts-expect-error - Testing mocked context
			const result = await route(mockContext);

			await ctx.parameter('Expected Status', String(mockResponse.status));
			await ctx.parameter('Result Status', String(result.status));

			expect(calledWith).toBe(mockContext);
			expect(result).toBe(mockResponse);
		});

		await allure.step('Testing withEffectAPI with failing Effect', async () => {
			const mockContext = { request: new Request('http://localhost') };
			const error = new Error('fail');
			const handler = () => {
				return Effect.fail(error);
			};

			const route = withEffectAPI(handler);

			// @ts-expect-error - Testing mocked context
			const result = await route(mockContext);
			const resultData = await result.json();

			await allure.step('Asserting error response', async (ctx) => {
				await ctx.parameter('Expected Status', '500');
				await ctx.parameter('Result Status', String(result.status));
				await ctx.parameter('Expected Error Message', 'fail');
				await ctx.parameter('Result Error Message', resultData.error);

				expect(result.status).toBe(500);
				expect(resultData).toEqual({ error: 'fail' });
			});
		});

		await allure.step(
			'Testing withEffectAPI should apply CORS headers if configured',
			async (ctx) => {
				const mockContext = {
					request: new Request('https://example.com', {
						headers: { Origin: 'https://example.com' },
					}),
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

				await ctx.parameter(
					'Access-Control-Allow-Origin',
					result.headers.get('Access-Control-Allow-Origin') || ''
				);

				expect(result.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
			}
		);

		await allure.step(
			'Testing withEffectAPI should handle preflight requests (with cors)',
			async (ctx) => {
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

				await ctx.parameter('Status', String(result.status));
				await ctx.parameter(
					'Access-Control-Allow-Origin',
					result.headers.get('Access-Control-Allow-Origin') || ''
				);
				await ctx.parameter(
					'Access-Control-Allow-Methods',
					result.headers.get('Access-Control-Allow-Methods') || ''
				);

				expect(result.status).toBe(204);
				expect(result.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
				expect(result.headers.get('Access-Control-Allow-Methods')).toBe('OPTIONS, GET, POST');
			}
		);

		await allure.step(
			'Testing withEffectAPI should handle preflight requests (without cors)',
			async (ctx) => {
				const mockContext = {
					request: new Request('https://example.com', {
						method: 'OPTIONS',
					}),
				};
				const handler = () => Effect.succeed(new Response(null, { status: 204 }));

				const route = withEffectAPI(handler);

				// @ts-expect-error - Testing mocked context
				const result = await route(mockContext);

				await ctx.parameter('Status', String(result.status));
				await ctx.parameter(
					'Access-Control-Allow-Origin',
					result.headers.get('Access-Control-Allow-Origin') || ''
				);

				expect(result.status).toBe(204);
				expect(result.headers.get('Access-Control-Allow-Origin')).toBe('*');
			}
		);

		await allure.step(
			'Testing withEffectAPI should apply success middleware if provided',
			async (ctx) => {
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

				await ctx.parameter('Custom Header', result.headers.get('X-Custom-Header') || '');

				expect(handlerCalledWith).toBe(mockContext);
				expect(result.headers.get('X-Custom-Header')).toBe('value');
				expect(result.status).toBe(200);
			}
		);

		await allure.step(
			'Testing withEffectAPI should apply error middleware if provided',
			async (ctx) => {
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

				await ctx.parameter('Status', String(result.status));
				await ctx.parameter('Error Message', resultData.error);

				expect(result.status).toBe(500);
				expect(resultData).toEqual({ error: 'fail' });
			}
		);

		await allure.step('Testing withEffectAPI should handle multiple CORS origins', async (ctx) => {
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

			await ctx.parameter(
				'Access-Control-Allow-Origin',
				result.headers.get('Access-Control-Allow-Origin') || ''
			);

			expect(result.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
		});
	});

	test('API Route - createEffectAPIRoutes', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('createEffectAPIRoutes Tests');
		await allure.tags(...sharedTags);

		await allure.step('Testing createEffectAPIRoutes with multiple handlers', async () => {
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

	test('API Route - EffectAPIRouteBuilder', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('EffectAPIRouteBuilder Tests');
		await allure.tags(...sharedTags);

		await allure.step('Testing EffectAPIRouteBuilder builds routes correctly', async () => {
			const mockContext = { request: new Request('http://localhost') };
			const mockResponse = new Response('ok', { status: 200 });

			let handlerCalledWith: any = null;
			const handler = (ctx: any) => {
				handlerCalledWith = ctx;
				return Effect.succeed(mockResponse);
			};

			const { GET, POST } = new EffectAPIRouteBuilder().get(handler).post(handler).build();

			// @ts-expect-error - Testing mocked context
			const getResult = await GET(mockContext);
			// @ts-expect-error - Testing mocked context
			const postResult = await POST(mockContext);

			expect(handlerCalledWith).toBe(mockContext);
			expect(getResult).toBe(mockResponse);
			expect(postResult).toBe(mockResponse);
		});
	});
});
