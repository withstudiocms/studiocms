import * as allure from 'allure-js-commons';
import { StudioCMSPluginTester } from 'studiocms/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { studiocmsGithub } from '../src/index.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'GitHub Plugin Tests';

describe(parentSuiteName, () => {
	let tester: StudioCMSPluginTester;
	let plugin: ReturnType<typeof studiocmsGithub>;

	beforeEach(() => {
		vi.clearAllMocks();
		plugin = studiocmsGithub();
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
			expect(pluginInfo.identifier).toBe('@studiocms/github');
			expect(pluginInfo.name).toBe('StudioCMS GitHub Plugin');
			expect(pluginInfo.studiocmsMinimumVersion).toBe('0.1.0-beta.22');
			expect(pluginInfo.requires).toBeUndefined();
		});

		await allure.step(
			'Should export default function returning valid plugin object',
			async (ctx) => {
				await ctx.parameter('functionType', typeof studiocmsGithub);
				await ctx.parameter('functionName', studiocmsGithub.name);

				expect(typeof studiocmsGithub).toBe('function');
				expect(studiocmsGithub.name).toBe('studiocmsGithub');
			}
		);

		await allure.step('Should return a valid StudioCMSPlugin object', async (ctx) => {
			await ctx.parameter('pluginIdentifier', plugin.identifier);
			await ctx.parameter('pluginName', plugin.name);
			await ctx.parameter('hasHooks', String(plugin.hooks !== undefined));

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/github');
			expect(plugin.name).toBe('StudioCMS GitHub Plugin');
			expect(plugin.hooks).toBeDefined();
		});
	});

	test('Plugin Hooks - Validates Hook Functionality', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Plugin Hooks Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should have correct hooks defined and functioning', async (ctx) => {
			const hookResults = await tester.getHookResults();

			await ctx.parameter(
				'studiocmsConfigHookDefined',
				String(hookResults.studiocmsConfig.hasHook)
			);
			await ctx.parameter('astroConfigHookDefined', String(hookResults.astroConfig.hasHook));

			expect(hookResults.studiocmsConfig.hasHook).toBe(true);
			expect(hookResults.astroConfig.hasHook).toBe(false);
		});

		await allure.step('Should configure GitHub OAuth provider correctly', async (ctx) => {
			const hookResults = await tester.getHookResults();
			const oAuthProvider = hookResults.studiocmsConfig.hookResults.authService.oAuthProvider;

			await ctx.parameter(
				'oAuthProvider',
				JSON.stringify(hookResults.studiocmsConfig.hookResults.authService.oAuthProvider, null, 2)
			);

			expect(oAuthProvider).toBeDefined();
			expect(oAuthProvider?.name).toBe('github');
			expect(oAuthProvider?.formattedName).toBe('GitHub');
			expect(oAuthProvider?.endpointPath).toContain('endpoint.js');
			expect(oAuthProvider?.requiredEnvVariables).toEqual([
				'CMS_GITHUB_CLIENT_ID',
				'CMS_GITHUB_CLIENT_SECRET',
				'CMS_GITHUB_REDIRECT_URI',
			]);
			expect(oAuthProvider?.svg).toContain('<svg');
			expect(oAuthProvider?.svg).toContain('oauth-logo');
			expect(oAuthProvider?.svg).toContain('viewBox="0 0 98 96"');
		});

		await allure.step('should not have astro config hook', async (ctx) => {
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
