import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	ensureHtmlExtension,
	ensureLeadingAndTrailingSlashes,
	ensureLeadingSlash,
	ensureTrailingSlash,
	fileWithBase,
	pathWithBase,
	stripHtmlExtension,
	stripLeadingAndTrailingSlashes,
	stripLeadingSlash,
	stripTrailingSlash,
} from '../src/pathGenerators.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Path Generators Tests';

describe(parentSuiteName, () => {
	// pathWithBase tests
	[
		{ input: '/foo/bar', expected: '/foo/bar' },
		{ input: 'foo/bar', expected: '/foo/bar' },
		{ input: '/', expected: '/' },
		{ input: '', expected: '/' },
	].forEach(({ input, expected }) => {
		test('pathWithBase - Strips leading slash and prepends one', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('pathWithBase - Strips leading slash and prepends one');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			await allure.step('Executing pathWithBase', async (ctx) => {
				const result = pathWithBase(input);
				await ctx.parameter('result', result);
				expect(result).toBe(expected);
			});
		});
	});

	// fileWithBase tests
	[
		{ input: '/file.txt', expected: '/file.txt' },
		{ input: 'file.txt', expected: '/file.txt' },
		{ input: '/', expected: '/' },
		{ input: '', expected: '/' },
	].forEach(({ input, expected }) => {
		test('fileWithBase - Strips leading slash and prepends one', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('fileWithBase - Strips leading slash and prepends one');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			await allure.step('Executing fileWithBase', async (ctx) => {
				const result = fileWithBase(input);
				await ctx.parameter('result', result);
				expect(result).toBe(expected);
			});
		});
	});

	// ensureLeadingSlash tests
	[
		{ input: 'foo', expected: '/foo' },
		{ input: '/foo', expected: '/foo' },
		{ input: '', expected: '/' },
	].forEach(({ input, expected }) => {
		test('ensureLeadingSlash adds slash if missing', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('ensureLeadingSlash adds slash if missing');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			await allure.step('Executing ensureLeadingSlash', async (ctx) => {
				const result = ensureLeadingSlash(input);
				await ctx.parameter('result', result);
				expect(result).toBe(expected);
			});
		});
	});

	// ensureTrailingSlash tests
	[
		{ input: 'foo', expected: 'foo/' },
		{ input: 'foo/', expected: 'foo/' },
		{ input: '', expected: '/' },
	].forEach(({ input, expected }) => {
		test('ensureTrailingSlash adds slash if missing', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('ensureTrailingSlash adds slash if missing');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			await allure.step('Executing ensureTrailingSlash', async (ctx) => {
				const result = ensureTrailingSlash(input);

				await ctx.parameter('result', result);
				expect(result).toBe(expected);
			});
		});
	});

	// ensureLeadingAndTrailingSlashes tests
	[
		{ input: 'foo', expected: '/foo/' },
		{ input: '/foo', expected: '/foo/' },
		{ input: 'foo/', expected: '/foo/' },
		{ input: '/foo/', expected: '/foo/' },
		{ input: '', expected: '/' },
	].forEach(({ input, expected }) => {
		test('ensureLeadingAndTrailingSlashes adds both slashes', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('ensureLeadingAndTrailingSlashes adds both slashes');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			await allure.step('Executing ensureLeadingAndTrailingSlashes', async (ctx) => {
				const result = ensureLeadingAndTrailingSlashes(input);

				await ctx.parameter('result', result);
				expect(result).toBe(expected);
			});
		});
	});

	// stripLeadingSlash tests
	[
		{ input: '/foo', expected: 'foo' },
		{ input: 'foo', expected: 'foo' },
		{ input: '', expected: '' },
	].forEach(({ input, expected }) => {
		test('stripLeadingSlash removes leading slash', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('stripLeadingSlash removes leading slash');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			await allure.step('Executing stripLeadingSlash', async (ctx) => {
				const result = stripLeadingSlash(input);

				await ctx.parameter('result', result);
				expect(result).toBe(expected);
			});
		});
	});

	// stripTrailingSlash tests
	[
		{ input: 'foo/', expected: 'foo' },
		{ input: 'foo', expected: 'foo' },
		{ input: '', expected: '' },
	].forEach(({ input, expected }) => {
		test('stripTrailingSlash removes trailing slash', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('stripTrailingSlash removes trailing slash');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			await allure.step('Executing stripTrailingSlash', async (ctx) => {
				const result = stripTrailingSlash(input);

				await ctx.parameter('result', result);
				expect(result).toBe(expected);
			});
		});
	});

	// stripLeadingAndTrailingSlashes tests
	[
		{ input: '/foo/', expected: 'foo' },
		{ input: 'foo/', expected: 'foo' },
		{ input: '/foo', expected: 'foo' },
		{ input: 'foo', expected: 'foo' },
		{ input: '', expected: '' },
	].forEach(({ input, expected }) => {
		test('stripLeadingAndTrailingSlashes removes both', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('stripLeadingAndTrailingSlashes removes both');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			await allure.step('Executing stripLeadingAndTrailingSlashes', async (ctx) => {
				const result = stripLeadingAndTrailingSlashes(input);

				await ctx.parameter('result', result);
				expect(result).toBe(expected);
			});
		});
	});

	// stripHtmlExtension tests
	[
		{ input: '/foo/bar.html', expected: '/foo/bar' },
		{ input: '/foo/bar/', expected: '/foo/bar' },
		{ input: '/foo/bar', expected: '/foo/bar' },
		{ input: '/foo/bar.html/', expected: '/foo/bar' },
	].forEach(({ input, expected }) => {
		test('stripHtmlExtension removes .html extension', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('stripHtmlExtension removes .html extension');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			await allure.step('Executing stripHtmlExtension', async (ctx) => {
				const result = stripHtmlExtension(input);

				await ctx.parameter('result', result);
				expect(result).toBe(expected);
			});
		});
	});

	// ensureHtmlExtension tests
	[
		{ input: '/foo/bar', expected: '/foo/bar.html' },
		{ input: 'foo/bar', expected: '/foo/bar.html' },
		{ input: '/foo/bar.html', expected: '/foo/bar.html' },
		{ input: 'foo/bar.html', expected: '/foo/bar.html' },
		{ input: '', expected: '/index.html' },
	].forEach(({ input, expected }) => {
		test('ensureHtmlExtension adds .html if missing', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('ensureHtmlExtension adds .html if missing');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			await allure.step('Executing ensureHtmlExtension', async (ctx) => {
				const result = ensureHtmlExtension(input);

				await ctx.parameter('result', result);
				expect(result).toBe(expected);
			});
		});
	});
});
