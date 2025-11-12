import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { HTMLSchema } from '../src/types.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'HTMLSchema Type Tests';

describe(parentSuiteName, () => {
	[
		{
			options: undefined,
			expected: {},
		},
		{
			options: {},
			expected: {},
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
				const result = HTMLSchema.safeParse(options);

				await ctx.parameter('inputOptions', JSON.stringify(options, null, 2));

				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toEqual(expected);
					await ctx.parameter('validatedData', JSON.stringify(result.data, null, 2));
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
				const result = HTMLSchema.safeParse(options);

				await ctx.parameter('inputOptions', JSON.stringify(options, null, 2));

				expect(result.success).toBe(false);
				if (!result.success) {
					await ctx.parameter('errors', JSON.stringify(result.error.format(), null, 2));
				}
			});
		});
	});

	[
		{
			options: undefined,
			expected: {},
		},
		{
			options: {},
			expected: {},
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
					const result = HTMLSchema.parse(options);

					await ctx.parameter('inputOptions', JSON.stringify(options, null, 2));

					expect(result).toEqual(expected);
					await ctx.parameter('resultingData', JSON.stringify(result, null, 2));
				}
			);
		});
	});
});
