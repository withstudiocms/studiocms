import type { AstroIntegration, AstroIntegrationLogger } from 'astro';
import type { StudioCMSPlugin } from './plugins.js';
import type {
	SCMSAuthServiceFnOpts,
	SCMSDashboardFnOpts,
	SCMSFrontendFnOpts,
	SCMSImageServiceFnOpts,
	SCMSRenderingFnOpts,
	SCMSSiteMapFnOpts,
} from './schemas/index.js';

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
	private plugin: StudioCMSPlugin;

	constructor(plugin: StudioCMSPlugin) {
		this.plugin = plugin;
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
	private async runAstroConfigHook() {
		const integrations: AstroIntegration[] = [];
		if (
			this.plugin.hooks['studiocms:astro:config'] &&
			typeof this.plugin.hooks['studiocms:astro:config'] === 'function'
		) {
			await this.plugin.hooks['studiocms:astro:config']({
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
	private async runStudioCMSConfigHook() {
		const setAuthService: Partial<SCMSAuthServiceFnOpts> = {};
		const setDashboard: Partial<SCMSDashboardFnOpts> = {};
		const setFrontend: Partial<SCMSFrontendFnOpts> = {};
		const setImageService: Partial<SCMSImageServiceFnOpts> = {};
		const setRendering: Partial<SCMSRenderingFnOpts> = {};
		const setSitemap: Partial<SCMSSiteMapFnOpts> = {};

		if (
			this.plugin.hooks['studiocms:config:setup'] &&
			typeof this.plugin.hooks['studiocms:config:setup'] === 'function'
		) {
			await this.plugin.hooks['studiocms:config:setup']({
				logger: this.createMockLogger(),
				setAuthService: ({ oAuthProvider }) => {
					if (oAuthProvider) {
						setAuthService.oAuthProvider = oAuthProvider;
					}
				},
				setDashboard: ({ dashboardGridItems, dashboardPages }) => {
					if (dashboardGridItems) {
						setDashboard.dashboardGridItems = dashboardGridItems;
					}
					if (dashboardPages) {
						setDashboard.dashboardPages = dashboardPages;
					}
				},
				setFrontend: ({ frontendNavigationLinks }) => {
					if (frontendNavigationLinks) {
						setFrontend.frontendNavigationLinks = frontendNavigationLinks;
					}
				},
				setImageService: ({ imageService }) => {
					if (imageService) {
						setImageService.imageService = imageService;
					}
				},
				setRendering: ({ pageTypes }) => {
					if (pageTypes) {
						setRendering.pageTypes = pageTypes;
					}
				},
				setSitemap: ({ sitemaps, triggerSitemap }) => {
					if (sitemaps) {
						setSitemap.sitemaps = sitemaps;
					}
					if (triggerSitemap) {
						setSitemap.triggerSitemap = triggerSitemap;
					}
				},
			});
		}

		return {
			setAuthService,
			setDashboard,
			setFrontend,
			setImageService,
			setRendering,
			setSitemap,
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

	/**
	 * Asynchronously retrieves the results of configured plugin hooks.
	 *
	 * @returns An object containing the presence and results of the 'studiocms:astro:config' and 'studiocms:config:setup' hooks.
	 * - `astroConfig`: Indicates if the 'studiocms:astro:config' hook exists and provides its execution results.
	 * - `studiocmsConfig`: Indicates if the 'studiocms:config:setup' hook exists and provides its execution results.
	 */
	public async getHookResults() {
		return {
			astroConfig: {
				hasHook: !!this.plugin.hooks['studiocms:astro:config'],
				hookResults: await this.runAstroConfigHook(),
			},
			studiocmsConfig: {
				hasHook: !!this.plugin.hooks['studiocms:config:setup'],
				hookResults: await this.runStudioCMSConfigHook(),
			},
		};
	}
}
