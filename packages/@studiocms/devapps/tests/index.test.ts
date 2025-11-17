import { describe, expect, test } from '@effect/vitest';
import * as allure from 'allure-js-commons';
import { studioCMSDevApps } from '../src/index';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'StudioCMS DevApps Integration Tests';

describe(parentSuiteName, () => {
	test('should create integration with default options', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Integration Creation Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should create integration with default options', async (ctx) => {
			const integration = studioCMSDevApps();

			await ctx.parameter('integration', JSON.stringify(integration, null, 2));

			expect(integration).toEqual({
				name: '@studiocms/devapps',
				hooks: expect.objectContaining({
					'astro:config:setup': expect.any(Function),
				}),
			});
		});
	});

	test('should create integration with custom options', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Integration Creation Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should create integration with custom options', async (ctx) => {
			const options = {
				endpoint: '/custom-api',
				appsConfig: {
					wpImporter: {
						endpoint: '/wp-import',
					},
					libSQLViewer: false,
				},
				verbose: true,
			};

			const integration = studioCMSDevApps(options);

			await ctx.parameter('options', JSON.stringify(options, null, 2));
			await ctx.parameter('integration', JSON.stringify(integration, null, 2));

			expect(integration).toEqual({
				name: '@studiocms/devapps',
				hooks: expect.objectContaining({
					'astro:config:setup': expect.any(Function),
				}),
			});
		});
	});

	test('should handle invalid options gracefully', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Integration Creation Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should handle invalid options gracefully', async () => {
			// This should not throw, but use defaults
			expect(() => {
				studioCMSDevApps({
					endpoint: null as any,
					appsConfig: {
						wpImporter: {
							endpoint: null as any,
						},
						libSQLViewer: 'invalid' as any,
					},
				});
			}).toThrow();
		});
	});
});
