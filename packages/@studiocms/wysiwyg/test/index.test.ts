import * as allure from 'allure-js-commons';
import { StudioCMSPluginTester } from 'studiocms/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import wysiwyg from '../src/index';
import type { WYSIWYGSchemaOptions } from '../src/types';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'StudioCMS WYSIWYG Plugin Tests';

describe(parentSuiteName, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('Plugin Creation - Validates Plugin Structure and Options', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Plugin Creation Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should create plugin with correct metadata and structure', async (ctx) => {
			const plugin = wysiwyg();
			await ctx.parameter('pluginIdentifier', plugin.identifier);
			await ctx.parameter('pluginName', plugin.name);
			await ctx.parameter('studiocmsMinimumVersion', plugin.studiocmsMinimumVersion);

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/wysiwyg');
			expect(plugin.name).toBe('StudioCMS WYSIWYG Editor');
			expect(plugin.studiocmsMinimumVersion).toBe('0.1.0-beta.23');
			expect(plugin.hooks).toBeDefined();
		});

		await allure.step('Should create plugin with custom WYSIWYG options', async (ctx) => {
			const options: WYSIWYGSchemaOptions = {
				sanitize: {
					allowElements: ['div', 'h1', 'p'],
					allowAttributes: {
						'*': ['class'],
						a: ['href'],
					},
				},
			};
			const plugin = wysiwyg(options);
			const tester = new StudioCMSPluginTester(plugin);
			const info = tester.getPluginInfo();

			await ctx.parameter('pluginIdentifier', info.identifier);
			await ctx.parameter('pluginName', info.name);

			expect(plugin).toBeDefined();
			expect(info.identifier).toBe('@studiocms/wysiwyg');
		});
	});

	test('Plugin Hook Tests - Validates Hook Implementations', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Plugin Hook Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should have all necessary hooks defined and functioning', async (ctx) => {
			const plugin = wysiwyg();
			const tester = new StudioCMSPluginTester(plugin);
			const results = await tester.getHookResults();

			await ctx.parameter('hasAstroConfigHook', String(results.astroConfig.hasHook));
			await ctx.parameter('hasStudioCMSConfigHook', String(results.studiocmsConfig.hasHook));

			expect(plugin.hooks).toBeDefined();
			expect(results.astroConfig.hasHook).toBe(true);
			expect(results.studiocmsConfig.hasHook).toBe(true);
		});

		await allure.step('Should configure Astro integration correctly', async (ctx) => {
			const plugin = wysiwyg();
			const tester = new StudioCMSPluginTester(plugin);
			const results = await tester.getHookResults();

			await ctx.parameter(
				'astroIntegrationCount',
				String(results.astroConfig.hookResults.integrations.length)
			);

			expect(results.astroConfig.hasHook).toBe(true);
			expect(results.astroConfig.hookResults.integrations).toHaveLength(1);
			expect(results.astroConfig.hookResults.integrations[0]).toEqual(
				expect.objectContaining({
					name: '@studiocms/wysiwyg',
					hooks: {
						'astro:config:setup': expect.any(Function),
						'astro:config:done': expect.any(Function),
					},
				})
			);
		});

		await allure.step('Should set up rendering configuration properly', async (ctx) => {
			const plugin = wysiwyg();
			const tester = new StudioCMSPluginTester(plugin);
			const results = await tester.getHookResults();

			await ctx.parameter(
				'pageTypeCount',
				String(results.studiocmsConfig.hookResults.rendering.pageTypes?.length)
			);

			expect(results.studiocmsConfig.hasHook).toBe(true);
			expect(results.studiocmsConfig.hookResults.rendering).toEqual({
				pageTypes: [
					{
						identifier: 'studiocms/wysiwyg',
						label: 'WYSIWYG',
						rendererComponent: expect.stringContaining('render.js'),
						pageContentComponent: expect.stringContaining('Editor.astro'),
					},
				],
			});
		});
	});
});
