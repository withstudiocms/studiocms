import { StudioCMSPluginTester } from 'studiocms/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { studiocmsGithub } from '../src/index.js';

describe('@studiocms/github', () => {
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

	describe('plugin creation', () => {
		it('should create a plugin with correct metadata', () => {
			const pluginInfo = tester.getPluginInfo();
			expect(pluginInfo).toBeDefined();
			expect(pluginInfo.identifier).toBe('@studiocms/github');
			expect(pluginInfo.name).toBe('StudioCMS GitHub Plugin');
			expect(pluginInfo.studiocmsMinimumVersion).toBe('0.1.0-beta.22');
			expect(pluginInfo.requires).toBeUndefined();
		});

		it('should export default function', () => {
			expect(typeof studiocmsGithub).toBe('function');
			expect(studiocmsGithub.name).toBe('studiocmsGithub');
		});

		it('should return a valid StudioCMSPlugin object', () => {
			expect(plugin).toBeDefined();
			expect(plugin.identifier).toBe('@studiocms/github');
			expect(plugin.name).toBe('StudioCMS GitHub Plugin');
			expect(plugin.hooks).toBeDefined();
		});
	});

	describe('hooks', () => {
		it('should have the correct hooks defined', async () => {
			const hookResults = await tester.getHookResults();

			expect(hookResults.studiocmsConfig).toBeDefined();
			expect(hookResults.studiocmsConfig.hasHook).toBe(true);
		});

		it('should configure GitHub OAuth provider in studiocms config hook', async () => {
			const hookResults = await tester.getHookResults();

			expect(hookResults.studiocmsConfig.hookResults.authService).toBeDefined();
			expect(hookResults.studiocmsConfig.hookResults.authService.oAuthProvider).toBeDefined();

			const oAuthProvider = hookResults.studiocmsConfig.hookResults.authService.oAuthProvider;
			expect(oAuthProvider).toBeDefined();
			expect(oAuthProvider?.name).toBe('github');
			expect(oAuthProvider?.formattedName).toBe('GitHub');
			expect(oAuthProvider?.endpointPath).toContain('endpoint.js');
		});

		it('should define required environment variables', async () => {
			const hookResults = await tester.getHookResults();
			const oAuthProvider = hookResults.studiocmsConfig.hookResults.authService.oAuthProvider;

			expect(oAuthProvider?.requiredEnvVariables).toEqual([
				'CMS_GITHUB_CLIENT_ID',
				'CMS_GITHUB_CLIENT_SECRET',
				'CMS_GITHUB_REDIRECT_URI',
			]);
		});

		it('should include GitHub SVG logo', async () => {
			const hookResults = await tester.getHookResults();
			const oAuthProvider = hookResults.studiocmsConfig.hookResults.authService.oAuthProvider;

			expect(oAuthProvider?.svg).toBeDefined();
			expect(oAuthProvider?.svg).toContain('<svg');
			expect(oAuthProvider?.svg).toContain('oauth-logo');
			expect(oAuthProvider?.svg).toContain('viewBox="0 0 98 96"');
		});

		it('should not have astro config hook', async () => {
			const hookResults = await tester.getHookResults();

			expect(hookResults.astroConfig.hasHook).toBe(false);
			expect(hookResults.astroConfig.hookResults.integrations).toEqual([]);
		});
	});

	describe('plugin structure', () => {
		it('should have correct plugin identifier', () => {
			expect(plugin.identifier).toBe('@studiocms/github');
		});

		it('should have correct plugin name', () => {
			expect(plugin.name).toBe('StudioCMS GitHub Plugin');
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
		it('should configure GitHub as OAuth provider', async () => {
			const hookResults = await tester.getHookResults();
			const authService = hookResults.studiocmsConfig.hookResults.authService;

			expect(authService.oAuthProvider).toBeDefined();
			expect(authService.oAuthProvider?.name).toBe('github');
			expect(authService.oAuthProvider?.formattedName).toBe('GitHub');
		});

		it('should set correct endpoint path', async () => {
			const hookResults = await tester.getHookResults();
			const oAuthProvider = hookResults.studiocmsConfig.hookResults.authService.oAuthProvider;

			expect(oAuthProvider?.endpointPath).toContain('endpoint.js');
			expect(oAuthProvider?.endpointPath).not.toContain('endpoint.ts');
		});

		it('should include all required GitHub environment variables', async () => {
			const hookResults = await tester.getHookResults();
			const requiredEnvVars =
				hookResults.studiocmsConfig.hookResults.authService.oAuthProvider?.requiredEnvVariables;

			expect(requiredEnvVars).toContain('CMS_GITHUB_CLIENT_ID');
			expect(requiredEnvVars).toContain('CMS_GITHUB_CLIENT_SECRET');
			expect(requiredEnvVars).toContain('CMS_GITHUB_REDIRECT_URI');
			expect(requiredEnvVars).toHaveLength(3);
		});
	});
});
