import * as allure from 'allure-js-commons';
import { StudioCMSPluginTester } from 'studiocms/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { studiocmsAuth0 } from '../src/index.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Auth0 Plugin Tests';

describe(parentSuiteName, () => {
	let tester: StudioCMSPluginTester;
	let plugin: ReturnType<typeof studiocmsAuth0>;

	beforeEach(() => {
		vi.clearAllMocks();
		plugin = studiocmsAuth0();
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
			expect(pluginInfo.identifier).toBe('@studiocms/auth0');
			expect(pluginInfo.name).toBe('StudioCMS Auth0 Provider Plugin');
			expect(pluginInfo.studiocmsMinimumVersion).toBe('0.1.0-beta.22');
			expect(pluginInfo.requires).toBeUndefined();
		});

		await allure.step(
			'Should export default function returning valid plugin object',
			async (ctx) => {
				await ctx.parameter('functionType', typeof studiocmsAuth0);
				await ctx.parameter('functionName', studiocmsAuth0.name);

				expect(typeof studiocmsAuth0).toBe('function');
				expect(studiocmsAuth0.name).toBe('studiocmsAuth0');
			}
		);

		await allure.step('Should return a valid StudioCMSPlugin object', async (ctx) => {
			await ctx.parameter('pluginIdentifier', plugin.identifier);
			await ctx.parameter('pluginName', plugin.name);
			await ctx.parameter('hasHooks', String(plugin.hooks !== undefined));

			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/auth0');
			expect(plugin.name).toBe('StudioCMS Auth0 Provider Plugin');
			expect(plugin.hooks).toBeDefined();
		});
	});

	test('studiocms:config:setup Hook - Configures Auth0 OAuth Provider', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('studiocms:config:setup Hook Tests');
		await allure.tags(...sharedTags);

		await allure.step(
			'Should configure Auth0 as OAuth provider with correct settings',
			async (ctx) => {
				const hookResults = await tester.getHookResults();
				const oAuthProvider = hookResults.studiocmsConfig.hookResults.authService.oAuthProvider;

				await ctx.parameter('oAuthProvider', JSON.stringify(oAuthProvider, null, 2));

				expect(oAuthProvider).toBeDefined();
				expect(oAuthProvider?.name).toBe('auth0');
				expect(oAuthProvider?.formattedName).toBe('Auth0');
				expect(oAuthProvider?.endpointPath).toContain('endpoint.js');

				const requiredEnvVars =
					hookResults.studiocmsConfig.hookResults.authService.oAuthProvider?.requiredEnvVariables;

				await ctx.parameter('requiredEnvVariables', JSON.stringify(requiredEnvVars, null, 2));

				expect(requiredEnvVars).toContain('CMS_AUTH0_CLIENT_ID');
				expect(requiredEnvVars).toContain('CMS_AUTH0_CLIENT_SECRET');
				expect(requiredEnvVars).toContain('CMS_AUTH0_DOMAIN');
				expect(requiredEnvVars).toContain('CMS_AUTH0_REDIRECT_URI');
				expect(requiredEnvVars).toHaveLength(4);
			}
		);

		await allure.step('Should not have astro:config:setup hook defined', async (ctx) => {
			const hookResults = await tester.getHookResults();

			await ctx.parameter('astroConfigHasHook', String(hookResults.astroConfig.hasHook));
			await ctx.parameter(
				'astroConfigIntegrations',
				JSON.stringify(hookResults.astroConfig.hookResults.integrations, null, 2)
			);

			expect(hookResults.astroConfig.hasHook).toBe(false);
			expect(hookResults.astroConfig.hookResults.integrations).toEqual([]);
		});

		await allure.step('Should include Auth0 SVG logo', async (ctx) => {
			const hookResults = await tester.getHookResults();
			const oAuthProvider = hookResults.studiocmsConfig.hookResults.authService.oAuthProvider;

			await ctx.parameter('oAuthProviderSVG', oAuthProvider?.svg ?? 'undefined');

			expect(oAuthProvider?.svg).toBeDefined();
			expect(oAuthProvider?.svg).toContain('<svg');
			expect(oAuthProvider?.svg).toContain('oauth-logo');
			expect(oAuthProvider?.svg).toContain('viewBox="0 0 32 32"');
		});
	});
});
