import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { studiocmsHTML } from '../src/index.js';
import { createMockHTMLOptions } from './test-utils.js';

// Mock the dependencies
vi.mock('astro-integration-kit', () => ({
	createResolver: vi.fn(() => ({
		resolve: vi.fn((path: string) => `/mocked/path/${path}`),
	})),
}));

vi.mock('studiocms/plugins', () => ({
	definePlugin: vi.fn((config) => config),
}));

vi.mock('../src/lib/shared.js', () => ({
	shared: {
		htmlConfig: undefined,
	},
}));

describe('studiocmsHTML', () => {
	beforeEach(() => {
		vi.clearAllMocks();
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

		it('should handle invalid options gracefully', () => {
			const invalidOptions = {
				sanitize: {
					invalidProperty: 'test',
				},
			};

			// The function should handle invalid options without throwing
			// since the schema validation happens internally
			expect(() => studiocmsHTML(invalidOptions as never)).not.toThrow();
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

		it('should call studiocms:astro:config hook with addIntegrations', () => {
			const plugin = studiocmsHTML();
			const mockAddIntegrations = vi.fn();

			const hook = plugin.hooks['studiocms:astro:config'] as (...args: unknown[]) => unknown;
			hook({ addIntegrations: mockAddIntegrations });

			expect(mockAddIntegrations).toHaveBeenCalledWith({
				name: '@studiocms/html',
				hooks: {
					'astro:config:done': expect.any(Function),
				},
			});
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
