import * as allure from 'allure-js-commons';
import type { PluggableList } from 'unified';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { studiocmsMDX } from '../src/index.js';
import { createMockMDXOptions, parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'studiocmsMDX Plugin Tests';

interface MockAddIntegrationsParams {
	addIntegrations: (integration: unknown) => void;
}

interface MockSetRenderingParams {
	setRendering: (rendering: unknown) => void;
}

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
			const plugin = studiocmsMDX();
			await ctx.parameter('pluginIdentifier', plugin.identifier);
			await ctx.parameter('pluginName', plugin.name);
			await ctx.parameter('studiocmsMinimumVersion', plugin.studiocmsMinimumVersion);

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/mdx');
			expect(plugin.name).toBe('StudioCMS MDX');
			expect(plugin.studiocmsMinimumVersion).toBe('0.1.0-beta.21');
			expect(plugin.requires).toContain('@studiocms/md');
			expect(plugin.hooks).toBeDefined();
		});

		await allure.step('Should create plugin with custom MDX options', async (ctx) => {
			const options = createMockMDXOptions({
				remarkPlugins: [[vi.fn(), {}]],
				rehypePlugins: [[vi.fn(), {}]],
				recmaPlugins: [],
				remarkRehypeOptions: { allowDangerousHtml: true },
			});

			const plugin = studiocmsMDX(options);
			await ctx.parameter('pluginIdentifier', plugin.identifier);
			await ctx.parameter('pluginName', plugin.name);

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/mdx');
			expect(plugin.name).toBe('StudioCMS MDX');
		});
	});

	test('Plugin Hooks - Validates Hook Implementations and Behaviors', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Plugin Hooks Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should have required hooks defined', async (ctx) => {
			const plugin: ReturnType<typeof studiocmsMDX> = studiocmsMDX();

			await ctx.parameter(
				'hasAstroConfigHook',
				String(plugin.hooks['studiocms:astro:config'] !== undefined)
			);
			await ctx.parameter(
				'hasConfigSetupHook',
				String(plugin.hooks['studiocms:config:setup'] !== undefined)
			);

			expect(plugin.hooks['studiocms:astro:config']).toBeDefined();
			expect(typeof plugin.hooks['studiocms:astro:config']).toBe('function');

			expect(plugin.hooks['studiocms:config:setup']).toBeDefined();
			expect(typeof plugin.hooks['studiocms:config:setup']).toBe('function');
		});

		await allure.step('Should execute hooks correctly', async (ctx) => {
			const plugin: ReturnType<typeof studiocmsMDX> = studiocmsMDX();
			const mockAddIntegrations = vi.fn();
			const mockSetRendering = vi.fn();

			// Test 'studiocms:astro-config' hook
			const astroConfigHook = plugin.hooks['studiocms:astro-config'];
			if (!astroConfigHook) throw new Error('Hook not found');
			astroConfigHook({ addIntegrations: mockAddIntegrations } as any);

			await ctx.parameter(
				'astroConfigHookCalled',
				String(mockAddIntegrations.mock.calls.length > 0)
			);
			expect(mockAddIntegrations).toHaveBeenCalledWith({
				name: '@studiocms/mdx',
				hooks: {
					'astro:config:setup': expect.any(Function),
					'astro:config:done': expect.any(Function),
				},
			});

			// Test 'studiocms:config:setup' hook
			const configSetupHook = plugin.hooks['studiocms:rendering'];
			if (!configSetupHook) throw new Error('Hook not found');
			configSetupHook({ setRendering: mockSetRendering } as any);

			await ctx.parameter('configSetupHookCalled', String(mockSetRendering.mock.calls.length > 0));
			expect(mockSetRendering).toHaveBeenCalledWith({
				pageTypes: [
					{
						identifier: 'studiocms/mdx',
						label: 'MDX',
						pageContentComponent: '/mocked/path/./components/editor.astro',
						rendererComponent: '/mocked/path/./components/render.js',
					},
				],
			});
		});

		await allure.step('Should store resolved options in shared context', async (ctx) => {
			const customOptions = createMockMDXOptions({
				remarkPlugins: [['remark-gfm', {}] as any],
				rehypePlugins: [['rehype-highlight', {}] as any],
				recmaPlugins: [],
				remarkRehypeOptions: { allowDangerousHtml: true },
			});

			await ctx.parameter('customOptions', JSON.stringify(customOptions));

			const plugin: ReturnType<typeof studiocmsMDX> = studiocmsMDX(customOptions);
			const mockAddIntegrations = vi.fn();

			const astroConfigHook = plugin.hooks['studiocms:astro-config'];
			if (!astroConfigHook) throw new Error('Hook not found');
			astroConfigHook({ addIntegrations: mockAddIntegrations } as any);

			// Get the integration that was added
			const integrationArg = mockAddIntegrations.mock.calls[0]?.[0];
			if (!integrationArg) throw new Error('Integration not found');

			// Call the astro:config:done hook
			const doneHook = integrationArg.hooks['astro:config:done'];
			doneHook({} as any);

			// Verify the shared context was updated
			const { shared } = await import('../src/lib/shared.js');

			await ctx.parameter('storedMdxConfig', JSON.stringify(shared.mdxConfig));

			expect(shared.mdxConfig).toEqual(customOptions);
		});
	});
});
