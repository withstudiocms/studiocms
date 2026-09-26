import { describe, expect, it, test } from '@effect/vitest';
import * as allure from 'allure-js-commons';
import {
	ensureLeadingSlash,
	pathGenerator,
	pathWithBase,
	stripLeadingSlash,
	stripTrailingSlash,
} from '../../src/utils/pathGenerator';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'pathGenerator Utility Function Tests';

describe(parentSuiteName, () => {
	[
		{
			input: '/hello',
			expected: 'hello',
		},
		{
			input: '/hello/world',
			expected: 'hello/world',
		},
		{
			input: 'hello',
			expected: 'hello',
		},
		{
			input: 'hello/world',
			expected: 'hello/world',
		},
		{
			input: '',
			expected: '',
		},
	].forEach(({ input, expected }) => {
		it(`stripLeadingSlash('${input}') should return '${expected}'`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('stripLeadingSlash Tests');
			await allure.tags(...sharedTags);

			await allure.step(
				`stripLeadingSlash('${input}') should return '${expected}'`,
				async (ctx) => {
					const result = stripLeadingSlash(input);
					await ctx.parameter('input', input);
					await ctx.parameter('result', result);
					expect(result).toBe(expected);
				}
			);
		});
	});

	[
		{
			input: 'hello/',
			expected: 'hello',
		},
		{
			input: 'hello/world/',
			expected: 'hello/world',
		},
		{
			input: 'hello',
			expected: 'hello',
		},
		{
			input: 'hello/world',
			expected: 'hello/world',
		},
		{
			input: '',
			expected: '',
		},
	].forEach(({ input, expected }) => {
		it(`stripTrailingSlash('${input}') should return '${expected}'`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('stripTrailingSlash Tests');
			await allure.tags(...sharedTags);

			await allure.step(
				`stripTrailingSlash('${input}') should return '${expected}'`,
				async (ctx) => {
					const result = stripTrailingSlash(input);
					await ctx.parameter('input', input);
					await ctx.parameter('result', result);
					expect(result).toBe(expected);
				}
			);
		});
	});

	[
		{
			input: 'hello',
			expected: '/hello',
		},
		{
			input: 'hello/world',
			expected: '/hello/world',
		},
		{
			input: '/hello',
			expected: '/hello',
		},
		{
			input: '/hello/world',
			expected: '/hello/world',
		},
		{
			input: '',
			expected: '/',
		},
	].forEach(({ input, expected }) => {
		it(`ensureLeadingSlash('${input}') should return '${expected}'`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('ensureLeadingSlash Tests');
			await allure.tags(...sharedTags);

			await allure.step(
				`ensureLeadingSlash('${input}') should return '${expected}'`,
				async (ctx) => {
					const result = ensureLeadingSlash(input);
					await ctx.parameter('input', input);
					await ctx.parameter('result', result);
					expect(result).toBe(expected);
				}
			);
		});
	});

	[
		{
			path: 'hello',
			base: 'https://example.com',
			expected: 'https://example.com/hello',
		},
		{
			path: 'hello/world',
			base: 'https://example.com',
			expected: 'https://example.com/hello/world',
		},
		{
			path: '',
			base: 'https://example.com',
			expected: 'https://example.com/',
		},
	].forEach(({ path, base, expected }) => {
		it(`pathWithBase('${path}', '${base}') should return '${expected}'`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('pathWithBase Tests');
			await allure.tags(...sharedTags);

			await allure.step(
				`pathWithBase('${path}', '${base}') should return '${expected}'`,
				async (ctx) => {
					const result = pathWithBase(path, base);
					await ctx.parameter('path', path);
					await ctx.parameter('base', base);
					await ctx.parameter('result', result);
					expect(result).toBe(expected);
				}
			);
		});
	});

	[
		{
			endpointPath: '/api',
			base: 'https://example.com',
			cases: [
				{
					input: 'test',
					expected: 'https://example.com/api/test',
				},
				{
					input: '/test',
					expected: 'https://example.com/api/test',
				},
				{
					input: 'test/endpoint',
					expected: 'https://example.com/api/test/endpoint',
				},
			],
		},
		{
			endpointPath: '/api/',
			base: 'https://example.com/',
			cases: [
				{
					input: 'test',
					expected: 'https://example.com/api/test',
				},
				{
					input: '/test',
					expected: 'https://example.com/api/test',
				},
			],
		},
		{
			endpointPath: '',
			base: 'https://example.com',
			cases: [
				{
					input: 'test',
					expected: 'https://example.com/test',
				},
				{
					input: '/test',
					expected: 'https://example.com/test',
				},
			],
		},
	].forEach(({ endpointPath, base, cases }) => {
		test(`pathGenerator('${endpointPath}', '${base}') should create correct path builder`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('pathGenerator Tests');
			await allure.tags(...sharedTags);

			const builder = pathGenerator(endpointPath, base);

			for (const { input, expected } of cases) {
				await allure.step(`builder('${input}') should return '${expected}'`, async (ctx) => {
					const result = builder(input);
					await ctx.parameter('input', input);
					await ctx.parameter('result', result);
					expect(result).toBe(expected);
				});
			}
		});
	});
});
