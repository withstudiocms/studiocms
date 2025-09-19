import { describe, expect, it } from 'vitest';
import { makePublicRoute } from '../../../src/virtuals/lib/makePublicRoute';

describe('makePublicRoute', () => {
	it('should construct the correct public route for a simple string', () => {
		const route = 'images';
		const result = makePublicRoute(route);
		expect(result).toBe('public/studiocms-resources/images/');
	});

	it('should handle route with leading slash', () => {
		const route = '/assets';
		const result = makePublicRoute(route);
		expect(result).toBe('public/studiocms-resources//assets/');
	});

	it('should handle route with trailing slash', () => {
		const route = 'files/';
		const result = makePublicRoute(route);
		expect(result).toBe('public/studiocms-resources/files//');
	});

	it('should handle empty route string', () => {
		const route = '';
		const result = makePublicRoute(route);
		expect(result).toBe('public/studiocms-resources//');
	});

	it('should handle route with special characters', () => {
		const route = 'foo/bar?baz=qux';
		const result = makePublicRoute(route);
		expect(result).toBe('public/studiocms-resources/foo/bar?baz=qux/');
	});
});
