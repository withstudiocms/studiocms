import * as allure from 'allure-js-commons';
import { StudioCMSPluginTester } from 'studiocms/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { studiocmsDiscord } from '../src/index.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Discord Plugin Tests';

describe(parentSuiteName, () => {
	let tester: StudioCMSPluginTester;
	let plugin: ReturnType<typeof studiocmsDiscord>;

	beforeEach(() => {
		vi.clearAllMocks();
		plugin = studiocmsDiscord();
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
			expect(pluginInfo.identifier).toBe('@studiocms/discord');
			expect(pluginInfo.name).toBe('StudioCMS Discord Provider Plugin');
			expect(pluginInfo.studiocmsMinimumVersion).toBe('0.1.0-beta.22');
			expect(pluginInfo.requires).toBeUndefined();
		});

		await allure.step(
			'Should export default function returning valid plugin object',
			async (ctx) => {
				await ctx.parameter('functionType', typeof studiocmsDiscord);
				await ctx.parameter('functionName', studiocmsDiscord.name);

				expect(typeof studiocmsDiscord).toBe('function');
				expect(studiocmsDiscord.name).toBe('studiocmsDiscord');
			}
		);

		await allure.step('Should return a valid StudioCMSPlugin object', async (ctx) => {
			await ctx.parameter('pluginIdentifier', plugin.identifier);
			await ctx.parameter('pluginName', plugin.name);
			await ctx.parameter('hasHooks', String(plugin.hooks !== undefined));

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/discord');
			expect(plugin.name).toBe('StudioCMS Discord Provider Plugin');
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
			await ctx.parameter('hookResults', JSON.stringify(hookResults, null, 2));

			expect(hookResults.studiocmsConfig).toBeDefined();
			expect(hookResults.studiocmsConfig.hasHook).toBe(true);
		});

		await allure.step(
			'should configure Discord OAuth provider in studiocms config hook',
			async (ctx) => {
				const hookResults = await tester.getHookResults();
				const oAuthProvider = hookResults.studiocmsConfig.hookResults.authService.oAuthProvider;

				await ctx.parameter('oAuthProvider', JSON.stringify(oAuthProvider, null, 2));

				expect(oAuthProvider).toBeDefined();
				expect(oAuthProvider?.name).toBe('discord');
				expect(oAuthProvider?.formattedName).toBe('Discord');
				expect(oAuthProvider?.endpointPath).toContain('endpoint.js');
			}
		);

		await allure.step('should define required environment variables', async (ctx) => {
			const hookResults = await tester.getHookResults();
			const oAuthProvider = hookResults.studiocmsConfig.hookResults.authService.oAuthProvider;

			await ctx.parameter(
				'requiredEnvVariables',
				JSON.stringify(oAuthProvider?.requiredEnvVariables, null, 2)
			);

			expect(oAuthProvider?.requiredEnvVariables).toEqual([
				'CMS_DISCORD_CLIENT_ID',
				'CMS_DISCORD_CLIENT_SECRET',
				'CMS_DISCORD_REDIRECT_URI',
			]);
		});

		await allure.step('should include Discord SVG logo', async (ctx) => {
			const hookResults = await tester.getHookResults();
			const oAuthProvider = hookResults.studiocmsConfig.hookResults.authService.oAuthProvider;

			await ctx.parameter('oAuthProviderSVG', oAuthProvider?.svg || 'undefined');

			expect(oAuthProvider?.svg).toBeDefined();
			expect(oAuthProvider?.svg).toContain('<svg');
			expect(oAuthProvider?.svg).toContain('oauth-logo');
			expect(oAuthProvider?.svg).toContain('viewBox="0 0 256 199"');
		});

		await allure.step('should not have astro config hook defined', async (ctx) => {
			const hookResults = await tester.getHookResults();

			await ctx.parameter('astroConfigHasHook', String(hookResults.astroConfig.hasHook));
			await ctx.parameter(
				'astroConfigIntegrations',
				JSON.stringify(hookResults.astroConfig.hookResults.integrations, null, 2)
			);

			expect(hookResults.astroConfig.hasHook).toBe(false);
			expect(hookResults.astroConfig.hookResults.integrations).toEqual([]);
		});
	});
});
