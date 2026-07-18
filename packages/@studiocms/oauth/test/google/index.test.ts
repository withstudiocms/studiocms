import * as allure from 'allure-js-commons';
import { StudioCMSPluginTester } from 'studiocms/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { google } from '../../src/google/index.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Google Plugin Tests';

describe(parentSuiteName, () => {
	let tester: StudioCMSPluginTester;
	let plugin: ReturnType<typeof google>;

	beforeEach(() => {
		vi.clearAllMocks();
		plugin = google();
		tester = new StudioCMSPluginTester(plugin);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('Plugin Creation - Validates Plugin Structure', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Plugin Creation Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should create plugin with correct metadata and structure', async (ctx) => {
			const pluginInfo = tester.getPluginInfo();

			await ctx.parameter('pluginInfo', JSON.stringify(pluginInfo, null, 2));

			expect(pluginInfo).toBeDefined();
			expect(pluginInfo.identifier).toBe('@studiocms/google');
			expect(pluginInfo.name).toBe('StudioCMS Google Provider Plugin');
			expect(pluginInfo.requires).toBeUndefined();
		});

		await allure.step(
			'Should export default function returning valid plugin object',
			async (ctx) => {
				await ctx.parameter('functionType', typeof google);
				await ctx.parameter('functionName', google.name);

				expect(typeof google).toBe('function');
				expect(google.name).toBe('google');
			}
		);

		await allure.step('Should return a valid StudioCMSPlugin object', async (ctx) => {
			await ctx.parameter('pluginIdentifier', plugin.identifier);
			await ctx.parameter('pluginName', plugin.name);
			await ctx.parameter('hasHooks', String(plugin.hooks !== undefined));

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/google');
			expect(plugin.name).toBe('StudioCMS Google Provider Plugin');
			expect(plugin.hooks).toBeDefined();
		});
	});

	test('Hooks Functionality - Validates Hook Implementations', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Hooks Functionality Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should have correct hooks defined and implemented', async (ctx) => {
			const hookResults = await tester.getHookResults();

			await ctx.parameter('hookResults', JSON.stringify(hookResults, null, 2));

			expect(hookResults.studiocmsConfig).toBeDefined();
			expect(hookResults.studiocmsConfig.hasHook).toBe(true);

			expect(hookResults.astroConfig).toBeDefined();
			expect(hookResults.astroConfig.hasHook).toBe(false);
		});

		await allure.step('Should configure Google OAuth provider correctly', async (ctx) => {
			const hookResults = await tester.getHookResults();
			const oAuthProvider = hookResults.studiocmsConfig.hookResults.authService.oAuthProvider;

			await ctx.parameter(
				'oAuthProvider',
				JSON.stringify(hookResults.studiocmsConfig.hookResults.authService.oAuthProvider, null, 2)
			);

			expect(oAuthProvider).toBeDefined();
			expect(oAuthProvider?.name).toBe('google');
			expect(oAuthProvider?.formattedName).toBe('Google');
			expect(oAuthProvider?.endpointPath).toContain('endpoint.js');
		});

		await allure.step('Should define required environment variables', async (ctx) => {
			const hookResults = await tester.getHookResults();
			const oAuthProvider = hookResults.studiocmsConfig.hookResults.authService.oAuthProvider;

			await ctx.parameter(
				'requiredEnvVariables',
				JSON.stringify(oAuthProvider?.requiredEnvVariables, null, 2)
			);

			expect(oAuthProvider?.requiredEnvVariables).toEqual([
				'CMS_GOOGLE_CLIENT_ID',
				'CMS_GOOGLE_CLIENT_SECRET',
				'CMS_GOOGLE_REDIRECT_URI',
			]);
		});

		await allure.step('Should include Google SVG logo', async (ctx) => {
			const hookResults = await tester.getHookResults();
			const oAuthProvider = hookResults.studiocmsConfig.hookResults.authService.oAuthProvider;

			await ctx.parameter('svgContent', oAuthProvider?.svg ?? 'undefined');

			expect(oAuthProvider?.svg).toBeDefined();
			expect(oAuthProvider?.svg).toContain('<svg');
			expect(oAuthProvider?.svg).toContain('oauth-logo');
			expect(oAuthProvider?.svg).toContain('viewBox="0 0 256 262"');
		});

		await allure.step('Should not have astro config hook', async (ctx) => {
			const hookResults = await tester.getHookResults();

			await ctx.parameter(
				'astroConfigHookResults',
				JSON.stringify(hookResults.astroConfig.hookResults, null, 2)
			);

			expect(hookResults.astroConfig.hasHook).toBe(false);
			expect(hookResults.astroConfig.hookResults.integrations).toEqual([]);
		});
	});
});
