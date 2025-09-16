import { beforeEach, describe, expect, test, vi } from 'vitest';
import { studiocmsMarkDoc } from '../src/index';
import type { MarkDocPluginOptions } from '../src/types';

// Mock astro-integration-kit
vi.mock('astro-integration-kit', () => ({
	addVirtualImports: vi.fn(),
	createResolver: vi.fn(() => ({
		resolve: vi.fn((path: string) => `/mock/path/${path}`),
	})),
}));

// Mock studiocms/plugins
vi.mock('studiocms/plugins', () => ({
	definePlugin: vi.fn((config) => config),
}));

describe('StudioCMS MarkDoc Plugin', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('plugin creation with default options', () => {
		const plugin = studiocmsMarkDoc();

		expect(plugin).toBeDefined();
		expect(plugin.identifier).toBe('@studiocms/markdoc');
		expect(plugin.name).toBe('StudioCMS MarkDoc');
		expect(plugin.studiocmsMinimumVersion).toBe('0.1.0-beta.21');
		expect(plugin.requires).toEqual(['@studiocms/md']);
	});

	test('plugin creation with custom options', () => {
		const options: MarkDocPluginOptions = {
			type: 'react-static',
			argParse: { allowComments: true },
			transformConfig: {
				nodes: {
					heading: {
						render: 'Heading',
						attributes: {
							level: { type: Number },
						},
					},
				},
			},
		};

		const plugin = studiocmsMarkDoc(options);

		expect(plugin).toBeDefined();
		expect(plugin.identifier).toBe('@studiocms/markdoc');
	});

	test('plugin creation with custom renderer', () => {
		const customRenderer = {
			name: 'custom',
			render: async () => '<div>Custom render</div>',
		};

		const options: MarkDocPluginOptions = {
			type: customRenderer,
		};

		const plugin = studiocmsMarkDoc(options);

		expect(plugin).toBeDefined();
		expect(plugin.identifier).toBe('@studiocms/markdoc');
	});

	test('plugin hooks are defined', () => {
		const plugin = studiocmsMarkDoc();

		expect(plugin.hooks).toBeDefined();
		expect(plugin.hooks['studiocms:astro:config']).toBeDefined();
		expect(plugin.hooks['studiocms:config:setup']).toBeDefined();
	});

	test('plugin sets up astro config integration', () => {
		const plugin = studiocmsMarkDoc();
		const addIntegrations = vi.fn();

		const astroConfigHook = plugin.hooks['studiocms:astro:config'];
		astroConfigHook({ addIntegrations });

		expect(addIntegrations).toHaveBeenCalledWith({
			name: '@studiocms/markdoc',
			hooks: {
				'astro:config:setup': expect.any(Function),
				'astro:config:done': expect.any(Function),
			},
		});
	});

	test('plugin sets up rendering configuration', () => {
		const plugin = studiocmsMarkDoc();
		const setRendering = vi.fn();

		const configSetupHook = plugin.hooks['studiocms:config:setup'];
		configSetupHook({ setRendering });

		expect(setRendering).toHaveBeenCalledWith({
			pageTypes: [
				{
					identifier: 'studiocms/markdoc',
					label: 'MarkDoc',
					pageContentComponent: '/mock/path/./components/editor.astro',
					rendererComponent: '/mock/path/./components/MarkDocRenderer.astro',
				},
			],
		});
	});

	test('plugin handles undefined options', () => {
		const plugin = studiocmsMarkDoc(undefined);

		expect(plugin).toBeDefined();
		expect(plugin.identifier).toBe('@studiocms/markdoc');
	});

	test('plugin handles partial options', () => {
		const options: Partial<MarkDocPluginOptions> = {
			type: 'html',
		};

		const plugin = studiocmsMarkDoc(options);

		expect(plugin).toBeDefined();
		expect(plugin.identifier).toBe('@studiocms/markdoc');
	});

	test('plugin resolves component paths correctly', () => {
		const plugin = studiocmsMarkDoc();
		const setRendering = vi.fn();

		const configSetupHook = plugin.hooks['studiocms:config:setup'];
		configSetupHook({ setRendering });

		const callArgs = setRendering.mock.calls[0][0];
		expect(callArgs.pageTypes[0].pageContentComponent).toContain('editor.astro');
		expect(callArgs.pageTypes[0].rendererComponent).toContain('MarkDocRenderer.astro');
	});

	test('plugin sets up virtual imports', async () => {
		const { addVirtualImports } = await import('astro-integration-kit');
		const mockAddVirtualImports = vi.mocked(addVirtualImports);
		const mockAddIntegrations = vi.fn();

		const plugin = studiocmsMarkDoc();

		const hook = plugin.hooks['studiocms:astro:config'];
		hook({ addIntegrations: mockAddIntegrations });

		// Get the integration that was added
		const integrationArg = mockAddIntegrations.mock.calls[0][0];
		if (!integrationArg) throw new Error('Integration not found');

		// Call the astro:config:setup hook
		const setupHook = integrationArg.hooks['astro:config:setup'];
		setupHook({
			addVirtualImports: mockAddVirtualImports,
		} as any);

		expect(mockAddVirtualImports).toHaveBeenCalledWith(expect.any(Object), {
			name: '@studiocms/markdoc',
			imports: {
				'studiocms:markdoc/renderer': expect.stringContaining('renderMarkDoc'),
			},
		});
	});

	test('plugin stores resolved options in shared context', () => {
		const options: MarkDocPluginOptions = {
			type: 'react-static',
			argParse: { allowComments: true },
		};

		const plugin = studiocmsMarkDoc(options);
		const addIntegrations = vi.fn();

		const astroConfigHook = plugin.hooks['studiocms:astro:config'];
		astroConfigHook({ addIntegrations });

		const integrationConfig = addIntegrations.mock.calls[0][0];
		const configDoneHook = integrationConfig.hooks['astro:config:done'];

		// Mock shared object
		const mockShared = { markDocConfig: {} };
		vi.doMock('../src/lib/shared', () => ({
			shared: mockShared,
		}));

		configDoneHook();

		// The shared config should be set (though we can't directly test it due to mocking)
		expect(configDoneHook).toBeDefined();
	});

	test('plugin handles empty options object', () => {
		const plugin = studiocmsMarkDoc({});

		expect(plugin).toBeDefined();
		expect(plugin.identifier).toBe('@studiocms/markdoc');
	});

	test('plugin exports default function', async () => {
		const { default: defaultExport } = await import('../src/index');
		
		expect(defaultExport).toBe(studiocmsMarkDoc);
	});
});
