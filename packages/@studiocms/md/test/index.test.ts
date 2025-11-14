import * as allure from 'allure-js-commons';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { studiocmsMD } from '../src/index.js';
import {
	cleanupGlobalThis,
	createMockAstroMarkdownOptions,
	createMockMarkdownOptions,
	parentSuiteName,
	sharedTags,
} from './test-utils.js';

const localSuiteName = 'studiocmsMD Plugin Tests';

// Mock the dependencies
vi.mock('astro-integration-kit', () => ({
	createResolver: vi.fn(() => ({
		resolve: vi.fn((path: string) => `/mocked/path/${path}`),
	})),
	addVirtualImports: vi.fn(),
}));

vi.mock('studiocms/plugins', () => ({
	definePlugin: vi.fn((config) => config),
}));

describe(parentSuiteName, () => {
	beforeEach(() => {
		vi.clearAllMocks();
		cleanupGlobalThis();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('Plugin Creation - Validates Plugin Structure and Options', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Plugin Creation Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should create plugin with correct metadata and structure', async (ctx) => {
			const plugin = studiocmsMD();
			await ctx.parameter('pluginIdentifier', plugin.identifier);
			await ctx.parameter('pluginName', plugin.name);
			await ctx.parameter('studiocmsMinimumVersion', plugin.studiocmsMinimumVersion);

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/md');
			expect(plugin.name).toBe('StudioCMS Markdown');
			expect(plugin.studiocmsMinimumVersion).toBe('0.1.0-beta.21');
			expect(plugin.hooks).toBeDefined();
		});

		await allure.step('Should create plugin with StudioCMS flavor options', async (ctx) => {
			const options = createMockMarkdownOptions({
				flavor: 'studiocms',
				callouts: 'github',
				autoLinkHeadings: false,
				discordSubtext: false,
			});

			const plugin = studiocmsMD(options);
			await ctx.parameter('pluginIdentifier', plugin.identifier);
			await ctx.parameter('pluginName', plugin.name);

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/md');
			expect(plugin.name).toBe('StudioCMS Markdown');
		});

		await allure.step('Should create plugin with Astro flavor options', async (ctx) => {
			const options = createMockAstroMarkdownOptions({
				flavor: 'astro',
				sanitize: {
					allowElements: ['p', 'br'],
					allowAttributes: {
						p: ['class'],
					},
				},
			});

			const plugin = studiocmsMD(options);
			await ctx.parameter('pluginIdentifier', plugin.identifier);
			await ctx.parameter('pluginName', plugin.name);

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/md');
			expect(plugin.name).toBe('StudioCMS Markdown');
		});

		await allure.step('Should handle StudioCMS flavor with callouts disabled', async (ctx) => {
			const options = createMockMarkdownOptions({
				flavor: 'studiocms',
				callouts: false,
			});

			const plugin = studiocmsMD(options);
			await ctx.parameter('pluginIdentifier', plugin.identifier);

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/md');
		});
	});

	['github' as const, 'obsidian' as const, 'vitepress' as const].forEach((theme) => {
		test(`Should handle StudioCMS flavor with '${theme}' callout theme`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('Plugin Creation Tests');
			await allure.tags(...sharedTags);

			await allure.step(`Creating plugin with callout theme: ${theme}`, async (ctx) => {
				await ctx.parameter('calloutTheme', theme);
				const options = createMockMarkdownOptions({
					flavor: 'studiocms',
					callouts: theme,
				});

				const plugin = studiocmsMD(options);

				expect(plugin).toBeDefined();
				expect(plugin.identifier).toBe('@studiocms/md');
			});
		});
	});

	test('Plugin Hooks - Validates hook definitions', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Plugin Hooks Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should have defined hooks for Astro config and setup', async (ctx) => {
			const plugin = studiocmsMD();
			await ctx.parameter('definedHooks', String(Object.keys(plugin.hooks || {})));

			expect(plugin.hooks).toBeDefined();
			expect(plugin.hooks['studiocms:astro:config']).toBeDefined();
			expect(plugin.hooks['studiocms:config:setup']).toBeDefined();
		});

		await allure.step(
			'Should call studiocms:astro:config hook with addIntegrations',
			async (ctx) => {
				const plugin: ReturnType<typeof studiocmsMD> = studiocmsMD();
				const mockAddIntegrations = vi.fn();

				const hook = plugin.hooks['studiocms:astro:config'];
				if (!hook) throw new Error('Hook not found');
				// @ts-expect-error -- ignore
				hook({ addIntegrations: mockAddIntegrations });

				await ctx.parameter('calledWith', String(mockAddIntegrations.mock.calls[0]?.[0]));

				expect(mockAddIntegrations).toHaveBeenCalledWith({
					name: '@studiocms/md',
					hooks: {
						'astro:config:setup': expect.any(Function),
						'astro:config:done': expect.any(Function),
					},
				});
			}
		);

		await allure.step('Should call studiocms:config:setup hook with setRendering', async (ctx) => {
			const plugin = studiocmsMD();
			const mockSetRendering = vi.fn();

			const hook = plugin.hooks['studiocms:config:setup'] as (...args: unknown[]) => unknown;
			hook({ setRendering: mockSetRendering });

			await ctx.parameter('setRenderingCalls', String(mockSetRendering.mock.calls.length));

			expect(mockSetRendering).toHaveBeenCalledWith({
				pageTypes: [
					{
						identifier: 'studiocms/markdown',
						label: 'Markdown',
						pageContentComponent: '/mocked/path/./components/markdown-editor.astro',
						rendererComponent: '/mocked/path/./components/render.js',
					},
				],
			});
		});

		await allure.step(
			'Should store resolved options in shared context on astro:config:done',
			async (ctx) => {
				const customOptions = {
					flavor: 'studiocms' as const,
					callouts: 'vitepress' as const,
					autoLinkHeadings: false,
					discordSubtext: false,
				};

				const plugin: ReturnType<typeof studiocmsMD> = studiocmsMD(customOptions);
				const mockConfig = { markdown: { remarkPlugins: [] } };
				const mockAddIntegrations = vi.fn();

				const hook = plugin.hooks['studiocms:astro:config'];
				if (!hook) throw new Error('Hook not found');
				// @ts-expect-error -- ignore
				hook({ addIntegrations: mockAddIntegrations });

				// Get the integration that was added
				const integrationArg = mockAddIntegrations.mock.calls[0]?.[0];
				if (!integrationArg) throw new Error('Integration not found');

				// Call the astro:config:done hook
				const doneHook = integrationArg.hooks['astro:config:done'];
				doneHook({ config: mockConfig });

				// Verify the shared context was updated
				const { shared } = await import('../src/lib/shared.js');
				await ctx.parameter('sharedMdConfig', JSON.stringify(shared.mdConfig));
				await ctx.parameter('sharedAstroMDRemark', JSON.stringify(shared.astroMDRemark));

				expect(shared.mdConfig).toEqual(customOptions);
				expect(shared.astroMDRemark).toEqual(mockConfig.markdown);
			}
		);
	});
});
