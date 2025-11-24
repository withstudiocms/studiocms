import type { AstroIntegration } from 'astro';
import { beforeEach, describe, expect, vi } from 'vitest';
import type { StudioCMSPlugin } from '../src/schemas/index.js';
import { StudioCMSPluginTester } from '../src/test-utils.js';
import { allureTester } from './fixtures/allureTester.js';
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

	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	beforeEach(() => {
		plugin = makePluginWithHooks({});
		tester = new StudioCMSPluginTester(plugin);
	});

	test('PluginTester initializes correctly', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'PluginTester initializes correctly',
			tags: [...sharedTags, 'class:StudioCMSPluginTester', 'method:constructor'],
		});

		await step('Creating StudioCMSPluginTester instance', async (ctx) => {
			await ctx.parameter('pluginIdentifier', plugin.identifier);
			expect(tester).toBeInstanceOf(StudioCMSPluginTester);
			expect(tester['plugin']).toBe(plugin);
		});

		await step('Returns correct plugin info', async (ctx) => {
			const info = tester.getPluginInfo();
			await ctx.parameter('pluginInfo', JSON.stringify(info));
			expect(info).toEqual({
				identifier: 'test-plugin',
				name: 'Test Plugin',
				studiocmsMinimumVersion: '1.0.0',
				requires: [],
			});
		});

		await step('createMockLogger works as expected', async (ctx) => {
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

	test('getHookResults handles no hooks gracefully', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'getHookResults handles no hooks gracefully',
			tags: [...sharedTags, 'class:StudioCMSPluginTester', 'method:getHookResults'],
		});

		await step('Getting hook results with no hooks defined', async (ctx) => {
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

	test('getHookResults runs astro:config hook correctly', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'getHookResults runs astro:config hook correctly',
			tags: [...sharedTags, 'class:StudioCMSPluginTester', 'method:getHookResults'],
		});

		const integration: AstroIntegration = { name: 'test', hooks: {} };
		const astroConfigHook = vi.fn(async ({ addIntegrations }) => {
			addIntegrations(integration);
		});

		plugin = makePluginWithHooks({
			'studiocms:astro-config': astroConfigHook,
		});
		tester = new StudioCMSPluginTester(plugin);

		await step('Getting hook results with astro:config hook defined', async (ctx) => {
			const results = await tester.getHookResults();
			await ctx.parameter('hookResults', JSON.stringify(results));
			expect(results.astroConfig.hasHook).toBe(true);
			expect(results.astroConfig.hookResults.integrations).toEqual([integration]);
			expect(astroConfigHook).toHaveBeenCalled();
		});
	});

	test('getHookResults runs studiocms:config hook correctly', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'getHookResults runs studiocms:config hook correctly',
			tags: [...sharedTags, 'class:StudioCMSPluginTester', 'method:getHookResults'],
		});

		const authConfigHook = vi.fn(async (ctx) => {
			ctx.setAuthService({ oAuthProvider: 'github' });
		});

		const dashboardConfigHook = vi.fn(async (ctx) => {
			ctx.setDashboard({ dashboardGridItems: ['item1'], dashboardPages: ['page1'] });
		});

		const frontendConfigHook = vi.fn(async (ctx) => {
			ctx.setFrontend({ frontendNavigationLinks: ['link1'] });
		});

		const imageConfigHook = vi.fn(async (ctx) => {
			ctx.setImageService({ imageService: 'imgService' });
		});

		const renderingConfigHook = vi.fn(async (ctx) => {
			ctx.setRendering({ pageTypes: ['type1'] });
		});

		const sitemapConfigHook = vi.fn(async (ctx) => {
			ctx.setSitemap({ sitemaps: ['sitemap1'], triggerSitemap: true });
		});

		plugin = makePluginWithHooks({
			'studiocms:auth': authConfigHook,
			'studiocms:dashboard': dashboardConfigHook,
			'studiocms:frontend': frontendConfigHook,
			'studiocms:image-service': imageConfigHook,
			'studiocms:rendering': renderingConfigHook,
			'studiocms:sitemap': sitemapConfigHook,
		});
		tester = new StudioCMSPluginTester(plugin);

		await step('Getting hook results with studiocms:config hook defined', async (ctx) => {
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
		});
	});
});
