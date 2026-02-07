/** biome-ignore-all lint/style/noNonNullAssertion: it's fine */
import * as allure from 'allure-js-commons';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { studiocmsMarkDoc } from '../src/index';
import type { MarkDocPluginOptions } from '../src/types';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'studiocmsMarkDoc Plugin Tests';

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

describe(parentSuiteName, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('Plugin Creation - Validates Plugin Structure and Options', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Plugin Creation Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should create plugin with correct metadata and structure', async (ctx) => {
			const plugin = studiocmsMarkDoc();
			await ctx.parameter('pluginIdentifier', plugin.identifier);
			await ctx.parameter('pluginName', plugin.name);
			await ctx.parameter('studiocmsMinimumVersion', plugin.studiocmsMinimumVersion);

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/markdoc');
			expect(plugin.name).toBe('StudioCMS MarkDoc');
			expect(plugin.studiocmsMinimumVersion).toBe('0.1.0-beta.21');
			expect(plugin.requires).toEqual(['@studiocms/md']);
			expect(plugin.hooks).toBeDefined();
		});

		await allure.step('Should create plugin with custom options', async (ctx) => {
			const options: MarkDocPluginOptions = {
				type: 'react-static',
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
			await ctx.parameter('pluginIdentifier', plugin.identifier);
			await ctx.parameter('pluginTypeOption', String(options.type));

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/markdoc');
		});
	});

	test('Plugin Hooks - Validates hook definitions', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Plugin Hooks Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should have defined hooks for Astro config and setup', async (ctx) => {
			const plugin = studiocmsMarkDoc();
			await ctx.parameter('definedHooks', String(Object.keys(plugin.hooks || {})));

			expect(plugin.hooks).toBeDefined();
			expect(plugin.hooks['studiocms:astro-config']).toBeDefined();
			expect(plugin.hooks['studiocms:rendering']).toBeDefined();
		});

		await allure.step('Should set up Astro page type configuration', async (ctx) => {
			const plugin = studiocmsMarkDoc();
			const setRendering = vi.fn();

			const configSetupHook = plugin.hooks['studiocms:rendering']!;
			// @ts-expect-error - testing hook invocation
			configSetupHook({ setRendering });

			await ctx.parameter('setRenderingCalls', String(setRendering.mock.calls.length));

			expect(setRendering).toHaveBeenCalledWith({
				pageTypes: [
					{
						identifier: 'studiocms/markdoc',
						label: 'MarkDoc',
						pageContentComponent: '/mock/path/./components/editor.astro',
						rendererComponent: '/mock/path/./components/render.js',
					},
				],
			});
		});
	});
});
