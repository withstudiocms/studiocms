import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { FrontEndConfigSchema, faviconTypeMap, isFaviconExt } from '../src/types';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Type Definitions Tests';

describe(parentSuiteName, () => {
	[
		{
			key: 'htmlDefaultLanguage',
			expectedType: 'string',
			expectedDefault: 'en',
		},
		{
			key: 'favicon',
			expectedType: 'string',
			expectedDefault: '/favicon.svg',
		},
		{
			key: 'sitemap',
			expectedType: 'boolean',
			expectedDefault: true,
		},
		{
			key: 'injectRoutes',
			expectedType: 'boolean',
			expectedDefault: true,
		},
		{
			key: 'blog.title',
			expectedType: 'string',
			expectedDefault: 'Blog',
		},
		{
			key: 'blog.enableRSS',
			expectedType: 'boolean',
			expectedDefault: true,
		},
		{
			key: 'blog.route',
			expectedType: 'string',
			expectedDefault: '/blog',
		},
	].forEach(({ key, expectedType, expectedDefault }) => {
		test(`should have correct type and default for ${key}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('FrontEndConfigSchema Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('Schema input', JSON.stringify({}));

			const parsed = FrontEndConfigSchema.parse({});

			await allure.parameter('Parsed Config', JSON.stringify(parsed, null, 2));

			await allure.step(`Validating key: ${key}`, async (ctx) => {
				const value = key.split('.').reduce((obj, k) => obj[k], parsed as any);
				await ctx.parameter('Value', JSON.stringify(value));
				await ctx.parameter('Expected Type', expectedType);
				await ctx.parameter('Expected Default', JSON.stringify(expectedDefault));
				expect(typeof value).toBe(expectedType);
				expect(value).toBe(expectedDefault);
			});
		});
	});

	[
		'/favicon.ico',
		'/favicon.gif',
		'/favicon.jpg',
		'/favicon.jpeg',
		'/favicon.png',
		'/favicon.svg',
	].forEach((fav) => {
		test(`should accept valid favicon extension: ${fav}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('FrontEndConfigSchema Favicon Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('Favicon Input', fav);

			await allure.step(`Validating favicon: ${fav}`, async () => {
				expect(() => FrontEndConfigSchema.parse({ favicon: fav })).not.toThrow();
			});
		});
	});

	['/favicon.bmp', '/favicon.webp', '/favicon.txt'].forEach((fav) => {
		test(`should reject invalid favicon extension: ${fav}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('FrontEndConfigSchema Favicon Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('Favicon Input', fav);

			await allure.step(`Validating favicon: ${fav}`, async () => {
				expect(() => FrontEndConfigSchema.parse({ favicon: fav })).toThrow(
					/favicon must be a .ico, .gif, .jpg, .png, or .svg file/
				);
			});
		});
	});

	[
		{
			input: { blog: { title: 'News', enableRSS: false, route: '/news' } },
			expected: { blog: { title: 'News', enableRSS: false, route: '/news' } },
		},
		{
			input: { blog: { title: 'Updates' } },
			expected: { blog: { title: 'Updates', enableRSS: true, route: '/blog' } },
		},
		{
			input: { htmlDefaultLanguage: 'fr', sitemap: false, injectRoutes: false },
			expected: {
				htmlDefaultLanguage: 'fr',
				sitemap: false,
				injectRoutes: false,
			},
		},
	].forEach(({ input, expected }) => {
		test('should correctly parse custom config', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('FrontEndConfigSchema Custom Config Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('Config Input', JSON.stringify(input, null, 2));

			const parsed = FrontEndConfigSchema.parse(input);

			await allure.parameter('Parsed Config', JSON.stringify(parsed, null, 2));

			await allure.step('Validating parsed config', async (ctx) => {
				for (const [key, value] of Object.entries(expected)) {
					const parsedValue = parsed[key as keyof typeof parsed];
					await ctx.parameter(
						`Key: ${key}`,
						`Expected: ${JSON.stringify(value)}, Parsed: ${JSON.stringify(parsedValue)}`
					);
					expect(parsedValue).toEqual(value);
				}
			});
		});
	});

	Object.keys(faviconTypeMap).forEach((ext) => {
		test('isFaviconExt should return true for valid extension', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('isFaviconExt Function Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('Extension Input', ext);

			await allure.step(`Validating extension: ${ext}`, async (ctx) => {
				const result = isFaviconExt(ext);
				await ctx.parameter('Result', String(result));
				expect(result).toBe(true);
			});
		});
	});

	['.bmp', '.webp', '', '.ICO', '.JPG'].forEach((ext) => {
		test('isFaviconExt should return false for invalid extension', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('isFaviconExt Function Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('Extension Input', ext);

			await allure.step(`Validating extension: ${ext}`, async (ctx) => {
				const result = isFaviconExt(ext);
				await ctx.parameter('Result', String(result));
				expect(result).toBe(false);
			});
		});
	});
});
