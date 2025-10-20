import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { Deepmerge, deepmerge } from '../src/deepmerge.js';
import { Effect } from '../src/effect.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Deepmerge Utility Tests';

describe(parentSuiteName, () => {
	[
		{
			name: 'Deepmerge - merges two simple objects',
			obj1: { a: 1, b: 2 },
			obj2: { b: 3, c: 4 },
			expected: { a: 1, b: 3, c: 4 },
		},
		{
			name: 'Deepmerge - merges nested objects deeply',
			obj1: { a: { x: 1 }, b: 2 },
			obj2: { a: { y: 2 }, b: 3 },
			expected: { a: { x: 1, y: 2 }, b: 3 },
		},
		{
			name: 'Deepmerge - respects custom options for merging arrays',
			obj1: { arr: [1, 2] },
			obj2: { arr: [3, 4] },
			options: {
				mergeArrays: (arrays: unknown[][]) => arrays.flat(),
			},
			expected: { arr: [1, 2, 3, 4] },
		},
		{
			name: 'Deepmerge - throws an error if the merge function throws',
			errorFn: () => {
				throw new Error('Test error');
			},
			expectedError: 'Failed to run deepmerge: Test error',
		},
	].forEach(({ name, obj1, obj2, options, expected, errorFn, expectedError }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('deepmerge Effect Tests');
			await allure.tags(...sharedTags);

			if (expected !== undefined) {
				await allure.step('Running deepmerge and expecting result', async (ctx) => {
					await ctx.parameter('Object 1', JSON.stringify(obj1));
					await ctx.parameter('Object 2', JSON.stringify(obj2));
					if (options) {
						await ctx.parameter('Custom Options', JSON.stringify(options));
					}

					const result = await Effect.runPromise(
						// @ts-expect-error obj1 and obj2 may be undefined
						// biome-ignore lint/style/noNonNullAssertion: this is okay in tests
						deepmerge((merge) => merge(obj1!, obj2!), options)
					);

					await ctx.parameter('Result', JSON.stringify(result));
					expect(result).toEqual(expected);
				});
			} else if (expectedError !== undefined && errorFn) {
				await allure.step('Running deepmerge and expecting error', async () => {
					await expect(Effect.runPromise(deepmerge(() => errorFn()))).rejects.toThrow(
						expectedError
					);
				});
			}
		});
	});

	[
		{
			name: 'Deepmerge - Effect Service - merges two simple objects',
			obj1: { a: 1, b: 2 },
			obj2: { b: 3, c: 4 },
			expected: { a: 1, b: 3, c: 4 },
		},
		{
			name: 'Deepmerge - Effect Service - merges nested objects deeply',
			obj1: { a: { x: 1 }, b: 2 },
			obj2: { a: { y: 2 }, b: 3 },
			expected: { a: { x: 1, y: 2 }, b: 3 },
		},
		{
			name: 'Deepmerge - Effect Service - respects custom options for merging arrays',
			obj1: { arr: [1, 2] },
			obj2: { arr: [3, 4] },
			options: {
				mergeArrays: (arrays: unknown[][]) => arrays.flat(),
			},
			expected: { arr: [1, 2, 3, 4] },
		},
		{
			name: 'Deepmerge - Effect Service - throws an error if the service merge function throws',
			errorFn: () => {
				throw new Error('Service test error');
			},
			expectedError: 'Failed to run deepmerge: Service test error',
		},
	].forEach(({ name, obj1, obj2, options, expected, errorFn, expectedError }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('Deepmerge Effect Service Tests');
			await allure.tags(...sharedTags);

			if (expected !== undefined) {
				await allure.step('Running Deepmerge service and expecting result', async (ctx) => {
					await ctx.parameter('Object 1', JSON.stringify(obj1));
					await ctx.parameter('Object 2', JSON.stringify(obj2));
					if (options) {
						await ctx.parameter('Custom Options', JSON.stringify(options));
					}

					const effect = Effect.gen(function* () {
						const service = yield* Deepmerge;
						// @ts-expect-error obj1 and obj2 may be undefined
						// biome-ignore lint/style/noNonNullAssertion: this is okay in tests
						return yield* service.merge((merge) => merge(obj1!, obj2!), options);
					}).pipe(Effect.provide(Deepmerge.Default));

					const result = await Effect.runPromise(effect);

					await ctx.parameter('Result', JSON.stringify(result));
					expect(result).toEqual(expected);
				});
			} else if (expectedError !== undefined && errorFn) {
				await allure.step('Running Deepmerge service and expecting error', async () => {
					const effect = Effect.gen(function* () {
						const service = yield* Deepmerge;
						return yield* service.merge(() => errorFn());
					}).pipe(Effect.provide(Deepmerge.Default));

					await expect(Effect.runPromise(effect)).rejects.toThrow(expectedError);
				});
			}
		});
	});
});
