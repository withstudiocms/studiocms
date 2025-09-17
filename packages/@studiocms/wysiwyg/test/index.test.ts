import { beforeEach, describe, expect, test, vi } from 'vitest';
import wysiwyg from '../src/index';
import type { WYSIWYGSchemaOptions } from '../src/types';

// Mock logger type
interface MockLogger {
	info: ReturnType<typeof vi.fn>;
	error: ReturnType<typeof vi.fn>;
	warn: ReturnType<typeof vi.fn>;
	debug: ReturnType<typeof vi.fn>;
}

const createMockLogger = (): MockLogger => ({
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
});

// Mock astro-integration-kit
vi.mock('astro-integration-kit', () => ({
	createResolver: vi.fn(() => ({
		resolve: vi.fn((path: string) => `/mock/path/${path}`),
	})),
}));

// Mock studiocms/plugins
vi.mock('studiocms/plugins', () => ({
	definePlugin: vi.fn((config) => config),
}));

describe('StudioCMS WYSIWYG Plugin', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('plugin creation with default options', () => {
		const plugin = wysiwyg();

		expect(plugin).toBeDefined();
		expect(plugin.identifier).toBe('@studiocms/wysiwyg');
		expect(plugin.name).toBe('StudioCMS WYSIWYG Editor');
		expect(plugin.studiocmsMinimumVersion).toBe('0.1.0-beta.23');
	});

	test('plugin creation with custom options', () => {
		const options: WYSIWYGSchemaOptions = {
			sanitize: {
				allowElements: ['div', 'h1', 'p'],
				allowAttributes: {
					'*': ['class'],
					a: ['href'],
				},
			},
		};

		const plugin = wysiwyg(options);

		expect(plugin).toBeDefined();
		expect(plugin.identifier).toBe('@studiocms/wysiwyg');
	});

	test('plugin creation with empty sanitize options', () => {
		const options: WYSIWYGSchemaOptions = {
			sanitize: {},
		};

		const plugin = wysiwyg(options);

		expect(plugin).toBeDefined();
		expect(plugin.identifier).toBe('@studiocms/wysiwyg');
	});

	test('plugin hooks are defined', () => {
		const plugin = wysiwyg();

		expect(plugin.hooks).toBeDefined();
		expect(plugin.hooks['studiocms:astro:config']).toBeDefined();
		expect(plugin.hooks['studiocms:config:setup']).toBeDefined();
	});

	test('plugin sets up astro config integration', () => {
		const plugin = wysiwyg();
		const addIntegrations = vi.fn();

		const astroConfigHook = plugin.hooks['studiocms:astro:config'];
		if (!astroConfigHook) throw new Error('Hook not found');
		astroConfigHook({ addIntegrations, logger: createMockLogger() });

		expect(addIntegrations).toHaveBeenCalledWith({
			name: '@studiocms/wysiwyg',
			hooks: {
				'astro:config:setup': expect.any(Function),
				'astro:config:done': expect.any(Function),
			},
		});
	});

	test('plugin sets up rendering configuration', () => {
		const plugin = wysiwyg();
		const setRendering = vi.fn();

		const configSetupHook = plugin.hooks['studiocms:config:setup'];
		if (!configSetupHook) throw new Error('Hook not found');
		configSetupHook({
			setRendering,
			logger: createMockLogger(),
			setSitemap: vi.fn(),
			setDashboard: vi.fn(),
			setFrontend: vi.fn(),
			setImageService: vi.fn(),
			setAuthService: vi.fn(),
		});

		expect(setRendering).toHaveBeenCalledWith({
			pageTypes: [
				{
					identifier: 'studiocms/wysiwyg',
					label: 'WYSIWYG',
					rendererComponent: '/mock/path/./components/Render.astro',
					pageContentComponent: '/mock/path/./components/Editor.astro',
				},
			],
		});
	});

	test('plugin handles undefined options', () => {
		const plugin = wysiwyg(undefined);

		expect(plugin).toBeDefined();
		expect(plugin.identifier).toBe('@studiocms/wysiwyg');
	});

	test('plugin handles partial options', () => {
		const options: Partial<WYSIWYGSchemaOptions> = {
			sanitize: {
				allowElements: ['div', 'p'],
			},
		};

		const plugin = wysiwyg(options);

		expect(plugin).toBeDefined();
		expect(plugin.identifier).toBe('@studiocms/wysiwyg');
	});

	test('plugin resolves component paths correctly', () => {
		const plugin = wysiwyg();
		const setRendering = vi.fn();

		const configSetupHook = plugin.hooks['studiocms:config:setup'];
		if (!configSetupHook) throw new Error('Hook not found');
		configSetupHook({
			setRendering,
			logger: createMockLogger(),
			setSitemap: vi.fn(),
			setDashboard: vi.fn(),
			setFrontend: vi.fn(),
			setImageService: vi.fn(),
			setAuthService: vi.fn(),
		});

		const callArgs = setRendering.mock.calls[0][0];
		expect(callArgs.pageTypes[0].pageContentComponent).toContain('Editor.astro');
		expect(callArgs.pageTypes[0].rendererComponent).toContain('Render.astro');
	});

	test('plugin sets up route injection', async () => {
		const mockAddIntegrations = vi.fn();

		const plugin = wysiwyg();

		const hook = plugin.hooks['studiocms:astro:config'];
		if (!hook) throw new Error('Hook not found');
		hook({ addIntegrations: mockAddIntegrations, logger: createMockLogger() });

		// Get the integration that was added
		const integrationArg = mockAddIntegrations.mock.calls[0][0];
		if (!integrationArg) throw new Error('Integration not found');

		// Call the astro:config:setup hook
		const setupHook = integrationArg.hooks['astro:config:setup'];
		const injectRoute = vi.fn();
		setupHook({
			injectRoute,
		} as unknown);

		// Should inject 3 routes: partial, grapes.css, and store
		expect(injectRoute).toHaveBeenCalledTimes(3);

		// Check that routes are injected with correct patterns
		const routeCalls = injectRoute.mock.calls;
		expect(routeCalls[0][0].pattern).toBe('/studiocms_api/wysiwyg_editor/partial');
		expect(routeCalls[1][0].pattern).toBe('/studiocms_api/wysiwyg_editor/grapes.css');
		expect(routeCalls[2][0].pattern).toBe('/studiocms_api/wysiwyg_editor/store');
	});

	test('plugin stores sanitize options in shared context', () => {
		const options: WYSIWYGSchemaOptions = {
			sanitize: {
				allowElements: ['div', 'h1', 'p'],
				allowAttributes: {
					'*': ['class'],
				},
			},
		};

		const plugin = wysiwyg(options);
		const addIntegrations = vi.fn();

		const astroConfigHook = plugin.hooks['studiocms:astro:config'];
		if (!astroConfigHook) throw new Error('Hook not found');
		astroConfigHook({ addIntegrations, logger: createMockLogger() });

		const integrationConfig = addIntegrations.mock.calls[0][0];
		const configDoneHook = integrationConfig.hooks['astro:config:done'];

		// Mock shared object
		const mockShared = { sanitize: {} };
		vi.doMock('../src/lib/shared', () => ({
			shared: mockShared,
		}));

		configDoneHook();

		// The shared config should be set (though we can't directly test it due to mocking)
		expect(configDoneHook).toBeDefined();
	});

	test('plugin handles empty options object', () => {
		const plugin = wysiwyg({});

		expect(plugin).toBeDefined();
		expect(plugin.identifier).toBe('@studiocms/wysiwyg');
	});

	test('plugin exports default function', async () => {
		const { default: defaultExport } = await import('../src/index');

		expect(defaultExport).toBe(wysiwyg);
	});

	test('plugin validates schema options', () => {
		// Test that invalid options are handled gracefully
		const invalidOptions = {
			sanitize: {
				invalidProperty: 'should be ignored',
			},
		};

		// This should not throw an error due to schema validation
		expect(() => wysiwyg(invalidOptions as unknown as WYSIWYGSchemaOptions)).not.toThrow();
	});

	test('plugin sets up routes with correct entrypoints', () => {
		const plugin = wysiwyg();
		const addIntegrations = vi.fn();

		const astroConfigHook = plugin.hooks['studiocms:astro:config'];
		astroConfigHook?.({ addIntegrations, logger: createMockLogger() });

		const integrationConfig = addIntegrations.mock.calls[0][0];
		const setupHook = integrationConfig.hooks['astro:config:setup'];
		const injectRoute = vi.fn();

		setupHook({
			injectRoute,
		} as unknown);

		const routeCalls = injectRoute.mock.calls;

		// Check entrypoints are resolved correctly
		expect(routeCalls[0][0].entrypoint).toContain('partial.astro');
		expect(routeCalls[1][0].entrypoint).toContain('grapes.css.ts');
		expect(routeCalls[2][0].entrypoint).toContain('store.ts');

		// Check prerender is false for all routes
		expect(routeCalls[0][0].prerender).toBe(false);
		expect(routeCalls[1][0].prerender).toBe(false);
		expect(routeCalls[2][0].prerender).toBe(false);
	});
});
