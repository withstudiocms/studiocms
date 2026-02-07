import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	AllResponse,
	createHtmlResponse,
	createJsonResponse,
	createRedirectResponse,
	createTextResponse,
	OptionsResponse,
} from '../../src/astro/response-helpers.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Response Helpers Tests';

describe(parentSuiteName, () => {
	test('Response Helpers - OptionsResponse', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('OptionsResponse Tests');
		await allure.tags(...sharedTags);

		await allure.step('Testing OptionsResponse with custom methods and origins', async (ctx) => {
			const res = OptionsResponse({
				allowedMethods: ['GET', 'POST'],
				allowedOrigins: ['https://example.com'],
				headers: { 'X-Test': 'test' },
			});
			await ctx.parameter('Status', String(res.status));
			await ctx.parameter('Allowed Methods', res.headers.get('Allow') || '');
			await ctx.parameter('Allowed Origins', res.headers.get('Access-Control-Allow-Origin') || '');

			expect(res.status).toBe(204);
			expect(res.headers.get('Allow')).toBe('OPTIONS, GET, POST');
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
			expect(res.headers.get('X-Test')).toBe('test');
		});

		await allure.step('Testing OptionsResponse with default origins', async (ctx) => {
			const res = OptionsResponse({
				allowedMethods: ['GET'],
			});
			await ctx.parameter('Status', String(res.status));
			await ctx.parameter('Allowed Origins', res.headers.get('Access-Control-Allow-Origin') || '');

			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
		});
	});

	test('Response Helpers - AllResponse', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('AllResponse Tests');
		await allure.tags(...sharedTags);

		await allure.step('Testing AllResponse with custom headers and origins', async (ctx) => {
			const res = AllResponse({
				allowedOrigins: ['https://foo.com'],
				headers: { 'X-Foo': 'bar' },
			});
			await ctx.parameter('Status', String(res.status));
			await ctx.parameter('Allowed Origins', res.headers.get('Access-Control-Allow-Origin') || '');

			expect(res.status).toBe(405);
			expect(res.statusText).toBe('Method Not Allowed');
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://foo.com');
			expect(res.headers.get('X-Foo')).toBe('bar');
		});

		await allure.step('Testing AllResponse with default origins', async (ctx) => {
			const res = AllResponse({});
			await ctx.parameter('Status', String(res.status));
			await ctx.parameter('Allowed Origins', res.headers.get('Access-Control-Allow-Origin') || '');

			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
		});
	});

	test('Response Helpers - createJsonResponse', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('createJsonResponse Tests');
		await allure.tags(...sharedTags);

		await allure.step('Creating JSON response with default options', async (ctx) => {
			const data = { message: 'Hello, World!' };
			const res = createJsonResponse(data);
			await ctx.parameter('Status', String(res.status));
			await ctx.parameter('Content-Type', res.headers.get('Content-Type') || '');

			expect(res.status).toBe(200);
			expect(res.headers.get('Content-Type')).toBe('application/json');
			expect(await res.json()).toEqual(data);
		});

		await allure.step('Creating JSON response with custom options', async (ctx) => {
			const data = { success: true };
			const res = createJsonResponse(data, {
				status: 201,
				statusText: 'Created',
				headers: { 'X-Custom-Header': 'CustomValue' },
				allowedOrigins: ['https://custom.com'],
			});
			await ctx.parameter('Status', String(res.status));
			await ctx.parameter('Status Text', res.statusText);
			await ctx.parameter('X-Custom-Header', res.headers.get('X-Custom-Header') || '');
			await ctx.parameter(
				'Access-Control-Allow-Origin',
				res.headers.get('Access-Control-Allow-Origin') || ''
			);

			expect(res.status).toBe(201);
			expect(res.statusText).toBe('Created');
			expect(res.headers.get('X-Custom-Header')).toBe('CustomValue');
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://custom.com');
			expect(await res.json()).toEqual(data);
		});
	});

	test('Response Helpers - createTextResponse', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('createTextResponse Tests');
		await allure.tags(...sharedTags);

		await allure.step('Creating Text response with default options', async (ctx) => {
			const text = 'Hello, Text Response!';
			const res = createTextResponse(text);
			await ctx.parameter('Status', String(res.status));
			await ctx.parameter('Content-Type', res.headers.get('Content-Type') || '');

			expect(res.status).toBe(200);
			expect(res.headers.get('Content-Type')).toBe('text/plain');
			expect(await res.text()).toBe(text);
		});

		await allure.step('Creating Text response with custom options', async (ctx) => {
			const text = 'Custom Text Response';
			const res = createTextResponse(text, {
				status: 202,
				statusText: 'Accepted',
				headers: { 'X-Text-Header': 'TextValue' },
				allowedOrigins: ['https://text.com'],
			});
			await ctx.parameter('Status', String(res.status));
			await ctx.parameter('Status Text', res.statusText);
			await ctx.parameter('X-Text-Header', res.headers.get('X-Text-Header') || '');
			await ctx.parameter(
				'Access-Control-Allow-Origin',
				res.headers.get('Access-Control-Allow-Origin') || ''
			);

			expect(res.status).toBe(202);
			expect(res.statusText).toBe('Accepted');
			expect(res.headers.get('X-Text-Header')).toBe('TextValue');
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://text.com');
			expect(await res.text()).toBe(text);
		});
	});

	test('Response Helpers - createHtmlResponse', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('createHtmlResponse Tests');
		await allure.tags(...sharedTags);

		await allure.step('Creating HTML response with default options', async (ctx) => {
			const html = '<h1>Hello, HTML Response!</h1>';
			const res = createHtmlResponse(html);
			await ctx.parameter('Status', String(res.status));
			await ctx.parameter('Content-Type', res.headers.get('Content-Type') || '');

			expect(res.status).toBe(200);
			expect(res.headers.get('Content-Type')).toBe('text/html');
			expect(await res.text()).toBe(html);
		});

		await allure.step('Creating HTML response with custom options', async (ctx) => {
			const html = '<p>Custom HTML Response</p>';
			const res = createHtmlResponse(html, {
				status: 203,
				statusText: 'Non-Authoritative Information',
				headers: { 'X-HTML-Header': 'HTMLValue' },
				allowedOrigins: ['https://html.com'],
			});
			await ctx.parameter('Status', String(res.status));
			await ctx.parameter('Status Text', res.statusText);
			await ctx.parameter('X-HTML-Header', res.headers.get('X-HTML-Header') || '');
			await ctx.parameter(
				'Access-Control-Allow-Origin',
				res.headers.get('Access-Control-Allow-Origin') || ''
			);

			expect(res.status).toBe(203);
			expect(res.statusText).toBe('Non-Authoritative Information');
			expect(res.headers.get('X-HTML-Header')).toBe('HTMLValue');
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://html.com');
			expect(await res.text()).toBe(html);
		});
	});

	test('Response Helpers - createRedirectResponse', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('createRedirectResponse Tests');
		await allure.tags(...sharedTags);

		await allure.step('Creating Redirect response with default options', async (ctx) => {
			const res = createRedirectResponse('https://redirect.com');
			await ctx.parameter('Status', String(res.status));
			await ctx.parameter('Location', res.headers.get('Location') || '');

			expect(res.status).toBe(302);
			expect(res.statusText).toBe('Found');
			expect(res.headers.get('Location')).toBe('https://redirect.com');
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
		});

		await allure.step(
			'Creating Redirect response with custom headers and allowedOrigins',
			async (ctx) => {
				const res = createRedirectResponse('https://foo.com', {
					headers: { 'X-Redirect': 'yes' },
					allowedOrigins: ['https://bar.com'],
				});
				await ctx.parameter('X-Redirect', res.headers.get('X-Redirect') || '');
				await ctx.parameter(
					'Access-Control-Allow-Origin',
					res.headers.get('Access-Control-Allow-Origin') || ''
				);

				expect(res.headers.get('X-Redirect')).toBe('yes');
				expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://bar.com');
			}
		);
	});
});
