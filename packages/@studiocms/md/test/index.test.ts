import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { studiocmsMD } from '../src/index.js';
import { cleanupGlobalThis, createMockAstroMarkdownOptions, createMockMarkdownOptions } from './test-utils.js';

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

describe('studiocmsMD', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		cleanupGlobalThis();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('plugin creation', () => {
		it('should create a plugin with default options', () => {
			const plugin = studiocmsMD();

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/md');
			expect(plugin.name).toBe('StudioCMS Markdown');
			expect(plugin.studiocmsMinimumVersion).toBe('0.1.0-beta.21');
			expect(plugin.hooks).toBeDefined();
		});

		it('should create a plugin with StudioCMS flavor options', () => {
			const options = createMockMarkdownOptions({
				flavor: 'studiocms',
				callouts: 'github',
				autoLinkHeadings: false,
				discordSubtext: false,
			});

			const plugin = studiocmsMD(options);

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/md');
			expect(plugin.name).toBe('StudioCMS Markdown');
		});

		it('should create a plugin with Astro flavor options', () => {
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

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/md');
			expect(plugin.name).toBe('StudioCMS Markdown');
		});

		it('should throw error for invalid options', () => {
			const invalidOptions = {
				flavor: 'invalid-flavor', // This should cause schema validation to fail
			};

			// The function should throw an error when schema validation fails
			expect(() => studiocmsMD(invalidOptions as never)).toThrow(/Invalid markdown options/);
		});

		it('should handle unknown properties gracefully', () => {
			const optionsWithUnknownProperties = {
				flavor: 'studiocms',
				callouts: 'obsidian',
				unknownProperty: 'should be ignored',
			};

			// The function should handle unknown properties without throwing
			// since the schema validation strips unknown properties and uses defaults
			expect(() => studiocmsMD(optionsWithUnknownProperties as never)).not.toThrow();
		});

		it('should handle StudioCMS flavor with callouts disabled', () => {
			const options = createMockMarkdownOptions({
				flavor: 'studiocms',
				callouts: false,
			});

			const plugin = studiocmsMD(options);

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/md');
		});

		it('should handle StudioCMS flavor with different callout themes', () => {
			const themes = ['github', 'obsidian', 'vitepress'] as const;
			
			themes.forEach(theme => {
				const options = createMockMarkdownOptions({
					flavor: 'studiocms',
					callouts: theme,
				});

				const plugin = studiocmsMD(options);
				expect(plugin).toBeDefined();
			});
		});
	});

	describe('plugin hooks', () => {
		it('should have studiocms:astro:config hook', () => {
			const plugin = studiocmsMD();

			expect(plugin.hooks['studiocms:astro:config']).toBeDefined();
			expect(typeof plugin.hooks['studiocms:astro:config']).toBe('function');
		});

		it('should have studiocms:config:setup hook', () => {
			const plugin = studiocmsMD();

			expect(plugin.hooks['studiocms:config:setup']).toBeDefined();
			expect(typeof plugin.hooks['studiocms:config:setup']).toBe('function');
		});

		it('should call studiocms:astro:config hook with addIntegrations', async () => {
			const plugin: ReturnType<typeof studiocmsMD> = studiocmsMD();
			const mockAddIntegrations = vi.fn();

			const hook = plugin.hooks['studiocms:astro:config'];
			if (!hook) throw new Error('Hook not found');
			hook({ addIntegrations: mockAddIntegrations });

			expect(mockAddIntegrations).toHaveBeenCalledWith({
				name: '@studiocms/md',
				hooks: {
					'astro:config:setup': expect.any(Function),
					'astro:config:done': expect.any(Function),
				},
			});
		});

		it('should call studiocms:config:setup hook with setRendering', () => {
			const plugin = studiocmsMD();
			const mockSetRendering = vi.fn();

			const hook = plugin.hooks['studiocms:config:setup'] as (...args: unknown[]) => unknown;
			hook({ setRendering: mockSetRendering });

			expect(mockSetRendering).toHaveBeenCalledWith({
				pageTypes: [
					{
						identifier: 'studiocms/markdown',
						label: 'Markdown',
						pageContentComponent: '/mocked/path/./components/markdown-editor.astro',
						rendererComponent: '/mocked/path/./components/markdown-render.astro',
					},
				],
			});
		});

		it('should set up virtual imports correctly for StudioCMS flavor', async () => {
			const { addVirtualImports } = await import('astro-integration-kit');
			const mockAddVirtualImports = vi.mocked(addVirtualImports);
			const mockInjectScript = vi.fn();
			const mockAddIntegrations = vi.fn();

			const plugin: ReturnType<typeof studiocmsMD> = studiocmsMD({
				flavor: 'studiocms',
				callouts: 'github',
			});

			const hook = plugin.hooks['studiocms:astro:config'];
			if (!hook) throw new Error('Hook not found');
			hook({ addIntegrations: mockAddIntegrations });

			// Get the integration that was added
			const integrationArg = mockAddIntegrations.mock.calls[0]?.[0];
			if (!integrationArg) throw new Error('Integration not found');

			// Call the astro:config:setup hook
			const setupHook = integrationArg.hooks['astro:config:setup'];
			setupHook({
				addVirtualImports: mockAddVirtualImports,
				injectScript: mockInjectScript,
			});

			expect(mockAddVirtualImports).toHaveBeenCalledWith(
				expect.any(Object),
				{
					name: '@studiocms/md',
					imports: {
						'studiocms:md/config': expect.stringContaining('"flavor":"studiocms"'),
						'studiocms:md/pre-render': expect.stringContaining('markdown-prerender'),
						'studiocms:md/styles': expect.stringContaining('md-remark-headings.css'),
					},
				}
			);

			expect(mockInjectScript).toHaveBeenCalledWith('page-ssr', 'import "studiocms:md/styles";');
		});

		it('should set up virtual imports correctly for Astro flavor without script injection', async () => {
			const { addVirtualImports } = await import('astro-integration-kit');
			const mockAddVirtualImports = vi.mocked(addVirtualImports);
			const mockInjectScript = vi.fn();
			const mockAddIntegrations = vi.fn();

			const plugin: ReturnType<typeof studiocmsMD> = studiocmsMD({
				flavor: 'astro',
			});

			const hook = plugin.hooks['studiocms:astro:config'];
			if (!hook) throw new Error('Hook not found');
			hook({ addIntegrations: mockAddIntegrations });

			// Get the integration that was added
			const integrationArg = mockAddIntegrations.mock.calls[0]?.[0];
			if (!integrationArg) throw new Error('Integration not found');

			// Call the astro:config:setup hook
			const setupHook = integrationArg.hooks['astro:config:setup'];
			setupHook({
				addVirtualImports: mockAddVirtualImports,
				injectScript: mockInjectScript,
			});

			expect(mockAddVirtualImports).toHaveBeenCalledWith(
				expect.any(Object),
				{
					name: '@studiocms/md',
					imports: {
						'studiocms:md/config': expect.stringContaining('"flavor":"astro"'),
						'studiocms:md/pre-render': expect.stringContaining('markdown-prerender'),
						'studiocms:md/styles': expect.stringContaining('md-remark-headings.css'),
					},
				}
			);

			// Should not inject script for Astro flavor
			expect(mockInjectScript).not.toHaveBeenCalled();
		});

		it('should handle StudioCMS flavor with callouts disabled in virtual imports', async () => {
			const { addVirtualImports } = await import('astro-integration-kit');
			const mockAddVirtualImports = vi.mocked(addVirtualImports);
			const mockAddIntegrations = vi.fn();

			const plugin: ReturnType<typeof studiocmsMD> = studiocmsMD({
				flavor: 'studiocms',
				callouts: false,
			});

			const hook = plugin.hooks['studiocms:astro:config'];
			if (!hook) throw new Error('Hook not found');
			hook({ addIntegrations: mockAddIntegrations });

			// Get the integration that was added
			const integrationArg = mockAddIntegrations.mock.calls[0]?.[0];
			if (!integrationArg) throw new Error('Integration not found');

			// Call the astro:config:setup hook
			const setupHook = integrationArg.hooks['astro:config:setup'];
			setupHook({
				addVirtualImports: mockAddVirtualImports,
				injectScript: vi.fn(),
			});

			const callArgs = mockAddVirtualImports.mock.calls[0];
			const imports = callArgs[1].imports;
			
			// Should not include callout theme import when callouts is false
			expect(imports['studiocms:md/styles']).not.toContain('md-remark-callouts');
		});

		it('should store resolved options in shared context on astro:config:done', async () => {
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
			hook({ addIntegrations: mockAddIntegrations });

			// Get the integration that was added
			const integrationArg = mockAddIntegrations.mock.calls[0]?.[0];
			if (!integrationArg) throw new Error('Integration not found');

			// Call the astro:config:done hook
			const doneHook = integrationArg.hooks['astro:config:done'];
			doneHook({ config: mockConfig });

			// Verify the shared context was updated
			const { shared } = await import('../src/lib/shared.js');
			expect(shared.mdConfig).toEqual(customOptions);
			expect(shared.astroMDRemark).toEqual(mockConfig.markdown);
		});
	});

	describe('default export', () => {
		it('should export the same function as named export', async () => {
			const { default: defaultExport } = await import('../src/index.js');
			expect(defaultExport).toBe(studiocmsMD);
		});
	});

	describe('schema validation', () => {
		it('should validate StudioCMS flavor schema correctly', () => {
			const validOptions = {
				flavor: 'studiocms',
				callouts: 'obsidian',
				autoLinkHeadings: true,
				discordSubtext: false,
				sanitize: {
					allowElements: ['p', 'br'],
					allowAttributes: { '*': ['class'] },
				},
			};

			expect(() => studiocmsMD(validOptions)).not.toThrow();
		});

		it('should validate Astro flavor schema correctly', () => {
			const validOptions = {
				flavor: 'astro',
				sanitize: {
					allowElements: ['p', 'br'],
					allowAttributes: { '*': ['class'] },
				},
			};

			expect(() => studiocmsMD(validOptions)).not.toThrow();
		});

		it('should reject invalid flavor', () => {
			const invalidOptions = {
				flavor: 'invalid',
			};

			expect(() => studiocmsMD(invalidOptions as never)).toThrow(/Invalid markdown options/);
		});

		it('should reject invalid callouts value', () => {
			const invalidOptions = {
				flavor: 'studiocms',
				callouts: 'invalid-theme',
			};

			expect(() => studiocmsMD(invalidOptions as never)).toThrow(/Invalid markdown options/);
		});

		it('should reject non-boolean autoLinkHeadings', () => {
			const invalidOptions = {
				flavor: 'studiocms',
				autoLinkHeadings: 'not-a-boolean',
			};

			expect(() => studiocmsMD(invalidOptions as never)).toThrow(/Invalid markdown options/);
		});

		it('should reject non-boolean discordSubtext', () => {
			const invalidOptions = {
				flavor: 'studiocms',
				discordSubtext: 'not-a-boolean',
			};

			expect(() => studiocmsMD(invalidOptions as never)).toThrow(/Invalid markdown options/);
		});
	});
});
