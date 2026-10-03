import * as allure from 'allure-js-commons';
import { Schema } from 'effect';
import { describe, expect, test } from 'vitest';
import { HTMLSchema } from '../src/types.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'HTMLSchema Type Tests';

describe(parentSuiteName, () => {
	[
		{
			options: {},
			expected: {
				sanitize: {},
				// Note: The default value for sanitize is an empty object, so we expect it to be present in the resulting data.
			},
		},
		{
			options: {
				sanitize: {
					allowElements: ['p', 'br', 'strong'],
					allowAttributes: {
						p: ['class', 'id'],
						strong: ['class'],
					},
				},
			},
			expected: {
				sanitize: {
					allowElements: ['p', 'br', 'strong'],
					allowAttributes: {
						p: ['class', 'id'],
						strong: ['class'],
					},
				},
			},
		},
	].forEach(({ options, expected }, index) => {
		test(`Schema Validation Test #${index + 1}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('Schema Validation Tests');
			await allure.tags(...sharedTags);

			await allure.step(`Validating options: ${JSON.stringify(options)}`, async (ctx) => {
				const result = Schema.decodeUnknownEither(HTMLSchema)(options);

				await ctx.parameter('inputOptions', JSON.stringify(options, null, 2));

				expect(result._tag).toBe('Right');
				if (result._tag === 'Right') {
					expect(result.right).toEqual(expected);
					await ctx.parameter('validatedData', JSON.stringify(result.right, null, 2));
				}
			});
		});
	});

	[
		{
			options: 'invalid-string',
		},
		{
			options: null,
		},
	].forEach(({ options }, index) => {
		test(`Schema Invalid Input Test #${index + 1}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('Schema Invalid Input Tests');
			await allure.tags(...sharedTags);

			await allure.step(`Validating invalid options: ${JSON.stringify(options)}`, async (ctx) => {
				const result = Schema.decodeUnknownEither(HTMLSchema)(options);

				await ctx.parameter('inputOptions', JSON.stringify(options, null, 2));

				expect(result._tag).toBe('Left');
				if (result._tag === 'Left') {
					await ctx.parameter('errors', JSON.stringify(result.left, null, 2));
				}
			});
		});
	});

	[
		{
			options: {},
			expected: {
				sanitize: {},
				// Note: The default value for sanitize is an empty object, so we expect it to be present in the resulting data.
			},
		},
	].forEach(({ options, expected }, index) => {
		test(`Default Values Test #${index + 1}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('Default Values Tests');
			await allure.tags(...sharedTags);

			await allure.step(
				`Checking default values for options: ${JSON.stringify(options)}`,
				async (ctx) => {
					const result = Schema.decodeUnknownEither(HTMLSchema)(options);

					await ctx.parameter('inputOptions', JSON.stringify(options, null, 2));

					expect(result._tag).toBe('Right');
					if (result._tag === 'Right') {
						expect(result.right).toEqual(expected);
						await ctx.parameter('resultingData', JSON.stringify(result.right, null, 2));
					}
				}
			);
		});
	});
});
