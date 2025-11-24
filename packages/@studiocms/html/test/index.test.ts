import * as allure from 'allure-js-commons';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { studiocmsHTML } from '../src/index.js';
import {
	cleanupGlobalThis,
	createMockHTMLOptions,
	parentSuiteName,
	sharedTags,
} from './test-utils.js';

const localSuiteName = 'studiocmsHTML Plugin Tests';

// Mock the dependencies
vi.mock('astro-integration-kit', () => ({
	createResolver: vi.fn(() => ({
		resolve: vi.fn((path: string) => `/mocked/path/${path}`),
	})),
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
			const plugin = studiocmsHTML();
			await ctx.parameter('pluginIdentifier', plugin.identifier);
			await ctx.parameter('pluginName', plugin.name);
			await ctx.parameter('studiocmsMinimumVersion', plugin.studiocmsMinimumVersion);

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/html');
			expect(plugin.name).toBe('StudioCMS HTML');
			expect(plugin.studiocmsMinimumVersion).toBe('0.1.0-beta.21');
			expect(plugin.hooks).toBeDefined();
		});
	});

	test('Plugin Creation - Validates plugin Structure with Custom Options', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Plugin Creation with Custom Options Tests');
		await allure.tags(...sharedTags);

		await allure.step(
			'Should create plugin with correct metadata and structure using custom options',
			async (ctx) => {
				const options = createMockHTMLOptions({
					sanitize: {
						allowElements: ['p', 'br'],
						allowAttributes: {
							p: ['class'],
						},
					},
				});
				const plugin = studiocmsHTML(options);
				await ctx.parameter('pluginIdentifier', plugin.identifier);
				await ctx.parameter('pluginName', plugin.name);
				await ctx.parameter('studiocmsMinimumVersion', plugin.studiocmsMinimumVersion);
				await ctx.parameter('customOptions', JSON.stringify(options, null, 2));

				expect(plugin).toBeDefined();
				expect(plugin.identifier).toBe('@studiocms/html');
				expect(plugin.name).toBe('StudioCMS HTML');
				expect(plugin.studiocmsMinimumVersion).toBe('0.1.0-beta.21');
				expect(plugin.hooks).toBeDefined();
			}
		);
	});

	test('Plugin Creation - Validates Error Handling for Invalid Options', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Plugin Creation Error Handling Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should throw error for invalid options', async (ctx) => {
			const invalidOptions = {
				sanitize: 'not-an-object', // This should cause schema validation to fail
			};

			await ctx.parameter('invalidOptions', JSON.stringify(invalidOptions, null, 2));

			// The function should throw an error when schema validation fails
			expect(() => studiocmsHTML(invalidOptions as never)).toThrow(/Invalid HTML options/);
		});
	});

	test('Plugin Creation - Validates Handling of Unknown Properties', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Plugin Creation Unknown Properties Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should handle unknown properties gracefully', async (ctx) => {
			const optionsWithUnknownProperties = {
				sanitize: {
					allowElements: ['p', 'br'],
				},
				unknownProperty: 'should be ignored',
			};

			await ctx.parameter(
				'optionsWithUnknownProperties',
				JSON.stringify(optionsWithUnknownProperties, null, 2)
			);

			// The function should handle unknown properties without throwing
			// since the schema validation strips unknown properties and uses defaults
			expect(() => studiocmsHTML(optionsWithUnknownProperties as never)).not.toThrow();
		});
	});

	test('Plugin Hooks - Validates Hook Functionality', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Plugin Hooks Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should have all required hooks', async () => {
			const plugin = studiocmsHTML();

			expect(plugin.hooks['studiocms:astro-config']).toBeDefined();
			expect(typeof plugin.hooks['studiocms:astro-config']).toBe('function');
		});

		await allure.step('Should call astro:config hook correctly', async (ctx) => {
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

			const hook = plugin.hooks['studiocms:astro-config'];
			if (!hook) throw new Error('Hook not found');
			hook({ addIntegrations: mockAddIntegrations, logger: mockLogger });

			await ctx.parameter(
				'addIntegrationsCalls',
				JSON.stringify(mockAddIntegrations.mock.calls, null, 2)
			);

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

		await allure.step('Should call studiocms:rendering hook correctly', async (ctx) => {
			const plugin = studiocmsHTML();
			const mockSetRendering = vi.fn();

			const hook = plugin.hooks['studiocms:rendering'] as (...args: unknown[]) => unknown;
			hook({ setRendering: mockSetRendering });

			await ctx.parameter(
				'setRenderingCalls',
				JSON.stringify(mockSetRendering.mock.calls, null, 2)
			);

			expect(mockSetRendering).toHaveBeenCalledWith({
				pageTypes: [
					{
						identifier: 'studiocms/html',
						label: 'HTML',
						pageContentComponent: '/mocked/path/./components/editor.astro',
						rendererComponent: '/mocked/path/./components/render.js',
					},
				],
			});
		});
	});

	test('Plugin Hooks - Persists Custom Options to shared.htmlConfig', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Plugin Hooks Custom Options Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should persist custom options to shared.htmlConfig', async (ctx) => {
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

			const hook = plugin.hooks['studiocms:astro-config'];
			if (!hook) throw new Error('Hook not found');
			hook({ addIntegrations: mockAddIntegrations, logger: mockLogger });

			// Verify the side effect executed by astro:config:done
			const integrationArg = mockAddIntegrations.mock.calls[0][0];
			const { shared } = await import('../src/lib/shared.js');

			// Store the initial value
			const initialValue = shared.htmlConfig;

			// Execute the hook
			integrationArg.hooks['astro:config:done']();

			await ctx.parameter('initialHtmlConfig', JSON.stringify(initialValue, null, 2));
			await ctx.parameter('persistedHtmlConfig', JSON.stringify(shared.htmlConfig, null, 2));

			// Verify the value changed to our custom options
			expect(shared.htmlConfig).toBeDefined();
			expect(shared.htmlConfig).toEqual(customOptions);
			expect(shared.htmlConfig).not.toEqual(initialValue);
		});
	});
});
