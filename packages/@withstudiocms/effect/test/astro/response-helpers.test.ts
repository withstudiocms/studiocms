import { describe, expect, it } from 'vitest';
import {
	AllResponse,
	createHtmlResponse,
	createJsonResponse,
	createRedirectResponse,
	createTextResponse,
	OptionsResponse,
} from '../../src/astro/response-helpers.js';

describe('response-helpers', () => {
	describe('OptionsResponse', () => {
		it('should return a 204 response with correct headers', () => {
			const res = OptionsResponse({
				allowedMethods: ['GET', 'POST'],
				allowedOrigins: ['https://example.com'],
				headers: { 'X-Test': 'test' },
			});
			expect(res.status).toBe(204);
			expect(res.statusText).toBe('No Content');
			expect(res.headers.get('Allow')).toBe('OPTIONS, GET, POST');
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
			expect(res.headers.get('X-Test')).toBe('test');
			expect(res.headers.get('Date')).toBeTruthy();
		});

		it('should default allowedOrigins to *', () => {
			const res = OptionsResponse({
				allowedMethods: ['GET'],
			});
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
		});
	});

	describe('AllResponse', () => {
		it('should return a 405 response with correct headers', () => {
			const res = AllResponse({
				allowedOrigins: ['https://foo.com'],
				headers: { 'X-Foo': 'bar' },
			});
			expect(res.status).toBe(405);
			expect(res.statusText).toBe('Method Not Allowed');
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://foo.com');
			expect(res.headers.get('X-Foo')).toBe('bar');
			expect(res.headers.get('Date')).toBeTruthy();
		});

		it('should default allowedOrigins to *', () => {
			const res = AllResponse({});
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
		});
	});

	describe('createJsonResponse', () => {
		it('should return a 200 JSON response by default', async () => {
			const data = { foo: 'bar' };
			const res = createJsonResponse(data);
			expect(res.status).toBe(200);
			expect(res.statusText).toBe('OK');
			expect(res.headers.get('Content-Type')).toBe('application/json');
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
			expect(await res.json()).toEqual(data);
		});

		it('should allow custom status and headers', async () => {
			const res = createJsonResponse(
				{ ok: true },
				{
					status: 201,
					statusText: 'Created',
					headers: { 'X-Custom': 'yes' },
					allowedOrigins: ['https://bar.com'],
				}
			);
			expect(res.status).toBe(201);
			expect(res.statusText).toBe('Created');
			expect(res.headers.get('X-Custom')).toBe('yes');
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://bar.com');
		});
	});

	describe('createTextResponse', () => {
		it('should return a 200 text response by default', async () => {
			const res = createTextResponse('hello world');
			expect(res.status).toBe(200);
			expect(res.statusText).toBe('OK');
			expect(res.headers.get('Content-Type')).toBe('text/plain');
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
			expect(await res.text()).toBe('hello world');
		});

		it('should allow custom status and headers', async () => {
			const res = createTextResponse('foo', {
				status: 404,
				statusText: 'Not Found',
				headers: { 'X-Txt': 'bar' },
				allowedOrigins: ['https://baz.com'],
			});
			expect(res.status).toBe(404);
			expect(res.statusText).toBe('Not Found');
			expect(res.headers.get('X-Txt')).toBe('bar');
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://baz.com');
		});
	});

	describe('createHtmlResponse', () => {
		it('should return a 200 HTML response by default', async () => {
			const html = '<h1>Test</h1>';
			const res = createHtmlResponse(html);
			expect(res.status).toBe(200);
			expect(res.statusText).toBe('OK');
			expect(res.headers.get('Content-Type')).toBe('text/html');
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
			expect(await res.text()).toBe(html);
		});

		it('should allow custom status and headers', async () => {
			const res = createHtmlResponse('<div>foo</div>', {
				status: 500,
				statusText: 'Server Error',
				headers: { 'X-HTML': 'baz' },
				allowedOrigins: ['https://html.com'],
			});
			expect(res.status).toBe(500);
			expect(res.statusText).toBe('Server Error');
			expect(res.headers.get('X-HTML')).toBe('baz');
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://html.com');
		});
	});

	describe('createRedirectResponse', () => {
		it('should return a 302 response with Location header', () => {
			const res = createRedirectResponse('https://redirect.com');
			expect(res.status).toBe(302);
			expect(res.statusText).toBe('Found');
			expect(res.headers.get('Location')).toBe('https://redirect.com');
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
		});

		it('should allow custom headers and allowedOrigins', () => {
			const res = createRedirectResponse('https://foo.com', {
				headers: { 'X-Redirect': 'yes' },
				allowedOrigins: ['https://bar.com'],
			});
			expect(res.headers.get('X-Redirect')).toBe('yes');
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://bar.com');
		});
	});
});
