import type { AstroIntegration, AstroIntegrationLogger } from 'astro';
import type {
	SCMSAuthServiceFnOpts,
	SCMSDashboardFnOpts,
	SCMSFrontendFnOpts,
	SCMSImageServiceFnOpts,
	SCMSRenderingFnOpts,
	SCMSSiteMapFnOpts,
	StudioCMSPlugin,
} from './schemas/index.js';

type HookRun<T> = { hasHook: boolean; hookResults: T };
export interface PluginHookResults {
	astroConfig: HookRun<{ integrations: AstroIntegration[] }>;
	studiocmsConfig: HookRun<{
		authService: Partial<SCMSAuthServiceFnOpts>;
		dashboard: Partial<SCMSDashboardFnOpts>;
		frontend: Partial<SCMSFrontendFnOpts>;
		imageService: Partial<SCMSImageServiceFnOpts>;
		rendering: Partial<SCMSRenderingFnOpts>;
		sitemap: Partial<SCMSSiteMapFnOpts>;
	}>;
}
/**
 * Utility class for testing StudioCMS plugins by simulating hook execution and collecting results.
 *
 * The `StudioCMSPluginTester` provides methods to:
 * - Create mock loggers for use in plugin hooks.
 * - Execute the `studiocms:astro:config` and `studiocms:config:setup` hooks, if present, on a given plugin.
 * - Collect and return integration and configuration data set by these hooks.
 * - Retrieve basic plugin metadata.
 *
 * @remarks
 * This class is intended for use in test environments to facilitate inspection and validation of plugin behavior.
 *
 * @example
 * ```typescript
 * const tester = new StudioCMSPluginTester(myPlugin);
 * const info = tester.getPluginInfo();
 * const hookResults = await tester.getHookResults();
 * ```
 */
export class StudioCMSPluginTester {
	private readonly plugin: StudioCMSPlugin;
	private readonly injectedLogger?: AstroIntegrationLogger;

	constructor(plugin: StudioCMSPlugin, logger?: AstroIntegrationLogger) {
		this.plugin = plugin;
		this.injectedLogger = logger;
	}

	/**
	 * Creates a mock logger object for testing purposes.
	 *
	 * The returned logger implements the `AstroIntegrationLogger` interface and provides
	 * stubbed logging methods (`info`, `warn`, `error`, `debug`) that delegate to the corresponding
	 * `console` methods. It also includes a `fork` method, which returns a new mock logger
	 * instance with an attached label for testing logger forking behavior.
	 *
	 * @returns {AstroIntegrationLogger} A mock logger instance suitable for use in tests.
	 */
	private createMockLogger(): AstroIntegrationLogger {
		if (this.injectedLogger) return this.injectedLogger;
		// biome-ignore lint/suspicious/noExplicitAny: this is fine
		const logger: Record<string, any> = {
			info: console.log,
			warn: console.warn,
			error: console.error,
			debug: console.debug,
			fork: (label: string) => {
				// Each fork returns a new mock logger with the label attached for testing
				const forked = this.createMockLogger();
				forked.label = label;
				return forked;
			},
		};
		return logger as unknown as AstroIntegrationLogger;
	}

	/**
	 * Executes the 'studiocms:astro:config' hook if it exists on the plugin,
	 * providing a mock logger and a method to collect Astro integrations.
	 *
	 * @returns A promise that resolves to an object containing the collected integrations.
	 *
	 * @remarks
	 * This method checks if the plugin defines a 'studiocms:astro:config' hook as a function.
	 * If so, it invokes the hook with a mock logger and an `addIntegrations` callback,
	 * which accumulates integrations into an array. The collected integrations are then
	 * returned in an object.
	 */
	private async runAstroConfigHook(): Promise<{ integrations: AstroIntegration[] }> {
		const integrations: AstroIntegration[] = [];
		if (typeof this.plugin.hooks['studiocms:astro-config'] === 'function') {
			await this.plugin.hooks['studiocms:astro-config']({
				logger: this.createMockLogger(),
				addIntegrations: (newIntegrations) => {
					const toAdd = Array.isArray(newIntegrations) ? newIntegrations : [newIntegrations];
					integrations.push(...toAdd);
				},
			});
		}
		return { integrations };
	}

