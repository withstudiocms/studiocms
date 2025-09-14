import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { studiocmsHTML } from '../src/index.js';
import { cleanupGlobalThis, createMockHTMLOptions } from './test-utils.js';

// Mock the dependencies
vi.mock('astro-integration-kit', () => ({
	createResolver: vi.fn(() => ({
		resolve: vi.fn((path: string) => `/mocked/path/${path}`),
	})),
}));

vi.mock('studiocms/plugins', () => ({
	definePlugin: vi.fn((config) => config),
}));

describe('studiocmsHTML', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		cleanupGlobalThis();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('plugin creation', () => {
		it('should create a plugin with default options', () => {
			const plugin = studiocmsHTML();

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/html');
			expect(plugin.name).toBe('StudioCMS HTML');
			expect(plugin.studiocmsMinimumVersion).toBe('0.1.0-beta.21');
			expect(plugin.hooks).toBeDefined();
		});

		it('should create a plugin with custom options', () => {
			const options = createMockHTMLOptions({
				sanitize: {
					allowElements: ['p', 'br'],
					allowAttributes: {
						p: ['class'],
					},
				},
			});

			const plugin = studiocmsHTML(options);

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/html');
			expect(plugin.name).toBe('StudioCMS HTML');
		});

		it('should throw error for invalid options', () => {
			const invalidOptions = {
				sanitize: 'not-an-object', // This should cause schema validation to fail
			};

			// The function should throw an error when schema validation fails
			expect(() => studiocmsHTML(invalidOptions as never)).toThrow(/Invalid HTML options/);
		});

		it('should handle unknown properties gracefully', () => {
			const optionsWithUnknownProperties = {
				sanitize: {
					allowElements: ['p', 'br'],
				},
				unknownProperty: 'should be ignored',
			};

			// The function should handle unknown properties without throwing
			// since the schema validation strips unknown properties and uses defaults
			expect(() => studiocmsHTML(optionsWithUnknownProperties as never)).not.toThrow();
		});
	});

	describe('plugin hooks', () => {
		it('should have studiocms:astro:config hook', () => {
			const plugin = studiocmsHTML();

			expect(plugin.hooks['studiocms:astro:config']).toBeDefined();
			expect(typeof plugin.hooks['studiocms:astro:config']).toBe('function');
		});

		it('should have studiocms:config:setup hook', () => {
			const plugin = studiocmsHTML();

			expect(plugin.hooks['studiocms:config:setup']).toBeDefined();
			expect(typeof plugin.hooks['studiocms:config:setup']).toBe('function');
		});

		it('should call studiocms:astro:config hook with addIntegrations and set shared.htmlConfig', async () => {
			const plugin: ReturnType<typeof studiocmsHTML> = studiocmsHTML();
			const mockAddIntegrations = vi.fn();
			const mockLogger = {
				options: {
					dest: 'stderr',
					level: 'info',
				},
				label: vi.fn(),
				fork: vi.fn(),
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
				debug: vi.fn(),
			} as any;

			const hook = plugin.hooks['studiocms:astro:config'];
			if (!hook) throw new Error('Hook not found');
			hook({ addIntegrations: mockAddIntegrations, logger: mockLogger });

			expect(mockAddIntegrations).toHaveBeenCalledWith({
				name: '@studiocms/html',
				hooks: {
					'astro:config:done': expect.any(Function),
				},
			});

			// Verify the side effect executed by astro:config:done
			const integrationArg = mockAddIntegrations.mock.calls[0][0];
			const { shared } = await import('../src/lib/shared.js');
			expect(shared.htmlConfig).toBeUndefined();
			integrationArg.hooks['astro:config:done']();
			expect(shared.htmlConfig).toBeDefined();
			expect(shared.htmlConfig).toEqual({});
		});

		it('should persist custom options to shared.htmlConfig', async () => {
			const customOptions = {
				sanitize: {
					allowElements: ['p', 'br', 'strong'],
					allowAttributes: { '*': ['class'] },
				},
			};
			const plugin: ReturnType<typeof studiocmsHTML> = studiocmsHTML(customOptions);
			const mockAddIntegrations = vi.fn();
			const mockLogger = {
				options: {
					dest: 'stderr',
					level: 'info',
				},
				label: vi.fn(),
				fork: vi.fn(),
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
				debug: vi.fn(),
			} as any;

			const hook = plugin.hooks['studiocms:astro:config'];
			if (!hook) throw new Error('Hook not found');
			hook({ addIntegrations: mockAddIntegrations, logger: mockLogger });

			// Verify the side effect executed by astro:config:done
			const integrationArg = mockAddIntegrations.mock.calls[0][0];
			const { shared } = await import('../src/lib/shared.js');

			// Store the initial value
			const initialValue = shared.htmlConfig;

			// Execute the hook
			integrationArg.hooks['astro:config:done']();

			// Verify the value changed to our custom options
			expect(shared.htmlConfig).toBeDefined();
			expect(shared.htmlConfig).toEqual(customOptions);
			expect(shared.htmlConfig).not.toEqual(initialValue);
		});

		it('should call studiocms:config:setup hook with setRendering', () => {
			const plugin = studiocmsHTML();
			const mockSetRendering = vi.fn();

			const hook = plugin.hooks['studiocms:config:setup'] as (...args: unknown[]) => unknown;
			hook({ setRendering: mockSetRendering });

			expect(mockSetRendering).toHaveBeenCalledWith({
				pageTypes: [
					{
						identifier: 'studiocms/html',
						label: 'HTML',
						pageContentComponent: '/mocked/path/./components/editor.astro',
						rendererComponent: '/mocked/path/./components/renderer.astro',
					},
				],
			});
		});
	});

	describe('default export', () => {
		it('should export the same function as named export', async () => {
			const { default: defaultExport } = await import('../src/index.js');
			expect(defaultExport).toBe(studiocmsHTML);
		});
	});
});
