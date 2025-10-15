import type { PluggableList } from 'unified';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { studiocmsMDX } from '../src/index.js';
import { createMockMDXOptions } from './test-utils.js';

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

describe('studiocmsMDX', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('plugin creation', () => {
		it('should create a plugin with default options', () => {
			const plugin = studiocmsMDX();

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/mdx');
			expect(plugin.name).toBe('StudioCMS MDX');
			expect(plugin.studiocmsMinimumVersion).toBe('0.1.0-beta.21');
			expect(plugin.hooks).toBeDefined();
		});

		it('should create a plugin with custom options', () => {
			const options = createMockMDXOptions({
				remarkPlugins: [[vi.fn(), {}]],
				rehypePlugins: [[vi.fn(), {}]],
				recmaPlugins: [],
				remarkRehypeOptions: { allowDangerousHtml: true },
			});

			const plugin = studiocmsMDX(options);

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/mdx');
			expect(plugin.name).toBe('StudioCMS MDX');
		});

		it('should handle empty options gracefully', () => {
			const plugin = studiocmsMDX({});

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/mdx');
			expect(plugin.name).toBe('StudioCMS MDX');
		});

		it('should handle undefined options', () => {
			const plugin = studiocmsMDX(undefined);

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/mdx');
			expect(plugin.name).toBe('StudioCMS MDX');
		});
	});

	describe('plugin hooks', () => {
		it('should have studiocms:astro:config hook', () => {
			const plugin = studiocmsMDX();

			expect(plugin.hooks['studiocms:astro:config']).toBeDefined();
			expect(typeof plugin.hooks['studiocms:astro:config']).toBe('function');
		});

		it('should have studiocms:config:setup hook', () => {
			const plugin = studiocmsMDX();

			expect(plugin.hooks['studiocms:config:setup']).toBeDefined();
			expect(typeof plugin.hooks['studiocms:config:setup']).toBe('function');
		});

		it('should call studiocms:astro:config hook with addIntegrations', async () => {
			const plugin: ReturnType<typeof studiocmsMDX> = studiocmsMDX();
			const mockAddIntegrations = vi.fn();

			const hook = plugin.hooks['studiocms:astro:config'];
			if (!hook) throw new Error('Hook not found');
			const params: MockAddIntegrationsParams = { addIntegrations: mockAddIntegrations };
			hook(params as any);

			expect(mockAddIntegrations).toHaveBeenCalledWith({
				name: '@studiocms/mdx',
				hooks: {
					'astro:config:setup': expect.any(Function),
					'astro:config:done': expect.any(Function),
				},
			});
		});

		it('should call studiocms:config:setup hook with setRendering', () => {
			const plugin: ReturnType<typeof studiocmsMDX> = studiocmsMDX();
			const mockSetRendering = vi.fn();

			const hook = plugin.hooks['studiocms:config:setup'];
			if (!hook) throw new Error('Hook not found');
			const params: MockSetRenderingParams = { setRendering: mockSetRendering };
			hook(params as any);

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

		it('should set up virtual imports correctly', async () => {
			const { addVirtualImports } = await import('astro-integration-kit');
			const mockAddVirtualImports = vi.mocked(addVirtualImports);
			const mockAddIntegrations = vi.fn();

			const plugin: ReturnType<typeof studiocmsMDX> = studiocmsMDX();

			const hook = plugin.hooks['studiocms:astro:config'];
			if (!hook) throw new Error('Hook not found');
			hook({ addIntegrations: mockAddIntegrations } as any);

			// Get the integration that was added
			const integrationArg = mockAddIntegrations.mock.calls[0]?.[0];
			if (!integrationArg) throw new Error('Integration not found');

			// Call the astro:config:setup hook
			const setupHook = integrationArg.hooks['astro:config:setup'];
			setupHook({
				addVirtualImports: mockAddVirtualImports,
			} as any);

			expect(mockAddVirtualImports).toHaveBeenCalledWith(expect.any(Object), {
				name: '@studiocms/mdx',
				imports: {
					'studiocms:mdx/renderer': expect.stringContaining('renderMDX'),
				},
			});
		});

		it('should store resolved options in shared context on astro:config:done', async () => {
			const customOptions = createMockMDXOptions({
				remarkPlugins: [['remark-gfm', {}] as any],
				rehypePlugins: [['rehype-highlight', {}] as any],
				recmaPlugins: [],
				remarkRehypeOptions: { allowDangerousHtml: true },
			});

			const plugin: ReturnType<typeof studiocmsMDX> = studiocmsMDX(customOptions);
			const mockAddIntegrations = vi.fn();

			const hook = plugin.hooks['studiocms:astro:config'];
			if (!hook) throw new Error('Hook not found');
			hook({ addIntegrations: mockAddIntegrations } as any);

			// Get the integration that was added
			const integrationArg = mockAddIntegrations.mock.calls[0]?.[0];
			if (!integrationArg) throw new Error('Integration not found');

			// Call the astro:config:done hook
			const doneHook = integrationArg.hooks['astro:config:done'];
			doneHook({} as any);

			// Verify the shared context was updated
			const { shared } = await import('../src/lib/shared.js');
			expect(shared.mdxConfig).toEqual(customOptions);
		});
	});

	describe('default export', () => {
		it('should export the same function as named export', async () => {
			const { default: defaultExport } = await import('../src/index.js');
			expect(defaultExport).toBe(studiocmsMDX);
		});
	});

	describe('plugin requirements', () => {
		it('should require @studiocms/md plugin', () => {
			const plugin = studiocmsMDX();

			expect(plugin.requires).toContain('@studiocms/md');
		});
	});

	describe('plugin configuration', () => {
		it('should have correct package identifier', () => {
			const plugin = studiocmsMDX();

			expect(plugin.identifier).toBe('@studiocms/mdx');
		});

		it('should have correct plugin name', () => {
			const plugin = studiocmsMDX();

			expect(plugin.name).toBe('StudioCMS MDX');
		});

		it('should have correct minimum StudioCMS version', () => {
			const plugin = studiocmsMDX();

			expect(plugin.studiocmsMinimumVersion).toBe('0.1.0-beta.21');
		});
	});

	describe('Edge cases', () => {
		it('should handle plugin options with mixed types', () => {
			const mixedOptions = createMockMDXOptions({
				remarkPlugins: [
					[vi.fn(), {}],
					[vi.fn(), { option: 'value' }],
				],
				rehypePlugins: [[vi.fn(), {}]],
				recmaPlugins: [[vi.fn(), {}]],
				remarkRehypeOptions: { allowDangerousHtml: true, footnoteLabel: 'Notes' },
			});

			const plugin = studiocmsMDX(mixedOptions);

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/mdx');
		});

		it('should handle deeply nested plugin configurations', () => {
			const nestedOptions = createMockMDXOptions({
				remarkPlugins: [
					[
						'remark-plugin',
						{
							options: {
								nested: {
									deep: {
										value: 'test',
									},
								},
							},
						},
					] as any,
				],
				remarkRehypeOptions: {
					allowDangerousHtml: true,
					handlers: {
						paragraph: () => undefined,
					},
				},
			});

			const plugin = studiocmsMDX(nestedOptions);

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/mdx');
		});

		it('should handle plugin with maximum configuration', () => {
			const maxOptions = createMockMDXOptions({
				remarkPlugins: Array(10).fill([vi.fn(), {}]),
				rehypePlugins: Array(10).fill([vi.fn(), {}]),
				recmaPlugins: Array(10).fill([vi.fn(), {}]),
				remarkRehypeOptions: {
					allowDangerousHtml: true,
					footnoteLabel: 'Notes',
					footnoteLabelTagName: 'h2',
					footnoteBackLabel: 'Back to content',
					clobberPrefix: 'user-content-',
					handlers: {},
				},
			});

			const plugin = studiocmsMDX(maxOptions);

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/mdx');
		});

		it('should handle plugin with minimal configuration', () => {
			const minOptions = createMockMDXOptions({
				remarkPlugins: [],
				rehypePlugins: [],
				recmaPlugins: [],
				remarkRehypeOptions: {},
			});

			const plugin = studiocmsMDX(minOptions);

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/mdx');
		});

		it('should handle plugin creation with undefined nested properties', () => {
			const optionsWithUndefined = createMockMDXOptions({
				remarkPlugins: undefined as unknown as PluggableList,
				rehypePlugins: undefined as unknown as PluggableList,
				recmaPlugins: undefined as unknown as PluggableList,
				remarkRehypeOptions: undefined as unknown as Record<string, unknown>,
			});

			const plugin = studiocmsMDX(optionsWithUndefined);

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/mdx');
		});

		it('should handle plugin creation with null nested properties', () => {
			const optionsWithNull = createMockMDXOptions({
				remarkPlugins: null as unknown as PluggableList,
				rehypePlugins: null as unknown as PluggableList,
				recmaPlugins: null as unknown as PluggableList,
				remarkRehypeOptions: null as unknown as Record<string, unknown>,
			});

			const plugin = studiocmsMDX(optionsWithNull);

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/mdx');
		});
	});
});
