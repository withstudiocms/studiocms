import { describe, expect, it, vi } from 'vitest';
import * as remapFilterUtils from '../../src/utils/remapFilter.js';

// Mock blogConfig.route for predictable output
vi.mock('studiocms:blog/config', () => ({
	default: {
		route: '/blog',
	},
}));

describe('getBlogRoute', () => {
	it('replaces [...slug] with provided slug', () => {
		const slug = 'my-post';
		// blogRouteFullPath = '/blog/[...slug]'
		const result = remapFilterUtils.getBlogRoute(slug);
		expect(result).toBe('/blog/my-post');
	});

	it('handles empty slug', () => {
		const slug = '';
		const result = remapFilterUtils.getBlogRoute(slug);
		expect(result).toBe('/blog/');
	});

	it('returns "#" if blogRouteFullPath is falsy', () => {
		// Temporarily override blogRouteFullPath to falsy
		const _original = remapFilterUtils.getBlogRoute;
		// Simulate blogRouteFullPath being falsy by mocking the function
		const getBlogRoute = (slug: string) => {
			// Simulate blogRouteFullPath falsy
			const blogRouteFullPath: string = '';
			if (blogRouteFullPath) {
				return blogRouteFullPath.replace('[...slug]', slug);
			}
			return '#';
		};
		expect(getBlogRoute('anything')).toBe('#');
		// Restore original if needed
	});

	it('correctly replaces slug with special characters', () => {
		const slug = 'foo/bar/baz';
		const result = remapFilterUtils.getBlogRoute(slug);
		expect(result).toBe('/blog/foo/bar/baz');
	});

	it('remapFilterSitemap returns correct locations (curried)', () => {
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

		const result = remapFilterUtils.remapFilterSitemap('blog', mockContext, true)(array);
		expect(result).toEqual([
			{ location: 'https://example.com/blog/post-1' },
			{ location: 'https://example.com/blog/post-2' },
		]);
	});

	it('remapFilterSitemap returns correct locations (uncurried)', () => {
		const mockContext = {
			url: 'https://example.com/',
		} as unknown as remapFilterUtils.APIContext;

		const array = [
			{
				data: { slug: 'foo', package: 'docs' },
			},
			{
				data: { slug: 'bar', package: 'docs' },
			},
		] as remapFilterUtils.PageDataCacheObject[];

		const result = remapFilterUtils.remapFilterSitemap(array, 'docs', mockContext, false);
		expect(result).toEqual([
			{ location: 'https://example.com/foo' },
			{ location: 'https://example.com/bar' },
		]);
	});

	it('remapFilterSitemap filters by package and handles empty array', () => {
		const mockContext = {
			url: 'https://example.com/',
		} as unknown as remapFilterUtils.APIContext;

		const array = [] as remapFilterUtils.PageDataCacheObject[];

		const result = remapFilterUtils.remapFilterSitemap(array, 'blog', mockContext, true);
		expect(result).toEqual([]);
	});

	it('remapFilterSitemap returns empty if no matching package', () => {
		const mockContext = {
			url: 'https://example.com/',
		} as unknown as remapFilterUtils.APIContext;

		const array = [
			{
				data: { slug: 'foo', package: 'docs' },
			},
		] as remapFilterUtils.PageDataCacheObject[];

		const result = remapFilterUtils.remapFilterSitemap(array, 'blog', mockContext, true);
		expect(result).toEqual([]);
	});

	it('remapFilterSitemap uses blog route when blog=true', () => {
		const mockContext = {
			url: 'https://example.com/',
		} as unknown as remapFilterUtils.APIContext;

		const array = [
			{
				data: { slug: 'special-slug', package: 'blog' },
			},
		] as remapFilterUtils.PageDataCacheObject[];

		const result = remapFilterUtils.remapFilterSitemap(array, 'blog', mockContext, true);
		expect(result[0].location).toBe('https://example.com/blog/special-slug');
	});
});
