import * as allure from 'allure-js-commons';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { shared, symbol } from '../src/lib/shared.js';
import { cleanupGlobalThis, mockGlobalThis, parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Shared Module Tests';

describe(parentSuiteName, () => {
	beforeEach(() => {
		cleanupGlobalThis();
	});

	afterEach(() => {
		cleanupGlobalThis();
	});

	test('Symbol Tests', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Symbol Tests');
		await allure.tags(...sharedTags);

		await allure.step('Symbol should be of type symbol with correct description', async (ctx) => {
			await ctx.parameter('symbolType', typeof symbol);
			await ctx.parameter('symbolDescription', symbol.toString());

			expect(typeof symbol).toBe('symbol');
			expect(symbol.toString()).toBe('Symbol(@studiocms/html)');
		});
	});

	test('Shared Object Tests', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Shared Object Tests');
		await allure.tags(...sharedTags);

		await allure.step('Shared object should be defined', async (ctx) => {
			await ctx.parameter('sharedType', typeof shared);

			expect(shared).toBeDefined();
			expect(typeof shared).toBe('object');
		});

		await allure.step('Shared object should have htmlConfig property', async (ctx) => {
			const hasHtmlConfig = 'htmlConfig' in shared;
			await ctx.parameter('hasHtmlConfig', String(hasHtmlConfig));

			expect(hasHtmlConfig).toBe(true);
		});

		await allure.step('htmlConfig should be initially undefined', async (ctx) => {
			await ctx.parameter('initialHtmlConfig', String(shared.htmlConfig));

			expect(shared.htmlConfig).toBeUndefined();
		});

		await allure.step('Should set and get htmlConfig correctly', async (ctx) => {
			const testConfig = {
				sanitize: {
					allowElements: ['p', 'br', 'strong'],
					allowAttributes: {
						p: ['class'],
					},
				},
			};

			shared.htmlConfig = testConfig;
			await ctx.parameter('setHtmlConfig', JSON.stringify(testConfig, null, 2));
			await ctx.parameter('getHtmlConfig', JSON.stringify(shared.htmlConfig, null, 2));

			expect(shared.htmlConfig).toEqual(testConfig);
		});

		await allure.step('Should clear htmlConfig correctly', async (ctx) => {
			shared.htmlConfig = undefined;
			await ctx.parameter('clearedHtmlConfig', String(shared.htmlConfig));

			expect(shared.htmlConfig).toBeUndefined();
		});
	});

	test('Mocking globalThis', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('globalThis Mocking Tests');
		await allure.tags(...sharedTags);

		await allure.step('Mock globalThis and verify htmlConfig is undefined', async () => {
			mockGlobalThis();

			// The shared object should use the same key as the symbol
			expect((globalThis as Record<symbol, unknown>)[symbol]).toBeDefined();
		});
	});

	test('Handling Multiple Imports', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Multiple Imports Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should have consistent shared object across imports', async (ctx) => {
			const { shared: shared1 } = await import('../src/lib/shared.js');
			const { shared: shared2 } = await import('../src/lib/shared.js');

			await ctx.parameter('shared1HtmlConfig', JSON.stringify(shared1.htmlConfig, null, 2));
			await ctx.parameter('shared2HtmlConfig', JSON.stringify(shared2.htmlConfig, null, 2));

			expect(shared1).toBe(shared2);
			expect(shared1.htmlConfig).toBe(shared2.htmlConfig);
		});
	});
});
