/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */
import * as allure from 'allure-js-commons';
import { AstroError } from 'astro/errors';
import { describe, expect, test } from 'vitest';
import { Effect, Exit } from '../src/effect.js';
import { getCookie, getUrlParam, ValidateAuthCodeError } from '../src/oAuthUtils';
import { parentSuiteName, sharedTags } from './test-utils';

const localSuiteName = 'oAuthUtils tests';

describe(parentSuiteName, () => {
	test('ValidateAuthCodeError', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ValidateAuthCodeError tests');
		await allure.tags(...sharedTags, 'module:oAuthUtils');

		await allure.step('should create an error with correct properties', async (ctx) => {
			const err = new ValidateAuthCodeError({ message: 'Invalid code', provider: 'github' });
			await ctx.parameter('errorMessage', err.message);
			await ctx.parameter('errorProvider', err.provider);
			expect(err._tag).toBe('ValidateAuthCodeError');
			expect(err.message).toBe('Invalid code');
			expect(err.provider).toBe('github');
		});
	});

	[
		{
			url: 'http://localhost/callback?code=1234',
			param: 'code',
			expected: '1234',
		},
		{
			url: 'http://localhost/callback',
			param: 'missing',
			expected: null,
		},
	].forEach(({ url, param, expected }) => {
		test('getUrlParam should return correct value for param', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('getUrlParam tests');
			await allure.tags(...sharedTags, 'module:oAuthUtils', 'function:getUrlParam');

			await allure.step(`Getting URL param "${param}" from "${url}"`, async (ctx) => {
				const urlObj = new URL(url);
				const context = { url: urlObj } as any;
				const effect = getUrlParam(context, param);
				const result = await Effect.runPromise(effect);
				await ctx.parameter('expected', String(expected));
				await ctx.parameter('actual', String(result));
				expect(result).toBe(expected);
			});
		});
	});

	test('getUrlParam should throw AstroError for malformed URL', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getUrlParam tests');
		await allure.tags(...sharedTags, 'module:oAuthUtils', 'function:getUrlParam');

		await allure.step('Getting URL param from malformed URL', async (ctx) => {
			const context = { url: null } as any;
			const effect = getUrlParam(context, 'code');
			const exit = await Effect.runPromiseExit(effect);
			await ctx.parameter('expectedError', 'AstroError');
			expect(exit).toStrictEqual(
				Exit.fail(new AstroError('Failed to parse URL from Astro context'))
			);
		});
	});

	[
		{
			cookies: {
				get: (key: string) => (key === 'session' ? { value: 'abc123' } : undefined),
			},
			cookieName: 'session',
			expected: 'abc123',
		},
		{
			cookies: {
				get: (_: string) => undefined,
			},
			cookieName: 'missing',
			expected: null,
		},
	].forEach(({ cookies, cookieName, expected }) => {
		test('getCookie should return correct cookie value', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('getCookie tests');
			await allure.tags(...sharedTags, 'module:oAuthUtils', 'function:getCookie');

			await allure.step(`Getting cookie "${cookieName}"`, async (ctx) => {
				const context = { cookies } as any;
				const effect = getCookie(context, cookieName);
				const result = await Effect.runPromise(effect);
				await ctx.parameter('expected', String(expected));
				await ctx.parameter('actual', String(result));
				expect(result).toBe(expected);
			});
		});
	});

	test('getCookie should throw AstroError for malformed cookies object', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getCookie tests');
		await allure.tags(...sharedTags, 'module:oAuthUtils', 'function:getCookie');

		await allure.step('Getting cookie from malformed cookies object', async (ctx) => {
			const context = { cookies: null } as any;
			const effect = getCookie(context, 'session');
			const exit = await Effect.runPromiseExit(effect);
			await ctx.parameter('expectedError', 'AstroError');
			expect(exit).toStrictEqual(
				Exit.fail(new AstroError('Failed to parse get Cookies from Astro context'))
			);
		});
	});
});
