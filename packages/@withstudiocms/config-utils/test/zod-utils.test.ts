import * as allure from 'allure-js-commons';
import { z } from 'astro/zod';
import { describe, expect, test } from 'vitest';
import { deepRemoveDefaults, parseAndMerge, parseConfig } from '../src/zod-utils.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Zod Utility Tests';

// Helper: simple schema for most tests
const simpleSchema = z.object({
	foo: z.string(),
	bar: z.number().default(42),
	baz: z.boolean().optional(),
});

describe(parentSuiteName, () => {
	[
		{
			opts: { foo: 'hello', bar: 1 },
			expected: { foo: 'hello', bar: 1 },
		},
		{
			opts: { foo: 'hi' },
			expected: { foo: 'hi', bar: 42 },
		},
		{
			opts: { bar: 1 },
			error: /Invalid Configuration Options/,
		},
	].forEach(({ opts, expected, error }) => {
		test('Zod Utils - parseConfig Test', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('parseConfig Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('testCase', JSON.stringify({ opts, expected, error }));

			if (error) {
				await allure.step('Should throw error for invalid config', async (ctx) => {
					await ctx.parameter('input', JSON.stringify(opts));
					await ctx.parameter('expectedError', error.toString());
					expect(() => parseConfig(simpleSchema, opts)).toThrow(error);
				});
			} else {
				await allure.step('Should parse config successfully', async (ctx) => {
					await ctx.parameter('input', JSON.stringify(opts));
					const result = parseConfig(simpleSchema, opts);
					expect(result).toEqual(expected);
				});
			}
		});
	});

	[
		{
			schema: z.object({
				a: z.string().default('x'),
				b: z.number(),
				c: z.object({
					d: z.boolean().default(true),
				}),
			}),
			tests: [
				{
					input: {},
					success: true,
				},
				{
					input: { b: 2, c: { d: false } },
					success: true,
				},
			],
		},
		{
			schema: z.object({
				arr: z.array(z.string().default('x')).default(['y']),
				opt: z.string().optional(),
				nul: z.number().nullable(),
				tup: z.tuple([z.string().default('a'), z.number()]),
			}),
			tests: [
				{
					input: {},
					success: true,
				},
				{
					input: { arr: ['z'], tup: ['b', 2] },
					success: true,
				},
			],
		},
	].forEach(({ schema, tests }) => {
		test('Zod Utils - deepRemoveDefaults Tests', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('deepRemoveDefaults Test Set');
			await allure.tags(...sharedTags);

			const noDefaults = deepRemoveDefaults(schema);

			for (const { input, success } of tests) {
				await allure.step(`Testing input: ${JSON.stringify(input)}`, async (ctx) => {
					await ctx.parameter('input', JSON.stringify(input));
					const result = noDefaults.safeParse(input);
					expect(result.success).toBe(success);
				});
			}
		});
	});

	[
		{
			schema: z.object({
				a: z.string().default('A'),
				b: z.number().default(1),
				c: z
					.object({
						d: z.boolean().default(false),
					})
					.default({ d: false }),
			}),
			configFile: { a: 'file', c: { d: true } },
			expected: { a: 'file', b: 1, c: { d: true } },
		},
		{
			schema: z.object({
				a: z.string().default('A'),
				b: z.number().default(1),
				c: z
					.object({
						d: z.boolean().default(false),
					})
					.default({ d: false }),
			}),
			configFile: undefined,
			expected: { a: 'A', b: 1, c: { d: false } },
		},
		{
			schema: z.object({
				a: z.string().default('A'),
				b: z.number().default(1),
				c: z
					.object({
						d: z.boolean().default(false),
					})
					.default({ d: false }),
			}),
			configFile: undefined,
			expected: { a: 'A', b: 1, c: { d: false } },
		},
		{
			schema: z.object({
				a: z.string().default('A'),
				b: z.number().default(1),
				c: z
					.object({
						d: z.boolean().default(false),
					})
					.default({ d: false }),
			}),
			configFile: { b: 'not-a-number' },
			error: /Invalid Config Options/,
		},
	].forEach(({ schema, configFile, expected, error }) => {
		test('Zod Utils - parseAndMerge Tests', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('parseAndMerge Test Set');
			await allure.tags(...sharedTags);

			await allure.parameter('testCase', JSON.stringify({ configFile, expected, error }));

			if (error) {
				await allure.step('Should throw error for invalid config', async (ctx) => {
					await ctx.parameter('input', JSON.stringify({ configFile }));
					await ctx.parameter('expectedError', error.toString());
					// @ts-expect-error - testing error case
					expect(() => parseAndMerge(schema, configFile)).toThrow(error);
				});
			} else {
				await allure.step('Should parse and merge config successfully', async (ctx) => {
					await ctx.parameter('input', JSON.stringify({ configFile }));
					const result = parseAndMerge(schema, configFile);
					expect(result).toEqual(expected);
				});
			}
		});
	});
});
