/** biome-ignore-all lint/style/noNonNullAssertion: allowed for tests */
import { StudioCMSPluginTester } from 'studiocms/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import blogPlugin from '../src/index.js';

describe('studiocms/blog', () => {
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

	describe('plugin creation', () => {
		it('should create a plugin with default options', () => {
			const pluginInfo = tester.getPluginInfo();
			expect(pluginInfo).toBeDefined();
			expect(pluginInfo.identifier).toBe('@studiocms/blog');
			expect(pluginInfo.name).toBe('StudioCMS Blog');
			expect(pluginInfo.studiocmsMinimumVersion).toBe('0.1.0-beta.21');
			expect(pluginInfo.requires).toContain('@studiocms/md');
		});
	});

	describe('hooks', () => {
		it('should have the correct hooks defined', async () => {
			const hookResults = await tester.getHookResults();

			expect(hookResults.astroConfig).toBeDefined();
			expect(hookResults.studiocmsConfig).toBeDefined();
		});

		it('should add the blog integration in the astro config hook', async () => {
			const hookResults = await tester.getHookResults();

			expect(hookResults.astroConfig.hookResults.integrations.length).toBe(1);

			expect(hookResults.astroConfig.hookResults.integrations[0].name).toBe('@studiocms/blog');
		});

		it('should set frontend navigation, rendering, and sitemap in the config setup hook', async () => {
			const hookResults = await tester.getHookResults();

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
			expect(hookResults.studiocmsConfig.hookResults.sitemap.sitemaps![1].pluginName).toBe('pages');
		});
	});
});
