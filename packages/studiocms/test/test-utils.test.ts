import type { AstroIntegration } from 'astro';
import { describe, expect, it, vi } from 'vitest';
import type { StudioCMSPlugin } from '../src/schemas/index.js';
import { StudioCMSPluginTester } from '../src/test-utils.js';

function makePluginWithHooks(hooks: Partial<StudioCMSPlugin['hooks']>): StudioCMSPlugin {
	return {
		identifier: 'test-plugin',
		name: 'Test Plugin',
		studiocmsMinimumVersion: '1.0.0',
		requires: [],
		hooks: hooks as StudioCMSPlugin['hooks'],
	};
}

describe('StudioCMSPluginTester', () => {
	it('getPluginInfo returns correct plugin metadata', () => {
		const plugin = makePluginWithHooks({});
		const tester = new StudioCMSPluginTester(plugin);
		const info = tester.getPluginInfo();
		expect(info).toEqual({
			identifier: 'test-plugin',
			name: 'Test Plugin',
			studiocmsMinimumVersion: '1.0.0',
			requires: [],
		});
	});

	it('getHookResults detects absence of hooks', async () => {
		const plugin = makePluginWithHooks({});
		const tester = new StudioCMSPluginTester(plugin);
		const results = await tester.getHookResults();
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

	it('runAstroConfigHook collects integrations', async () => {
		const integration: AstroIntegration = { name: 'test', hooks: {} };
		const astroConfigHook = vi.fn(async ({ addIntegrations }) => {
			addIntegrations(integration);
		});
		const plugin = makePluginWithHooks({
			'studiocms:astro:config': astroConfigHook,
		});
		const tester = new StudioCMSPluginTester(plugin);
		const results = await tester.getHookResults();
		expect(results.astroConfig.hasHook).toBe(true);
		expect(results.astroConfig.hookResults.integrations).toEqual([integration]);
		expect(astroConfigHook).toHaveBeenCalled();
	});

	it('runStudioCMSConfigHook collects config options', async () => {
		const configHook = vi.fn(async (ctx) => {
			ctx.setAuthService({ oAuthProvider: 'github' });
			ctx.setDashboard({ dashboardGridItems: ['item1'], dashboardPages: ['page1'] });
			ctx.setFrontend({ frontendNavigationLinks: ['link1'] });
			ctx.setImageService({ imageService: 'imgService' });
			ctx.setRendering({ pageTypes: ['type1'] });
			ctx.setSitemap({ sitemaps: ['sitemap1'], triggerSitemap: true });
		});
		const plugin = makePluginWithHooks({
			'studiocms:config:setup': configHook,
		});
		const tester = new StudioCMSPluginTester(plugin);
		const results = await tester.getHookResults();
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

	it('createMockLogger delegates to console and supports fork', () => {
		const plugin = makePluginWithHooks({});
		const tester = new StudioCMSPluginTester(plugin);
		const logger = tester['createMockLogger']();
		expect(typeof logger.info).toBe('function');
		expect(typeof logger.warn).toBe('function');
		expect(typeof logger.error).toBe('function');
		expect(typeof logger.debug).toBe('function');
		const forked = logger.fork('label');
		expect(forked.label).toBe('label');
		expect(typeof forked.info).toBe('function');
	});
});
