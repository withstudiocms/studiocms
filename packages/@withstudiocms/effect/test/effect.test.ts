import { describe, expect, it, test } from '@effect/vitest';
import * as allure from 'allure-js-commons';
import { appendSearchParamsToUrl, Effect, HTTPClient, runEffect } from '../src/effect.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Effect Utility Tests';

describe(parentSuiteName, () => {
	[
		{
			name: 'Effect Utilities - runEffect resolves with value',
			testFn: Effect.succeed(42),
			expected: 42,
		},
		{
			name: 'Effect Utilities - runEffect rejects with error',
			testFn: Effect.fail('error!'),
			expectedError: 'error!',
		},
	].forEach(({ name, testFn, expected, expectedError }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('runEffect Tests');
			await allure.tags(...sharedTags);

			if (expected !== undefined) {
				await allure.step('Running Effect and expecting resolution', async (ctx) => {
					await ctx.parameter('expected', String(expected));
					const result = await runEffect(testFn);
					await ctx.parameter('result', String(result));
					expect(result).toBe(expected);
				});
			} else if (expectedError !== undefined) {
				await allure.step('Running Effect and expecting rejection', async () => {
					await expect(runEffect(testFn)).rejects.toThrow(expectedError);
				});
			}
		});
	});

	[
		{
			curried: true,
		},
		{
			curried: false,
		},
	].forEach(({ curried }) => {
		const testName = curried
			? 'appendSearchParamsToUrl (curried) appends param correctly'
			: 'appendSearchParamsToUrl (uncurried) appends param correctly';

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('appendSearchParamsToUrl Tests');
			await allure.tags(...sharedTags);

			const url = new URL('https://example.com');
			let resultUrl: URL;

			if (curried) {
				await allure.step('Using curried version to append param', async (ctx) => {
					const appendParam = appendSearchParamsToUrl('testKey', 'testValue');
					resultUrl = appendParam(url);
					await ctx.parameter('resultUrl', resultUrl.toString());

					expect(resultUrl.searchParams.get('testKey')).toBe('testValue');
					expect(resultUrl.toString()).toBe('https://example.com/?testKey=testValue');
				});
			} else {
				await allure.step('Using uncurried version to append param', async (ctx) => {
					resultUrl = appendSearchParamsToUrl(url, 'testKey', 'testValue');
					await ctx.parameter('resultUrl', resultUrl.toString());

					expect(resultUrl.searchParams.get('testKey')).toBe('testValue');
					expect(resultUrl.toString()).toBe('https://example.com/?testKey=testValue');
				});
			}
		});
	});

	test('HTTPClient provides a retrying HttpClient instance', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('HTTPClient Tests');
		await allure.tags(...sharedTags);

		await allure.step('Creating HTTPClient and making GET request to example.com', async (ctx) => {
			const client = await runEffect(HTTPClient.pipe(Effect.provide(HTTPClient.Default)));
			await ctx.parameter('HTTPClient Created', 'true');

			expect(client).toBeDefined();

			const response = await runEffect(client.get('https://example.com'));
			await ctx.parameter('GET Request Made', 'true');

			expect(response).toBeDefined();
			expect(response.status).toBe(200);

			const result = await runEffect(response.text);
			await ctx.parameter('Response Text Retrieved', 'true');

			expect(result).toBeDefined();
			expect(result).toContain('<title>Example Domain</title>');
		});
	});
});