	/**
	 * Executes the `studiocms:config:setup` hook on the current plugin, if available,
	 * and collects configuration options set by the hook into partial option objects.
	 *
	 * This method mocks the hook's context by providing setter functions for various
	 * StudioCMS configuration aspects, such as authentication, dashboard, frontend,
	 * image service, rendering, and sitemap. Each setter captures the values provided
	 * by the hook and stores them in corresponding partial option objects.
	 *
	 * @returns A promise that resolves to an object containing the collected configuration
	 *          options for authentication service, dashboard, frontend, image service,
	 *          rendering, and sitemap.
	 *
	 * @remarks
	 * This utility is primarily intended for testing purposes, allowing inspection of
	 * configuration values set by a plugin's `studiocms:config:setup` hook.
	 */
	private async runStudioCMSConfigHook(): Promise<{
		authService: Partial<SCMSAuthServiceFnOpts>;
		dashboard: Partial<SCMSDashboardFnOpts>;
		frontend: Partial<SCMSFrontendFnOpts>;
		imageService: Partial<SCMSImageServiceFnOpts>;
		rendering: Partial<SCMSRenderingFnOpts>;
		sitemap: Partial<SCMSSiteMapFnOpts>;
	}> {
		const authService: Partial<SCMSAuthServiceFnOpts> = {};
		const dashboard: Partial<SCMSDashboardFnOpts> = {};
		const frontend: Partial<SCMSFrontendFnOpts> = {};
		const imageService: Partial<SCMSImageServiceFnOpts> = {};
		const rendering: Partial<SCMSRenderingFnOpts> = {};
		const sitemap: Partial<SCMSSiteMapFnOpts> = {};

		const hooks = this.plugin.hooks;

		const logger = this.createMockLogger();

		if (typeof hooks['studiocms:auth'] === 'function') {
			await hooks['studiocms:auth']({
				logger,
				setAuthService: ({ oAuthProvider }) => {
					if (oAuthProvider !== undefined) {
						authService.oAuthProvider = oAuthProvider;
					}
				},
			});
		}

		if (typeof hooks['studiocms:dashboard'] === 'function') {
			await hooks['studiocms:dashboard']({
				logger,
				setDashboard: ({ dashboardGridItems, dashboardPages }) => {
					if (dashboardGridItems !== undefined) {
						dashboard.dashboardGridItems = dashboardGridItems;
					}
					if (dashboardPages !== undefined) {
						dashboard.dashboardPages = dashboardPages;
					}
				},
			});
		}

		if (typeof hooks['studiocms:frontend'] === 'function') {
			await hooks['studiocms:frontend']({
				logger,
				setFrontend: ({ frontendNavigationLinks }) => {
					if (frontendNavigationLinks !== undefined) {
						frontend.frontendNavigationLinks = frontendNavigationLinks;
					}
				},
			});
		}

		if (typeof hooks['studiocms:image-service'] === 'function') {
			await hooks['studiocms:image-service']({
				logger,
				setImageService: ({ imageService: imgService }) => {
					if (imgService !== undefined) {
						imageService.imageService = imgService;
					}
				},
			});
		}

		if (typeof hooks['studiocms:rendering'] === 'function') {
			await hooks['studiocms:rendering']({
				logger,
				setRendering: ({ pageTypes }) => {
					if (pageTypes !== undefined) {
						rendering.pageTypes = pageTypes;
					}
				},
			});
		}

		if (typeof hooks['studiocms:sitemap'] === 'function') {
			await hooks['studiocms:sitemap']({
				logger,
				setSitemap: ({ sitemaps, triggerSitemap }) => {
					if (sitemaps !== undefined) {
						sitemap.sitemaps = sitemaps;
					}
					if (triggerSitemap !== undefined) {
						sitemap.triggerSitemap = triggerSitemap;
					}
				},
			});
		}
		return {
			authService,
			dashboard,
			frontend,
			imageService,
			rendering,
			sitemap,
		};
	}

	/**
	 * Retrieves information about the current plugin.
	 *
	 * @returns An object containing the plugin's identifier, name, minimum required StudioCMS version, and dependencies.
	 */
	public getPluginInfo() {
		return {
			identifier: this.plugin.identifier,
			name: this.plugin.name,
			studiocmsMinimumVersion: this.plugin.studiocmsMinimumVersion,
			requires: this.plugin.requires,
		};
	}

	private hasStudioCMSHooks(): boolean {
		if (!this.plugin.hooks) return false;
		const hookKeys = [
			'studiocms:auth',
			'studiocms:dashboard',
			'studiocms:frontend',
			'studiocms:image-service',
			'studiocms:rendering',
			'studiocms:sitemap',
		];
		return hookKeys.some((key) => typeof this.plugin.hooks[key] === 'function');
	}

	/**
	 * Asynchronously retrieves the results of configured plugin hooks.
	 *
	 * @returns An object containing the presence and results of the 'studiocms:astro:config' and 'studiocms:config:setup' hooks.
	 * - `astroConfig`: Indicates if the 'studiocms:astro:config' hook exists and provides its execution results.
	 * - `studiocmsConfig`: Indicates if the hooks exists and provides its execution results.
	 */
	public async getHookResults(): Promise<PluginHookResults> {
		return {
			astroConfig: {
				hasHook: typeof this.plugin.hooks['studiocms:astro-config'] === 'function',
				hookResults: await this.runAstroConfigHook(),
			},
			studiocmsConfig: {
				hasHook: this.hasStudioCMSHooks(),
				hookResults: await this.runStudioCMSConfigHook(),
			},
		};
	}
}

// TODO Create testers for Plugin Renderers as well as RendererAugments
