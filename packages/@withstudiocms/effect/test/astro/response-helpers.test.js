import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	AllResponse,
	createHtmlResponse,
	createJsonResponse,
	createRedirectResponse,
	createTextResponse,
	OptionsResponse,
} from '../../dist/astro/response-helpers.js';

describe('response-helpers', () => {
	describe('OptionsResponse', () => {
		it('should return a 204 response with correct headers', () => {
			const res = OptionsResponse({
				allowedMethods: ['GET', 'POST'],
				allowedOrigins: ['https://example.com'],
				headers: { 'X-Test': 'test' },
			});
			assert.strictEqual(res.status, 204);
			assert.strictEqual(res.statusText, 'No Content');
			assert.strictEqual(res.headers.get('Allow'), 'OPTIONS, GET, POST');
			assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), 'https://example.com');
			assert.strictEqual(res.headers.get('X-Test'), 'test');
			assert.ok(res.headers.get('Date'));
		});

		it('should default allowedOrigins to *', () => {
			const res = OptionsResponse({
				allowedMethods: ['GET'],
			});
			assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');
		});
	});

	describe('AllResponse', () => {
		it('should return a 405 response with correct headers', () => {
			const res = AllResponse({
				allowedOrigins: ['https://foo.com'],
				headers: { 'X-Foo': 'bar' },
			});
			assert.strictEqual(res.status, 405);
			assert.strictEqual(res.statusText, 'Method Not Allowed');
			assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), 'https://foo.com');
			assert.strictEqual(res.headers.get('X-Foo'), 'bar');
			assert.ok(res.headers.get('Date'));
		});

		it('should default allowedOrigins to *', () => {
			const res = AllResponse({});
			assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');
		});
	});

	describe('createJsonResponse', () => {
		it('should return a 200 JSON response by default', async () => {
			const data = { foo: 'bar' };
			const res = createJsonResponse(data);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.statusText, 'OK');
			assert.strictEqual(res.headers.get('Content-Type'), 'application/json');
			assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');
			assert.deepStrictEqual(JSON.parse(await res.text()), data);
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
			assert.strictEqual(res.status, 201);
			assert.strictEqual(res.statusText, 'Created');
			assert.strictEqual(res.headers.get('X-Custom'), 'yes');
			assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), 'https://bar.com');
		});
	});

	describe('createTextResponse', () => {
		it('should return a 200 text response by default', async () => {
			const res = createTextResponse('hello world');
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.statusText, 'OK');
			assert.strictEqual(res.headers.get('Content-Type'), 'text/plain');
			assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');
			assert.strictEqual(await res.text(), 'hello world');
		});

		it('should allow custom status and headers', async () => {
			const res = createTextResponse('foo', {
				status: 404,
				statusText: 'Not Found',
				headers: { 'X-Txt': 'bar' },
				allowedOrigins: ['https://baz.com'],
			});
			assert.strictEqual(res.status, 404);
			assert.strictEqual(res.statusText, 'Not Found');
			assert.strictEqual(res.headers.get('X-Txt'), 'bar');
			assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), 'https://baz.com');
		});
	});

	describe('createHtmlResponse', () => {
		it('should return a 200 HTML response by default', async () => {
			const html = '<h1>Test</h1>';
			const res = createHtmlResponse(html);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.statusText, 'OK');
			assert.strictEqual(res.headers.get('Content-Type'), 'text/html');
			assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');
			assert.strictEqual(await res.text(), html);
		});

		it('should allow custom status and headers', async () => {
			const res = createHtmlResponse('<div>foo</div>', {
				status: 500,
				statusText: 'Server Error',
				headers: { 'X-HTML': 'baz' },
				allowedOrigins: ['https://html.com'],
			});
			assert.strictEqual(res.status, 500);
			assert.strictEqual(res.statusText, 'Server Error');
			assert.strictEqual(res.headers.get('X-HTML'), 'baz');
			assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), 'https://html.com');
		});
	});

	describe('createRedirectResponse', () => {
		it('should return a 302 response with Location header', () => {
			const res = createRedirectResponse('https://redirect.com');
			assert.strictEqual(res.status, 302);
			assert.strictEqual(res.statusText, 'Found');
			assert.strictEqual(res.headers.get('Location'), 'https://redirect.com');
			assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');
		});

		it('should allow custom headers and allowedOrigins', () => {
			const res = createRedirectResponse('https://foo.com', {
				headers: { 'X-Redirect': 'yes' },
				allowedOrigins: ['https://bar.com'],
			});
			assert.strictEqual(res.headers.get('X-Redirect'), 'yes');
			assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), 'https://bar.com');
		});
	});
});
