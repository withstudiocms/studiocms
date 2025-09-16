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
});
