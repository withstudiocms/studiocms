import * as allure from 'allure-js-commons';
import type { APIContext, MiddlewareNext } from 'astro';
import { Effect, Schema } from 'effect';
import { describe, expect, test, vi } from 'vitest';
import {
	defineDataMiddleware,
	MiddlewareError,
	setDataContext,
} from '../../src/astro/data-middleware.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Data Middleware Tests';

describe(parentSuiteName, () => {
	[
		{
			name: 'should create a tagged error with message',
			opts: {
				message: 'Test error',
			},
			validate: (error: MiddlewareError) => {
				expect(error.message).toBe('Test error');
			},
		},
		{
			name: 'should create a tagged error with message and cause',
			opts: {
				message: 'Test error',
				cause: new Error('Root cause'),
			},
			validate: (error: MiddlewareError, cause: unknown) => {
				expect(error.message).toBe('Test error');
				expect(error.cause).toBe(cause);
			},
		},
	].forEach(({ name, opts, validate }) => {
		test(`MiddlewareError - ${name}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('MiddlewareError Tests');
			await allure.tags(...sharedTags);

			await allure.step(`Testing MiddlewareError: ${name}`, async () => {
				const error = new MiddlewareError(opts);
				validate(error, opts.cause);
			});
		});
	});

	[
		{
			name: 'should set header in response',
			buildMockResponse: () => {
				const headers = new Headers();
				return { headers };
			},
			key: 'x-test-header',
			value: 'test-value',
			validate: (response: { headers: Headers }, key: string, value: string) => {
				expect(response.headers.get(key)).toBe(value);
			},
		},
		{
			name: 'should overwrite existing header',
			buildMockResponse: () => {
				const headers = new Headers();
				headers.set('x-test-header', 'old-value');
				return { headers };
			},
			key: 'x-test-header',
			value: 'new-value',
			validate: (response: { headers: Headers }, key: string, value: string) => {
				expect(response.headers.get(key)).toBe(value);
			},
		},
	].forEach(({ name, buildMockResponse, key, value, validate }) => {
		test(`setDataContext - ${name}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('setDataContext Tests');
			await allure.tags(...sharedTags);

			await allure.step(`Testing setDataContext: ${name}`, async () => {
				const mockResponse = buildMockResponse();
				setDataContext({ response: mockResponse as any }, { key, value });
				validate(mockResponse, key, value);
			});
		});
	});

	const createMockContext = (): APIContext =>
		({
			request: new Request('http://localhost'),
			params: {},
			props: {},
			url: new URL('http://localhost'),
		}) as APIContext;

	const createMockNext = (headers: Record<string, string> = {}): MiddlewareNext => {
		return vi.fn(async () => {
			const response = new Response('OK', { status: 200 });
			Object.entries(headers).forEach(([key, value]) => {
				response.headers.set(key, value);
			});
			return response;
		});
	};

	[
		{
			name: 'should validate headers and call handler with valid data',
			schema: Schema.Struct({
				'x-test-header': Schema.String,
			}),
			headers: { 'x-test-header': 'test-value' },
			validate: (data: any) => {
				expect(data).toEqual({ 'x-test-header': 'test-value' });
			},
		},
		{
			name: 'should fail with MiddlewareError when schema validation fails',
			schema: Schema.Struct({
				'x-required-header': Schema.String,
			}),
			headers: { 'x-wrong-header': 'test-value' },
			validate: (error: MiddlewareError) => {
				expect(error).toBeInstanceOf(MiddlewareError);
				expect(error.message).toBe('Header validation failed');
			},
		},
		{
			name: 'should validate multiple headers',
			schema: Schema.Struct({
				'x-header-one': Schema.String,
				'x-header-two': Schema.NumberFromString,
			}),
			headers: {
				'x-header-one': 'value-one',
				'x-header-two': '42',
			},
			validate: (data: any) => {
				expect(data).toEqual({
					'x-header-one': 'value-one',
					'x-header-two': 42,
				});
			},
		},
		{
			name: 'should fail when one of multiple headers is invalid',
			schema: Schema.Struct({
				'x-header-one': Schema.String,
				'x-header-two': Schema.NumberFromString,
			}),
			headers: {
				'x-header-one': 'value-one',
				'x-header-two': 'not-a-number',
			},
			validate: (error: MiddlewareError) => {
				expect(error).toBeInstanceOf(MiddlewareError);
				expect(error.message).toBe('Header validation failed');
			},
		},
		{
			name: 'should handle optional headers correctly',
			schema: Schema.Struct({
				'x-optional-header': Schema.optional(Schema.String),
			}),
			headers: {},
			validate: (data: any) => {
				expect(data).toEqual({});
			},
		},
		{
			name: 'should validate when optional header is present',
			schema: Schema.Struct({
				'x-optional-header': Schema.optional(Schema.String),
			}),
			headers: { 'x-optional-header': 'optional-value' },
			validate: (data: any) => {
				expect(data).toEqual({ 'x-optional-header': 'optional-value' });
			},
		},
	].forEach(({ name, schema, headers, validate }) => {
		test(`defineDataMiddleware - ${name}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('defineDataMiddleware Validation Tests');
			await allure.tags(...sharedTags);

			await allure.step(`Testing defineDataMiddleware: ${name}`, async () => {
				const handler = vi.fn((_, data) => {
					validate(data);
					return Effect.succeed(new Response('Success', { status: 200 }));
				});
				const middleware = defineDataMiddleware(schema as any, handler);

				const context = createMockContext();
				const next = createMockNext(headers as any);

				const result = Effect.runPromiseExit(middleware(context, next));

				if (name.includes('fail')) {
					await expect(result).resolves.toMatchObject({
						_tag: 'Failure',
						cause: expect.objectContaining({
							error: expect.objectContaining({
								_tag: 'MiddlewareError',
								message: 'Header validation failed',
							}),
						}),
					});
				} else {
					const res = await Effect.runPromise(middleware(context, next));
					expect(res.status).toBe(200);
					expect(handler).toHaveBeenCalled();
				}
			});
		});
	});
});
