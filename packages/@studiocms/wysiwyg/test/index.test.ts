import { StudioCMSPluginTester } from 'studiocms/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import wysiwyg from '../src/index';
import type { WYSIWYGSchemaOptions } from '../src/types';

describe('StudioCMS WYSIWYG Plugin', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('plugin creation with default options', () => {
		const plugin = wysiwyg();
		const tester = new StudioCMSPluginTester(plugin);
		const info = tester.getPluginInfo();

		expect(plugin).toBeDefined();
		expect(info.identifier).toBe('@studiocms/wysiwyg');
		expect(info.name).toBe('StudioCMS WYSIWYG Editor');
		expect(info.studiocmsMinimumVersion).toBe('0.1.0-beta.23');
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
		const tester = new StudioCMSPluginTester(plugin);
		const info = tester.getPluginInfo();

		expect(plugin).toBeDefined();
		expect(info.identifier).toBe('@studiocms/wysiwyg');
	});

	test('plugin creation with empty sanitize options', () => {
		const options: WYSIWYGSchemaOptions = {
			sanitize: {},
		};

		const plugin = wysiwyg(options);

		expect(plugin).toBeDefined();
		expect(plugin.identifier).toBe('@studiocms/wysiwyg');
	});

	test('plugin hooks are defined', async () => {
		const plugin = wysiwyg();
		const tester = new StudioCMSPluginTester(plugin);
		const results = await tester.getHookResults();

		expect(plugin.hooks).toBeDefined();
		expect(results.astroConfig.hasHook).toBe(true);
		expect(results.studiocmsConfig.hasHook).toBe(true);
	});

	test('plugin sets up astro config integration', async () => {
		const plugin = wysiwyg();
		const tester = new StudioCMSPluginTester(plugin);
		const results = await tester.getHookResults();

		expect(results.astroConfig.hasHook).toBe(true);
		expect(results.astroConfig.hookResults.integrations).toHaveLength(1);
		expect(results.astroConfig.hookResults.integrations[0]).toEqual(
			expect.objectContaining({
				name: '@studiocms/wysiwyg',
				hooks: {
					'astro:config:setup': expect.any(Function),
					'astro:config:done': expect.any(Function),
				},
			})
		);
	});

	test('plugin sets up rendering configuration', async () => {
		const plugin = wysiwyg();
		const tester = new StudioCMSPluginTester(plugin);
		const results = await tester.getHookResults();

		expect(results.studiocmsConfig.hasHook).toBe(true);
		expect(results.studiocmsConfig.hookResults.rendering).toEqual({
			pageTypes: [
				{
					identifier: 'studiocms/wysiwyg',
					label: 'WYSIWYG',
					rendererComponent: expect.stringContaining('Render.astro'),
					pageContentComponent: expect.stringContaining('Editor.astro'),
				},
			],
		});
	});

	test('plugin handles undefined options', () => {
		const plugin = wysiwyg(undefined);
		const tester = new StudioCMSPluginTester(plugin);
		const info = tester.getPluginInfo();

		expect(plugin).toBeDefined();
		expect(info.identifier).toBe('@studiocms/wysiwyg');
	});

	test('plugin handles partial options', () => {
		const options: Partial<WYSIWYGSchemaOptions> = {
			sanitize: {
				allowElements: ['div', 'p'],
			},
		};

		const plugin = wysiwyg(options);
		const tester = new StudioCMSPluginTester(plugin);
		const info = tester.getPluginInfo();

		expect(plugin).toBeDefined();
		expect(info.identifier).toBe('@studiocms/wysiwyg');
	});

	test('plugin handles empty options object', () => {
		const plugin = wysiwyg({});
		const tester = new StudioCMSPluginTester(plugin);
		const info = tester.getPluginInfo();

		expect(plugin).toBeDefined();
		expect(info.identifier).toBe('@studiocms/wysiwyg');
	});

	test('plugin exports default function', async () => {
		const { default: defaultExport } = await import('../src/index');

		expect(typeof defaultExport).toBe('function');
		expect(defaultExport.name).toBe('wysiwyg');
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
});
