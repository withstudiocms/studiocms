import { describe, expect, it } from 'vitest';
import {
	apiRoute,
	makeAPIRoute,
	restRoute,
	sdkRouteResolver,
	v1RestRoute,
} from '../../../src/virtuals/lib/makeAPIRoute';

describe('makeAPIRoute', () => {
	it('should return a function that generates correct API route', () => {
		const userRoute = makeAPIRoute('users');
		expect(userRoute('profile')).toBe('/studiocms_api/users/profile');
		expect(userRoute('settings')).toBe('/studiocms_api/users/settings');
	});

	it('should handle empty route string', () => {
		const baseRoute = makeAPIRoute('base');
		expect(baseRoute('')).toBe('/studiocms_api/base/');
	});

	it('should handle empty path string', () => {
		const emptyPathRoute = makeAPIRoute('');
		expect(emptyPathRoute('test')).toBe('/studiocms_api//test');
	});
});

describe('sdkRouteResolver', () => {
	it('should generate SDK API route', () => {
		expect(sdkRouteResolver('init')).toBe('/studiocms_api/sdk/init');
		expect(sdkRouteResolver('status')).toBe('/studiocms_api/sdk/status');
	});
});

describe('apiRoute', () => {
	it('should generate renderer API route', () => {
		expect(apiRoute('render')).toBe('/studiocms_api/renderer/render');
		expect(apiRoute('preview')).toBe('/studiocms_api/renderer/preview');
	});
});

describe('restRoute', () => {
	it('should generate REST API route for given version', () => {
		expect(restRoute('v1')('users')).toBe('/studiocms_api/rest/v1/users');
		// @ts-expect-error testing invalid version
		expect(restRoute('v2')('posts')).toBe('/studiocms_api/rest/v2/posts');
	});
});

describe('v1RestRoute', () => {
	it('should generate REST API route for v1', () => {
		expect(v1RestRoute('comments')).toBe('/studiocms_api/rest/v1/comments');
		expect(v1RestRoute('likes')).toBe('/studiocms_api/rest/v1/likes');
	});
});
