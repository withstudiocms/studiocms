import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';

import { joinURIAndPath } from '../../src/internal/request.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Request Internal Tests';

describe(parentSuiteName, () => {
	test('joinBaseURIAndPath()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('URI Joining');
		await allure.tags(...sharedTags);

		await allure.step('should join base URI and path segments correctly', async (ctx) => {
			await ctx.parameter('baseUri', 'https://example.com');
			await ctx.parameter('joinedPath', joinURIAndPath('https://example.com', '/hi'));

			expect(joinURIAndPath('https://example.com', '/hi')).toBe('https://example.com/hi');
			expect(joinURIAndPath('https://example.com/', '/hi')).toBe('https://example.com/hi');
			expect(joinURIAndPath('https://example.com/', 'hi')).toBe('https://example.com/hi');
			expect(joinURIAndPath('https://example.com', 'hi')).toBe('https://example.com/hi');
			expect(joinURIAndPath('https://example.com', '/hi/')).toBe('https://example.com/hi/');

			expect(joinURIAndPath('https://example.com', '/hi', '/bye')).toBe(
				'https://example.com/hi/bye'
			);
			expect(joinURIAndPath('https://example.com', 'hi', 'bye')).toBe('https://example.com/hi/bye');
			expect(joinURIAndPath('https://example.com', '/hi/', '/bye/')).toBe(
				'https://example.com/hi/bye/'
			);
		});
	});
});
