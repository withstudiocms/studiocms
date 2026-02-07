import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { tryCatch } from '../../src/utils/index.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'TryCatch Tests';

describe(parentSuiteName, () => {
	[
		{
			fn: () => 42,
			result: 42,
			error: null,
		},
		{
			fn: () => {
				throw new Error('Test error');
			},
			result: null,
			error: new Error('Test error'),
		},
		{
			fn: () => 'hello',
			result: 'hello',
			error: null,
		},
		{
			fn: () => ({ foo: 'bar' }),
			result: { foo: 'bar' },
			error: null,
		},
		{
			fn: () => [1, 2, 3],
			result: [1, 2, 3],
			error: null,
		},
		{
			fn: () => null,
			result: null,
			error: null,
		},
		{
			fn: () => undefined,
			result: undefined,
			error: null,
		},
		{
			fn: async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return 'async result';
			},
			result: 'async result',
			error: null,
		},
		{
			fn: async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				throw new Error('Async error');
			},
			result: null,
			error: new Error('Async error'),
		},
	].forEach(({ fn, result, error }) => {
		test('TryCatch - Functionality Tests', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('Functionality Test Set');
			await allure.tags(...sharedTags);

			// @ts-expect-error: Testing dynamic function inputs
			const [res, err] = await tryCatch(fn);

			await allure.step('Should return expected result', async (ctx) => {
				ctx.parameter('expectedResult', JSON.stringify(result));
				ctx.parameter('actualResult', JSON.stringify(res));
				expect(res).toEqual(result);
			});

			await allure.step('Should return expected error', async (ctx) => {
				ctx.parameter('expectedError', error ? error.toString() : 'null');
				ctx.parameter('actualError', err ? err.toString() : 'null');
				if (error === null) {
					expect(err).toBeNull();
				} else {
					expect(err).toBeInstanceOf(Error);
					expect(err?.message).toBe(error.message);
				}
			});
		});
	});
});
