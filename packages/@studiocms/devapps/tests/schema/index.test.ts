import { describe, expect, test } from '@effect/vitest';
import * as allure from 'allure-js-commons';
import { AppsConfigSchema, StudioCMSDevAppsSchema } from '../../src/schema/index';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Schema Validation Tests';

describe(parentSuiteName, () => {
	[
		{
			input: {
				libSQLViewer: true,
				wpImporter: { endpoint: 'https://example.com/wp-json/wp/v2' },
			},
			expected: {
				libSQLViewer: { enabled: true, endpoint: 'outerbase' },
				wpImporter: { enabled: true, endpoint: 'https://example.com/wp-json/wp/v2' },
			},
		},
		{
			input: {
				libSQLViewer: false,
				wpImporter: true,
			},
			expected: {
				libSQLViewer: { enabled: false, endpoint: 'outerbase' },
				wpImporter: { enabled: true, endpoint: 'wp-api-importer' },
			},
		},
		{
			input: {
				libSQLViewer: { endpoint: 'https://example.com/api' },
				wpImporter: { endpoint: 'https://example.com/wp-json/wp/v2' },
			},
			expected: {
				libSQLViewer: { enabled: true, endpoint: 'https://example.com/api' },
				wpImporter: { enabled: true, endpoint: 'https://example.com/wp-json/wp/v2' },
			},
		},
		{
			input: undefined,
			expected: {
				libSQLViewer: { enabled: true, endpoint: 'outerbase' },
				wpImporter: { enabled: true, endpoint: 'wp-api-importer' },
			},
		},
	].forEach(({ input, expected }) => {
		test(`AppsConfigSchema should parse config: ${JSON.stringify(input)}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('AppsConfigSchema Tests');
			await allure.tags(...sharedTags);

			await allure.step(
				`AppsConfigSchema should parse config: ${JSON.stringify(input)}`,
				async (ctx) => {
					const result = AppsConfigSchema.parse(input);

					await ctx.parameter('input', JSON.stringify(input, null, 2));
					await ctx.parameter('result', JSON.stringify(result, null, 2));

					expect(result).toEqual(expected);
				}
			);
		});
	});

	[
		{
			input: {
				libSQLViewer: 'invalid',
				wpImporter: true,
			},
		},
		{
			input: {
				libSQLViewer: true,
				wpImporter: 123,
			},
		},
	].forEach(({ input }) => {
		test(`AppsConfigSchema should reject invalid config: ${JSON.stringify(input)}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('AppsConfigSchema Tests');
			await allure.tags(...sharedTags);

			await allure.step(
				`AppsConfigSchema should reject invalid config: ${JSON.stringify(input)}`,
				async (ctx) => {
					let threw = false;
					try {
						AppsConfigSchema.parse(input);
					} catch (e) {
						threw = true;
					}

					await ctx.parameter('input', JSON.stringify(input, null, 2));
					await ctx.parameter('threw', String(threw));

					expect(threw).toBe(true);
				}
			);
		});
	});

	[
		{
			input: {
				endpoint: 'https://example.com',
				verbose: true,
				appsConfig: {
					libSQLViewer: true,
					wpImporter: { endpoint: 'https://example.com/wp-json/wp/v2' },
				},
			},
			expected: {
				endpoint: 'https://example.com',
				verbose: true,
				appsConfig: {
					libSQLViewer: { enabled: true, endpoint: 'outerbase' },
					wpImporter: { enabled: true, endpoint: 'https://example.com/wp-json/wp/v2' },
				},
			},
		},
		{
			input: undefined,
			expected: {
				endpoint: '_studiocms-devapps',
				verbose: false,
				appsConfig: {
					libSQLViewer: { enabled: true, endpoint: 'outerbase' },
					wpImporter: { enabled: true, endpoint: 'wp-api-importer' },
				},
			},
		},
		{
			input: {
				endpoint: 'custom-endpoint',
			},
			expected: {
				endpoint: 'custom-endpoint',
				verbose: false,
				appsConfig: {
					libSQLViewer: { enabled: true, endpoint: 'outerbase' },
					wpImporter: { enabled: true, endpoint: 'wp-api-importer' },
				},
			},
		},
	].forEach(({ input, expected }) => {
		test(`StudioCMSDevAppsSchema should parse config: ${JSON.stringify(input)}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('StudioCMSDevAppsSchema Tests');
			await allure.tags(...sharedTags);

			await allure.step(
				`StudioCMSDevAppsSchema should parse config: ${JSON.stringify(input)}`,
				async (ctx) => {
					const result = StudioCMSDevAppsSchema.parse(input);

					await ctx.parameter('input', JSON.stringify(input, null, 2));
					await ctx.parameter('result', JSON.stringify(result, null, 2));
					expect(result).toEqual(expected);
				}
			);
		});
	});

	[
		{
			input: {
				endpoint: 123,
			},
		},
		{
			input: {
				verbose: 'invalid',
			},
		},
	].forEach(({ input }) => {
		test(`StudioCMSDevAppsSchema should reject invalid config: ${JSON.stringify(
			input
		)}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('StudioCMSDevAppsSchema Tests');
			await allure.tags(...sharedTags);

			await allure.step(
				`StudioCMSDevAppsSchema should reject invalid config: ${JSON.stringify(input)}`,
				async (ctx) => {
					let threw = false;
					try {
						StudioCMSDevAppsSchema.parse(input);
					} catch (e) {
						threw = true;
					}

					await ctx.parameter('input', JSON.stringify(input, null, 2));
					await ctx.parameter('threw', String(threw));

					expect(threw).toBe(true);
				}
			);
		});
	});
});
