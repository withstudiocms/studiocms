import * as HttpServerRequest from '@effect/platform/HttpServerRequest';
import * as allure from 'allure-js-commons';
import { Exit } from 'effect';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { describe, expect, test } from 'vitest';
import {
	processUrl,
	ResponseToHttpServerResponse,
	ServerRequestToRequest,
	tryWebHandler,
	WebHandlerError,
	webHandlerToEffectHttpHandler,
} from '../src/webHandler';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Web Handler Tests';

// Mock HttpServerRequest implementation
const createMockRequest = (
	url: string,
	method = 'GET',
	headers: Record<string, string> = {},
	body?: ArrayBuffer
): HttpServerRequest.HttpServerRequest =>
	({
		url,
		method,
		headers,
		originalUrl: 'http://localhost:3000',
		arrayBuffer: body ? Effect.succeed(body) : Effect.succeed(new ArrayBuffer(0)),
	}) as unknown as HttpServerRequest.HttpServerRequest;

describe(parentSuiteName, () => {
	test('webHandlerError - should create a tagged error with request context', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('WebHandlerError');
		await allure.tags(...sharedTags);

		await allure.step('should create a tagged error with request context', async (ctx) => {
			const mockRequest = createMockRequest('/test');
			const error = new WebHandlerError({
				request: mockRequest,
				description: 'Test error',
				cause: new Error('Original error'),
			});

			expect(error._tag).toBe('effectify/webHandler.WebHandlerError');
			expect(error.request).toBe(mockRequest);
			expect(error.description).toBe('Test error');

			await ctx.parameter('error', String(error));
		});
	});

	[
		{
			name: 'should process URL with default protocol and host',
			headers: new Headers(),
			request: createMockRequest('/api/test'),
			expected: 'http://localhost:3000/api/test',
		},
		{
			name: 'should use x-forwarded-proto header when present',
			headers: new Headers({ 'x-forwarded-proto': 'https' }),
			request: createMockRequest('/api/test'),
			expected: 'https://localhost:3000/api/test',
		},
		{
			name: 'should use host header when present',
			headers: new Headers({ host: 'example.com' }),
			request: createMockRequest('/api/test'),
			expected: 'http://example.com/api/test',
		},
		{
			name: 'should handle URLs without leading slash',
			headers: new Headers(),
			request: createMockRequest('api/test'),
			expected: 'http://localhost:3000/api/test',
		},
	].forEach(({ name, headers, request, expected }) => {
		test(`processUrl - ${name}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('processUrl');
			await allure.tags(...sharedTags);

			await allure.step(name, async (ctx) => {
				const result = await Effect.runPromise(processUrl(headers, request));
				expect(result).toBe(expected);
				await ctx.parameter('result', result);
			});
		});
	});

	[
		{
			name: 'should convert GET request without body',
			request: createMockRequest('/test', 'GET', {
				'content-type': 'application/json',
			}),

			validate: (result: Request) => {
				expect(result).toBeInstanceOf(Request);
				expect(result.method).toBe('GET');
				expect(result.headers.get('content-type')).toBe('application/json');
			},
		},
		{
			name: 'should convert POST request with body',
			request: createMockRequest(
				'/test',
				'POST',
				{ 'content-type': 'application/json' },
				new TextEncoder().encode('{"test": "data"}').buffer
			),

			validate: async (result: Request) => {
				expect(result.method).toBe('POST');
				const body = await result.text();
				expect(body).toBe('{"test": "data"}');
			},
		},
		{
			name: 'should handle empty body for POST request',
			request: createMockRequest('/test', 'POST', {}, new ArrayBuffer(0)),

			validate: (result: Request) => {
				expect(result.method).toBe('POST');
			},
		},
		{
			name: 'should not include body for HEAD request',
			request: createMockRequest('/test', 'HEAD'),

			validate: (result: Request) => {
				expect(result.method).toBe('HEAD');
				expect(result.body).toBeNull();
			},
		},
	].forEach(({ name, request, validate }) => {
		test(`ServerRequestToRequest - ${name}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('ServerRequestToRequest');
			await allure.tags(...sharedTags);

			await allure.step(name, async (ctx) => {
				const result = await Effect.runPromise(ServerRequestToRequest(request));
				validate(result);
				await ctx.parameter('result', String(result));
			});
		});
	});

	[
		{
			name: 'should convert Response with body',
			response: new Response('test body', {
				status: 200,
				headers: { 'content-type': 'text/plain' },
			}),
		},
		{
			name: 'should convert Response without body',
			response: new Response(null, {
				status: 204,
			}),
		},
		{
			name: 'should preserve response headers',
			response: new Response('test', {
				status: 200,
				headers: {
					'content-type': 'application/json',
					'x-custom-header': 'custom-value',
				},
			}),
		},
	].forEach(({ name, response }) => {
		test(`ResponseToHttpServerResponse - ${name}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('ResponseToHttpServerResponse');
			await allure.tags(...sharedTags);

			await allure.step(name, async (ctx) => {
				const result = await Effect.runPromise(ResponseToHttpServerResponse(response));
				expect(result).toBeDefined();
				await ctx.parameter('result', String(result));
			});
		});
	});

	[
		{
			name: 'should successfully process handler',
			handler: async (_request: Request) => new Response('success', { status: 200 }),
			validate: async (result: Exit.Exit<Response, WebHandlerError>) => {
				expect(result).toStrictEqual(
					Exit.succeed(expect.objectContaining({ status: 200, body: expect.anything() }))
				);
			},
		},
		{
			name: 'should catch handler errors and wrap them',
			handler: async (_request: Request) => {
				throw new Error('Handler failed');
			},
			validate: async (result: Exit.Exit<Response, WebHandlerError>) => {
				expect(result).toStrictEqual(
					Exit.fail(expect.objectContaining({ _tag: 'effectify/webHandler.WebHandlerError' }))
				);
			},
		},
	].forEach(({ name, handler, validate }) => {
		test(`tryWebHandler - ${name}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('tryWebHandler');
			await allure.tags(...sharedTags);

			const mockRequest = createMockRequest('/test');
			const result = await Effect.runPromiseExit(tryWebHandler(handler, mockRequest));
			await validate(result);
		});
	});

	test('webHandlerToEffectHttpHandler - should convert web handler to Effect handler', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('webHandlerToEffectHttpHandler');
		await allure.tags(...sharedTags);

		const handler = async (request: Request) =>
			new Response(JSON.stringify({ url: request.url }), {
				status: 200,
				headers: { 'content-type': 'application/json' },
			});

		const mockRequest = createMockRequest('/test');
		const requestLayer = Layer.succeed(HttpServerRequest.HttpServerRequest, mockRequest);

		await allure.step('should convert web handler to Effect handler', async (ctx) => {
			const effect = webHandlerToEffectHttpHandler(handler);
			const result = await Effect.runPromise(Effect.provide(effect, requestLayer));

			expect(result).toBeDefined();
			await ctx.parameter('result', String(result));
		});
	});
});
