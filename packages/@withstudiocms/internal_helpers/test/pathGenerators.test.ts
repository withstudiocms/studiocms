import * as allure from 'allure-js-commons';
import { describe, expect, it, test } from 'vitest';
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
import { parentSuiteName } from './test-utils.js';

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
			await allure.tags(
				'package:@withstudiocms/internal_helpers',
				'type:unit',
				'scope:withstudiocms'
			);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			const result = pathWithBase(input);

			await allure.parameter('result', result);
			expect(result).toBe(expected);
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
			await allure.tags(
				'package:@withstudiocms/internal_helpers',
				'type:unit',
				'scope:withstudiocms'
			);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			const result = fileWithBase(input);

			await allure.parameter('result', result);
			expect(result).toBe(expected);
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
			await allure.tags(
				'package:@withstudiocms/internal_helpers',
				'type:unit',
				'scope:withstudiocms'
			);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			const result = ensureLeadingSlash(input);

			await allure.parameter('result', result);
			expect(result).toBe(expected);
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
			await allure.tags(
				'package:@withstudiocms/internal_helpers',
				'type:unit',
				'scope:withstudiocms'
			);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			const result = ensureTrailingSlash(input);

			await allure.parameter('result', result);
			expect(result).toBe(expected);
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
			await allure.tags(
				'package:@withstudiocms/internal_helpers',
				'type:unit',
				'scope:withstudiocms'
			);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			const result = ensureLeadingAndTrailingSlashes(input);

			await allure.parameter('result', result);
			expect(result).toBe(expected);
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
			await allure.tags(
				'package:@withstudiocms/internal_helpers',
				'type:unit',
				'scope:withstudiocms'
			);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			const result = stripLeadingSlash(input);

			await allure.parameter('result', result);
			expect(result).toBe(expected);
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
			await allure.tags(
				'package:@withstudiocms/internal_helpers',
				'type:unit',
				'scope:withstudiocms'
			);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			const result = stripTrailingSlash(input);

			await allure.parameter('result', result);
			expect(result).toBe(expected);
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
			await allure.tags(
				'package:@withstudiocms/internal_helpers',
				'type:unit',
				'scope:withstudiocms'
			);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			const result = stripLeadingAndTrailingSlashes(input);

			await allure.parameter('result', result);
			expect(result).toBe(expected);
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
			await allure.tags(
				'package:@withstudiocms/internal_helpers',
				'type:unit',
				'scope:withstudiocms'
			);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			const result = stripHtmlExtension(input);

			await allure.parameter('result', result);
			expect(result).toBe(expected);
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
			await allure.tags(
				'package:@withstudiocms/internal_helpers',
				'type:unit',
				'scope:withstudiocms'
			);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			const result = ensureHtmlExtension(input);

			await allure.parameter('result', result);
			expect(result).toBe(expected);
		});
	});
});
