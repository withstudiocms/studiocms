/** biome-ignore-all lint/style/noNonNullAssertion: allowed for tests */
import * as allure from 'allure-js-commons';
import { StudioCMSPluginTester } from 'studiocms/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import blogPlugin from '../src/index.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Blog Plugin Tests';

describe(localSuiteName, () => {
	let tester: StudioCMSPluginTester;
	let plugin: ReturnType<typeof blogPlugin>;

	beforeEach(() => {
		vi.clearAllMocks();
		plugin = blogPlugin();
		tester = new StudioCMSPluginTester(plugin);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('Plugin Creation - Validates Plugin Structure', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Plugin Creation Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should create plugin with correct metadata and structure', async (ctx) => {
			const pluginInfo = tester.getPluginInfo();

			await ctx.parameter('pluginInfo', JSON.stringify(pluginInfo, null, 2));

			expect(pluginInfo).toBeDefined();
			expect(pluginInfo.identifier).toBe('@studiocms/blog');
			expect(pluginInfo.name).toBe('StudioCMS Blog');
			expect(pluginInfo.studiocmsMinimumVersion).toBe('0.1.0-beta.21');
			expect(pluginInfo.requires).toContain('@studiocms/md');
		});

		await allure.step(
			'Should export default function returning valid plugin object',
			async (ctx) => {
				await ctx.parameter('functionType', typeof blogPlugin);
				await ctx.parameter('functionName', blogPlugin.name);

				expect(typeof blogPlugin).toBe('function');
				expect(blogPlugin.name).toBe('studioCMSBlogPlugin');
			}
		);

		await allure.step('Should return a valid StudioCMSPlugin object', async (ctx) => {
			await ctx.parameter('pluginIdentifier', plugin.identifier);
			await ctx.parameter('pluginName', plugin.name);
			await ctx.parameter('hasHooks', String(plugin.hooks !== undefined));

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/blog');
			expect(plugin.name).toBe('StudioCMS Blog');
			expect(plugin.hooks).toBeDefined();
		});
	});

	test('Plugin Hooks - Validates Hook Functionality', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Plugin Hooks Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should have the correct hooks defined', async (ctx) => {
			const hookResults = await tester.getHookResults();

			await ctx.parameter('hookResults', JSON.stringify(hookResults, null, 2));

			expect(hookResults.astroConfig).toBeDefined();
			expect(hookResults.studiocmsConfig).toBeDefined();
		});

		await allure.step('Should add the blog integration in the astro config hook', async (ctx) => {
			const hookResults = await tester.getHookResults();

			await ctx.parameter(
				'integrations',
				JSON.stringify(hookResults.astroConfig.hookResults.integrations, null, 2)
			);

			expect(hookResults.astroConfig.hookResults.integrations.length).toBe(1);

			expect(hookResults.astroConfig.hookResults.integrations[0].name).toBe('@studiocms/blog');
		});

		await allure.step(
			'Should set frontend navigation, rendering, and sitemap in the config setup hook',
			async (ctx) => {
				const hookResults = await tester.getHookResults();

				await ctx.parameter(
					'frontendNavigationLinks',
					JSON.stringify(
						hookResults.studiocmsConfig.hookResults.frontend.frontendNavigationLinks,
						null,
						2
					)
				);
				await ctx.parameter(
					'pageTypes',
					JSON.stringify(hookResults.studiocmsConfig.hookResults.rendering.pageTypes, null, 2)
				);
				await ctx.parameter(
					'sitemap',
					JSON.stringify(hookResults.studiocmsConfig.hookResults.sitemap, null, 2)
				);

				// Check frontend navigation links
				expect(hookResults.studiocmsConfig.hookResults.frontend.frontendNavigationLinks).toEqual([
					{ label: 'Blog', href: '/blog' },
				]);

				// Check rendering page types
				expect(hookResults.studiocmsConfig.hookResults.rendering.pageTypes).toHaveLength(1);
				expect(hookResults.studiocmsConfig.hookResults.rendering.pageTypes![0].identifier).toBe(
					'@studiocms/blog'
				);
				expect(hookResults.studiocmsConfig.hookResults.rendering.pageTypes![0].label).toBe(
					'Blog Post (StudioCMS Blog)'
				);

				// Check sitemap configuration
				expect(hookResults.studiocmsConfig.hookResults.sitemap.triggerSitemap).toBe(true);
				expect(hookResults.studiocmsConfig.hookResults.sitemap.sitemaps).toHaveLength(2);
				expect(hookResults.studiocmsConfig.hookResults.sitemap.sitemaps![0].pluginName).toBe(
					'@studiocms/blog'
				);
				expect(hookResults.studiocmsConfig.hookResults.sitemap.sitemaps![1].pluginName).toBe(
					'pages'
				);
			}
		);
	});
});
