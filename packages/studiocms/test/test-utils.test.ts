import * as allure from 'allure-js-commons';
import type { AstroIntegration } from 'astro';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { StudioCMSPlugin } from '../src/schemas/index.js';
import { StudioCMSPluginTester } from '../src/test-utils.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'StudioCMSPluginTester tests';

function makePluginWithHooks(hooks: Partial<StudioCMSPlugin['hooks']>): StudioCMSPlugin {
	return {
		identifier: 'test-plugin',
		name: 'Test Plugin',
		studiocmsMinimumVersion: '1.0.0',
		requires: [],
		hooks: hooks as StudioCMSPlugin['hooks'],
	};
}

describe(parentSuiteName, () => {
	let plugin: StudioCMSPlugin;
	let tester: StudioCMSPluginTester;

	beforeEach(() => {
		plugin = makePluginWithHooks({});
		tester = new StudioCMSPluginTester(plugin);
	});

	test('PluginTester initializes correctly', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('PluginTester initializes correctly');
		await allure.tags(...sharedTags, 'class:StudioCMSPluginTester', 'method:constructor');

		await allure.step('Creating StudioCMSPluginTester instance', async (ctx) => {
			await ctx.parameter('pluginIdentifier', plugin.identifier);
			expect(tester).toBeInstanceOf(StudioCMSPluginTester);
			expect(tester['plugin']).toBe(plugin);
		});

		await allure.step('Returns correct plugin info', async (ctx) => {
			const info = tester.getPluginInfo();
			await ctx.parameter('pluginInfo', JSON.stringify(info));
			expect(info).toEqual({
				identifier: 'test-plugin',
				name: 'Test Plugin',
				studiocmsMinimumVersion: '1.0.0',
				requires: [],
			});
		});

		await allure.step('createMockLogger works as expected', async (ctx) => {
			const logger = tester['createMockLogger']();
			await ctx.parameter('loggerMethods', 'info, warn, error, debug, fork');
			expect(typeof logger.info).toBe('function');
			expect(typeof logger.warn).toBe('function');
			expect(typeof logger.error).toBe('function');
			expect(typeof logger.debug).toBe('function');
			const forked = logger.fork('label');
			expect(forked.label).toBe('label');
			expect(typeof forked.info).toBe('function');
		});
	});

	test('getHookResults handles no hooks gracefully', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getHookResults handles no hooks gracefully');
		await allure.tags(...sharedTags, 'class:StudioCMSPluginTester', 'method:getHookResults');

		await allure.step('Getting hook results with no hooks defined', async (ctx) => {
			const results = await tester.getHookResults();
			await ctx.parameter('hookResults', JSON.stringify(results));
			expect(results.astroConfig.hasHook).toBe(false);
			expect(results.astroConfig.hookResults.integrations).toEqual([]);
			expect(results.studiocmsConfig.hasHook).toBe(false);
			expect(results.studiocmsConfig.hookResults).toEqual({
				authService: {},
				dashboard: {},
				frontend: {},
				imageService: {},
				rendering: {},
				sitemap: {},
			});
		});
	});

	test('getHookResults runs astro:config hook correctly', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getHookResults runs astro:config hook correctly');
		await allure.tags(...sharedTags, 'class:StudioCMSPluginTester', 'method:getHookResults');

		const integration: AstroIntegration = { name: 'test', hooks: {} };
		const astroConfigHook = vi.fn(async ({ addIntegrations }) => {
			addIntegrations(integration);
		});

		plugin = makePluginWithHooks({
			'studiocms:astro:config': astroConfigHook,
		});
		tester = new StudioCMSPluginTester(plugin);

		await allure.step('Getting hook results with astro:config hook defined', async (ctx) => {
			const results = await tester.getHookResults();
			await ctx.parameter('hookResults', JSON.stringify(results));
			expect(results.astroConfig.hasHook).toBe(true);
			expect(results.astroConfig.hookResults.integrations).toEqual([integration]);
			expect(astroConfigHook).toHaveBeenCalled();
		});
	});

	test('getHookResults runs studiocms:config hook correctly', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getHookResults runs studiocms:config hook correctly');
		await allure.tags(...sharedTags, 'class:StudioCMSPluginTester', 'method:getHookResults');

		const configHook = vi.fn(async (ctx) => {
			ctx.setAuthService({ oAuthProvider: 'github' });
			ctx.setDashboard({ dashboardGridItems: ['item1'], dashboardPages: ['page1'] });
			ctx.setFrontend({ frontendNavigationLinks: ['link1'] });
			ctx.setImageService({ imageService: 'imgService' });
			ctx.setRendering({ pageTypes: ['type1'] });
			ctx.setSitemap({ sitemaps: ['sitemap1'], triggerSitemap: true });
		});

		plugin = makePluginWithHooks({
			'studiocms:config:setup': configHook,
		});
		tester = new StudioCMSPluginTester(plugin);

		await allure.step('Getting hook results with studiocms:config hook defined', async (ctx) => {
			const results = await tester.getHookResults();
			await ctx.parameter('hookResults', JSON.stringify(results));
			expect(results.studiocmsConfig.hasHook).toBe(true);
			expect(results.studiocmsConfig.hookResults).toEqual({
				authService: { oAuthProvider: 'github' },
				dashboard: { dashboardGridItems: ['item1'], dashboardPages: ['page1'] },
				frontend: { frontendNavigationLinks: ['link1'] },
				imageService: { imageService: 'imgService' },
				rendering: { pageTypes: ['type1'] },
				sitemap: { sitemaps: ['sitemap1'], triggerSitemap: true },
			});
			expect(configHook).toHaveBeenCalled();
		});
	});
});
