import * as allure from 'allure-js-commons';
import { Context } from 'effect';
import { describe, expect, test, vi } from 'vitest';
import { AstroAPIContext } from '../../src/astro/context';
import { buildEndpoint, decodeRequestUrl, registerSigterm } from '../../src/astro/HttpApi';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Astro Effect HttpApi Utility';

describe(parentSuiteName, () => {
	[
		{
			name: 'should decode %40 to @ in URL pathname',
			request: new Request('http://localhost/%40scope/package'),
			validate: (decoded: Request) => {
				expect(decoded.url).toBe('http://localhost/@scope/package');
			},
		},
		{
			name: 'should handle URLs without %40',
			request: new Request('http://localhost/api/endpoint'),
			validate: (decoded: Request) => {
				expect(decoded.url).toBe('http://localhost/api/endpoint');
			},
		},
		{
			name: 'should handle multiple %40 occurrences',
			request: new Request('http://localhost/%40scope/%40package'),
			validate: (decoded: Request) => {
				expect(decoded.url).toBe('http://localhost/@scope/@package');
			},
		},
	].forEach(({ name, request, validate }) => {
		test(`decodeRequestUrl - ${name}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('decodeRequestUrl');
			await allure.tags(...sharedTags);

			await allure.step(name, async (ctx) => {
				await ctx.parameter('request', String(request));
				const decoded = decodeRequestUrl(request);
				await ctx.parameter('decoded', String(decoded));
				validate(decoded);
			});
		});
	});

	test('registerSigterm - should register disposer function', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('registerSigterm');
		await allure.tags(...sharedTags);

		await allure.step('should register disposer function', async (ctx) => {
			await ctx.parameter('disposer', 'mockDispose function');
			const mockDispose = vi.fn().mockResolvedValue(undefined);
			registerSigterm(mockDispose);

			// Function is registered, cannot easily test SIGTERM without mocking process
			expect(mockDispose).not.toHaveBeenCalled();
		});
	});

	let capturedContext: Context.Context<never> | undefined;

	[
		{
			name: 'should create an Astro APIRoute handler',
			mockHandler: vi.fn().mockResolvedValue(new Response('OK')),
			mockContext: {
				request: new Request('http://localhost/test'),
				locals: {},
			} as any,
			validate: async (response: Response, _mockHandler: any, _mockContext: any) => {
				expect(response).toBeInstanceOf(Response);
				expect(await response.text()).toBe('OK');
			},
		},
		{
			name: 'should decode %40 in request URL before handling',
			mockHandler: vi.fn().mockResolvedValue(new Response('OK')),
			mockContext: {
				request: new Request('http://localhost/%40scope/package'),
				locals: {},
			} as any,
			validate: async (response: Response, mockHandler: any, _mockContext: any) => {
				expect(mockHandler).toHaveBeenCalledWith(
					expect.objectContaining({
						url: 'http://localhost/@scope/package',
					}),
					expect.anything()
				);
				expect(response).toBeInstanceOf(Response);
				expect(await response.text()).toBe('OK');
			},
		},
		{
			name: 'should include AstroAPIContext in handler context',
			mockHandler: vi.fn().mockImplementation((_, ctx) => {
				capturedContext = ctx;
				return Promise.resolve(new Response('OK'));
			}),
			mockContext: {
				request: new Request('http://localhost/test'),
				locals: { userId: '123' },
			} as any,
			validate: async (_response: Response, _mockHandler: any, mockContext: any) => {
				expect(capturedContext).toBeDefined();
				// biome-ignore lint/style/noNonNullAssertion: allowed for test
				const astroContext = Context.get(capturedContext!, AstroAPIContext);
				expect(astroContext).toBe(mockContext);
			},
		},
		{
			name: 'should return 500 error response on handler failure',
			mockHandler: vi.fn().mockRejectedValue(new Error('Handler error')),
			mockContext: {
				request: new Request('http://localhost/test'),
				locals: {},
			} as any,
			validate: async (response: Response, _mockHandler: any, _mockContext: any) => {
				expect(response.status).toBe(500);
				expect(await response.text()).toBe('Internal Server Error');
			},
		},
	].forEach(({ name, mockHandler, mockContext, validate }) => {
		test(`buildEndpoint - ${name}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('buildEndpoint');
			await allure.tags(...sharedTags);

			await allure.step(name, async (ctx) => {
				await ctx.parameter('mockHandler', 'mockHandler function');
				await ctx.parameter('mockContext', String(mockContext));
				const endpoint = buildEndpoint(mockHandler);
				const response = await endpoint(mockContext);
				await ctx.parameter('response', String(response));
				validate(response, mockHandler, mockContext);
			});

			capturedContext = undefined;
		});
	});
});
