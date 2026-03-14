import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'WYSIWYG Grapes CSS Route Tests';

describe(parentSuiteName, () => {
	test('WYSIWYG Grapes CSS Route Tests', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Grapes CSS Route Tests');
		await allure.tags(...sharedTags);

		const { ALL } = await import('../../src/routes/grapes.css');

		await allure.step('Should serve CSS content with correct headers', async (ctx) => {
			const response = await ALL();

			await ctx.parameter('status', String(response.status));
			await ctx.parameter('Content-Type', String(response.headers.get('Content-Type')));
			await ctx.parameter(
				'Access-Control-Allow-Origin',
				String(response.headers.get('Access-Control-Allow-Origin'))
			);
			await ctx.parameter(
				'Access-Control-Allow-Methods',
				String(response.headers.get('Access-Control-Allow-Methods'))
			);

			expect(response).toBeInstanceOf(Response);
			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('text/css');
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
			expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, HEAD, OPTIONS');
		});

		await allure.step('Should return non-empty CSS content', async (ctx) => {
			const response = await ALL();
			const cssContent = await response.text();

			await ctx.parameter('cssContentLength', String(cssContent.length));

			expect(response).toBeInstanceOf(Response);
			expect(typeof cssContent).toBe('string');
		});

		await allure.step('handles multiple requests consistently', async (ctx) => {
			const response1 = await ALL();
			const response2 = await ALL();

			await ctx.parameter('response1Status', String(response1.status));
			await ctx.parameter('response2Status', String(response2.status));
			await ctx.parameter('response1ContentType', String(response1.headers.get('Content-Type')));
			await ctx.parameter('response2ContentType', String(response2.headers.get('Content-Type')));

			expect(response1.status).toBe(200);
			expect(response2.status).toBe(200);
			expect(response1.headers.get('Content-Type')).toBe('text/css');
			expect(response2.headers.get('Content-Type')).toBe('text/css');
		});
	});
});
