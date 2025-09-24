import { StudioCMSPluginTester } from 'studiocms/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { studiocmsAuth0 } from '../src/index.js';

describe('@studiocms/auth0', () => {
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

	describe('plugin creation', () => {
		it('should create a plugin with correct metadata', () => {
			const pluginInfo = tester.getPluginInfo();
			expect(pluginInfo).toBeDefined();
			expect(pluginInfo.identifier).toBe('@studiocms/auth0');
			expect(pluginInfo.name).toBe('StudioCMS Auth0 Provider Plugin');
			expect(pluginInfo.studiocmsMinimumVersion).toBe('0.1.0-beta.22');
			expect(pluginInfo.requires).toBeUndefined();
		});

		it('should export default function', () => {
			expect(typeof studiocmsAuth0).toBe('function');
			expect(studiocmsAuth0.name).toBe('studiocmsAuth0');
		});

		it('should return a valid StudioCMSPlugin object', () => {
			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/auth0');
			expect(plugin.name).toBe('StudioCMS Auth0 Provider Plugin');
			expect(plugin.hooks).toBeDefined();
		});
	});

	describe('hooks', () => {
		it('should have the correct hooks defined', async () => {
			const hookResults = await tester.getHookResults();

			expect(hookResults.studiocmsConfig).toBeDefined();
			expect(hookResults.studiocmsConfig.hasHook).toBe(true);
		});

		it('should configure Auth0 OAuth provider in studiocms config hook', async () => {
			const hookResults = await tester.getHookResults();

			expect(hookResults.studiocmsConfig.hookResults.authService).toBeDefined();
			expect(hookResults.studiocmsConfig.hookResults.authService.oAuthProvider).toBeDefined();

			const oAuthProvider = hookResults.studiocmsConfig.hookResults.authService.oAuthProvider;
			expect(oAuthProvider).toBeDefined();
			expect(oAuthProvider?.name).toBe('auth0');
			expect(oAuthProvider?.formattedName).toBe('Auth0');
			expect(oAuthProvider?.endpointPath).toContain('endpoint.js');
		});

		it('should define required environment variables', async () => {
			const hookResults = await tester.getHookResults();
			const oAuthProvider = hookResults.studiocmsConfig.hookResults.authService.oAuthProvider;

			expect(oAuthProvider?.requiredEnvVariables).toEqual([
				'CMS_AUTH0_CLIENT_ID',
				'CMS_AUTH0_CLIENT_SECRET',
				'CMS_AUTH0_DOMAIN',
				'CMS_AUTH0_REDIRECT_URI',
			]);
		});

		it('should include Auth0 SVG logo', async () => {
			const hookResults = await tester.getHookResults();
			const oAuthProvider = hookResults.studiocmsConfig.hookResults.authService.oAuthProvider;

			expect(oAuthProvider?.svg).toBeDefined();
			expect(oAuthProvider?.svg).toContain('<svg');
			expect(oAuthProvider?.svg).toContain('oauth-logo');
			expect(oAuthProvider?.svg).toContain('viewBox="0 0 32 32"');
		});

		it('should not have astro config hook', async () => {
			const hookResults = await tester.getHookResults();

			expect(hookResults.astroConfig.hasHook).toBe(false);
			expect(hookResults.astroConfig.hookResults.integrations).toEqual([]);
		});
	});

	describe('plugin structure', () => {
		it('should have correct plugin identifier', () => {
			expect(plugin.identifier).toBe('@studiocms/auth0');
		});

		it('should have correct plugin name', () => {
			expect(plugin.name).toBe('StudioCMS Auth0 Provider Plugin');
		});

		it('should have correct minimum version requirement', () => {
			expect(plugin.studiocmsMinimumVersion).toBe('0.1.0-beta.22');
		});

		it('should have no required dependencies', () => {
			expect(plugin.requires).toBeUndefined();
		});

		it('should have hooks object', () => {
			expect(plugin.hooks).toBeDefined();
			expect(typeof plugin.hooks).toBe('object');
		});
	});

	describe('hook implementation', () => {
		it('should have studiocms:config:setup hook', () => {
			expect(plugin.hooks['studiocms:config:setup']).toBeDefined();
			expect(typeof plugin.hooks['studiocms:config:setup']).toBe('function');
		});

		it('should not have other hooks', () => {
			const hookKeys = Object.keys(plugin.hooks);
			expect(hookKeys).toEqual(['studiocms:config:setup']);
		});
	});

	describe('OAuth provider configuration', () => {
		it('should configure Auth0 as OAuth provider', async () => {
			const hookResults = await tester.getHookResults();
			const authService = hookResults.studiocmsConfig.hookResults.authService;

			expect(authService.oAuthProvider).toBeDefined();
			expect(authService.oAuthProvider?.name).toBe('auth0');
			expect(authService.oAuthProvider?.formattedName).toBe('Auth0');
		});

		it('should set correct endpoint path', async () => {
			const hookResults = await tester.getHookResults();
			const oAuthProvider = hookResults.studiocmsConfig.hookResults.authService.oAuthProvider;

			expect(oAuthProvider?.endpointPath).toContain('endpoint.js');
			expect(oAuthProvider?.endpointPath).not.toContain('endpoint.ts');
		});

		it('should include all required Auth0 environment variables', async () => {
			const hookResults = await tester.getHookResults();
			const requiredEnvVars = hookResults.studiocmsConfig.hookResults.authService.oAuthProvider?.requiredEnvVariables;

			expect(requiredEnvVars).toContain('CMS_AUTH0_CLIENT_ID');
			expect(requiredEnvVars).toContain('CMS_AUTH0_CLIENT_SECRET');
			expect(requiredEnvVars).toContain('CMS_AUTH0_DOMAIN');
			expect(requiredEnvVars).toContain('CMS_AUTH0_REDIRECT_URI');
			expect(requiredEnvVars).toHaveLength(4);
		});
	});
});
