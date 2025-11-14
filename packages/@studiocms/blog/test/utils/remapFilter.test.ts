import * as allure from 'allure-js-commons';
import { describe, expect, test, vi } from 'vitest';
import * as remapFilterUtils from '../../src/utils/remapFilter.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'remapFilter Utility Tests';

// Mock blogConfig.route for predictable output
vi.mock('studiocms:blog/config', () => ({
	default: {
		route: '/blog',
	},
}));

describe(parentSuiteName, () => {
	[
		{
			input: 'my-post',
			expected: '/blog/my-post',
		},
		{
			input: '',
			expected: '/blog/',
		},
		{
			input: 'foo/bar/baz',
			expected: '/blog/foo/bar/baz',
		},
	].forEach(({ input, expected }) => {
		test(`getBlogRoute('${input}') should return '${expected}'`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('getBlogRoute Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('Input Slug', input);

			await allure.step(`Getting blog route for slug: ${input}`, async (ctx) => {
				const result = remapFilterUtils.getBlogRoute(input);
				await ctx.parameter('Resulting Route', result);
				expect(result).toBe(expected);
			});
		});
	});

	test('remapFilterSitemap should correctly map and filter sitemap entries', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('remapFilterSitemap Tests');
		await allure.tags(...sharedTags);

		const mockContext = {
			url: 'https://example.com/',
		} as unknown as remapFilterUtils.APIContext;

		const array = [
			{
				data: { slug: 'post-1', package: 'blog' },
			},
			{
				data: { slug: 'post-2', package: 'blog' },
			},
			{
				data: { slug: 'other', package: 'docs' },
			},
		] as remapFilterUtils.PageDataCacheObject[];

		await allure.parameter('Input Array', JSON.stringify(array, null, 2));

		await allure.step('Mapping sitemap entries for blog package', async (ctx) => {
			const result = remapFilterUtils.remapFilterSitemap('blog', mockContext, true)(array);
			await ctx.parameter('Mapped Result', JSON.stringify(result, null, 2));
			expect(result).toEqual([
				{ location: 'https://example.com/blog/post-1' },
				{ location: 'https://example.com/blog/post-2' },
			]);
		});
	});

	[
		{
			input: [
				{
					data: { slug: 'foo', package: 'docs' },
				},
				{
					data: { slug: 'bar', package: 'docs' },
				},
			],
			filter: 'docs',
			expected: [{ location: 'https://example.com/foo' }, { location: 'https://example.com/bar' }],
		},
		{
			input: [],
			filter: 'blog',
			expected: [],
		},
		{
			input: [
				{
					data: { slug: 'foo', package: 'docs' },
				},
			],
			filter: 'blog',
			expected: [],
		},
		{
			input: [
				{
					data: { slug: 'special-slug', package: 'blog' },
				},
			],
			filter: 'blog',
			expected: [{ location: 'https://example.com/blog/special-slug' }],
		},
	].forEach(({ input, filter, expected }) => {
		test(`remapFilterSitemap should return correct locations for filter '${filter}'`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('remapFilterSitemap Various Cases');
			await allure.tags(...sharedTags);

			const mockContext = {
				url: 'https://example.com/',
			} as unknown as remapFilterUtils.APIContext;

			await allure.parameter('Input Array', JSON.stringify(input, null, 2));
			await allure.parameter('Filter Package', filter);

			await allure.step(`Mapping sitemap entries for package: ${filter}`, async (ctx) => {
				const result = remapFilterUtils.remapFilterSitemap(
					input as remapFilterUtils.PageDataCacheObject[],
					filter,
					mockContext,
					filter === 'blog'
				);
				await ctx.parameter('Mapped Result', JSON.stringify(result, null, 2));
				expect(result).toEqual(expected);
			});
		});
	});
});
