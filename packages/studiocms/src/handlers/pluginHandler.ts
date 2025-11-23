import { deepmerge, runEffect } from '@withstudiocms/effect';
import {
	integrationLogger,
	type Messages,
	pluginLogger,
} from '@withstudiocms/internal_helpers/astro-integration';
import {
	convertToSafeString,
	pageContentComponentFilter,
	readJson,
	rendererComponentFilter,
} from '@withstudiocms/internal_helpers/utils';
import type { AstroIntegration, InjectedRoute } from 'astro';
import { AstroError } from 'astro/errors';
import type { z } from 'astro/zod';
import { addVirtualImports, createResolver, defineUtility } from 'astro-integration-kit';
import boxen from 'boxen';
import { compare as semCompare } from 'semver';
import { loadEnv } from 'vite';
import { StudioCMSDefaultRobotsConfig } from '../consts.js';
import { StudioCMSError } from '../errors.js';
import {
	checkForWebVitals,
	dynamicSitemap,
	type RobotsConfig,
	robotsTXT,
} from '../integrations/plugins.js';
import type {
	AvailableDashboardPages,
	BasePluginHooks,
	HookParameters,
	RenderAugmentSchema,
	SafePluginListItemType,
	SafePluginListType,
	StudioCMSPlugin,
} from '../schemas/index.js';
import type {
	PluginAugmentsTranslationCollection,
	PluginTranslationCollection,
	PluginTranslations,
} from '../schemas/plugins/i18n.js';
import type { GridItemInput } from '../schemas/plugins/shared.js';
import { buildTranslations, loadJsTranslations } from '../utils/lang-helper.js';

// Resolver Function
const { resolve } = createResolver(import.meta.url);

// Read the package.json file for the package name and version
const { version: pkgVersion } = readJson<{ name: string; version: string }>(
	resolve('../../package.json')
);

type VirtualImport = {
	id: string;
	content: string;
	context?: 'server' | 'client' | undefined;
};
type Imports = Record<string, string> | Array<VirtualImport>;

const translations = await loadJsTranslations('./plugin-i18n', import.meta.url);
const t = await buildTranslations(translations);

/**
 * **Default StudioCMS Plugin**
 *
 * **NOTE** - Internal use only
 *
 * The default StudioCMS Plugin that comes with StudioCMS.
 *
 * @see The [StudioCMS Docs](https://docs.studiocms.dev) for more information on how to use StudioCMS.
 */
export const defaultPlugin: StudioCMSPlugin = {
	name: 'StudioCMS (Built-in)',
	identifier: 'studiocms',
	studiocmsMinimumVersion: pkgVersion,
	hooks: {
		'studiocms:dashboard': ({ setDashboard }) => {
			setDashboard({
				translations,
				dashboardGridItems: [
					{
						name: 'overview',
						span: 1,
						variant: 'default',
						requiresPermission: 'editor',
						// biome-ignore lint/style/noNonNullAssertion: this is okay
						header: { title: t.getComponent('en', 'overview')!.title, icon: 'heroicons:bolt' },
						body: {
							html: '<totals></totals>',
							components: {
								totals: resolve('./plugin-components/Totals.astro'),
							},
						},
					},
					{
						name: 'recently-updated-pages',
						span: 2,
						variant: 'default',
						requiresPermission: 'editor',
						header: {
							// biome-ignore lint/style/noNonNullAssertion: this is okay
							title: t.getComponent('en', 'recently-updated-pages')!.title,
							icon: 'heroicons:document-arrow-up',
						},
						body: {
							html: '<recentlyupdatedpages></recentlyupdatedpages>',
							components: {
								recentlyupdatedpages: resolve('./plugin-components/Recently-updated-pages.astro'),
							},
						},
					},
					{
						name: 'recently-signed-up-users',
						span: 1,
						variant: 'default',
						requiresPermission: 'admin',
						header: {
							// biome-ignore lint/style/noNonNullAssertion: this is okay
							title: t.getComponent('en', 'recently-signed-up-users')!.title,
							icon: 'heroicons:user-group',
						},
						body: {
							html: '<recentlysignedupusers></recentlysignedupusers>',
							components: {
								recentlysignedupusers: resolve('./plugin-components/Recently-signed-up.astro'),
							},
						},
					},
					{
						name: 'recently-created-pages',
						span: 2,
						variant: 'default',
						requiresPermission: 'editor',
						header: {
							// biome-ignore lint/style/noNonNullAssertion: this is okay
							title: t.getComponent('en', 'recently-created-pages')!.title,
							icon: 'heroicons:document-plus',
						},
						body: {
							html: '<recentlycreatedpages></recentlycreatedpages>',
							components: {
								recentlycreatedpages: resolve('./plugin-components/Recently-created-pages.astro'),
							},
						},
					},
				],
			});
		},
	},
};

/**
 * Represents a plugin requirement, specifying the source of the plugin and its dependencies.
 *
 * @property source - The identifier or path to the plugin source.
 * @property requires - An array of strings listing the required dependencies for the plugin.
 */
type PluginRequire = {
	source: string;
	requires: string[];
};

/**
 * Verifies that all required plugins are present in the source list.
 *
 * Iterates through the provided `requires` array, checking if each plugin's required dependencies
 * are included in the `sourceList`. If any required plugins are missing, an error is thrown
 * detailing which plugins are missing their dependencies.
 *
 * @param sourceList - An array of plugin names that are currently installed or available.
 * @param requires - An array of objects describing each plugin and its required dependencies.
 * @throws {StudioCMSError} If any plugin is missing required dependencies.
 */
function verifyPluginRequires(sourceList: string[], requires: PluginRequire[]) {
	const missingRequirements: { source: string; missing: string[] }[] = [];

	for (const req of requires) {
		const { source, requires: requiredDeps } = req;

		const missing = requiredDeps.filter((r) => !sourceList.includes(r));
		if (missing.length > 0) {
			missingRequirements.push({ source, missing });
		}
	}

	if (missingRequirements.length > 0) {
		const errorMessage = missingRequirements
			.map(
				({ source, missing }) =>
					`Plugin ${source} requires the following plugins that are not installed: ${missing.join(
						', '
					)}`
			)
			.join('\n');

		throw new StudioCMSError(
			`Plugins missing requirements: ${errorMessage}`,
			'Some plugins require other plugins to be installed. Please install the required plugins.'
		);
	}
}

/**
 * Configuration options for the StudioCMS plugin handler.
 *
 * @property dbStartPage - Indicates whether to use the database for the start page.
 * @property verbose - Enables verbose logging output.
 * @property name - The name of the plugin or application.
 * @property pkgVersion - The version of the package.
 * @property plugins - An array of StudioCMSPlugin instances, or undefined if no plugins are provided.
 * @property robotsTXTConfig - Configuration for robots.txt, either a boolean or a RobotsConfig object.
 * @property dashboardRoute - A function that returns the dashboard route for a given path.
 */
type Options = {
	dbStartPage: boolean;
	verbose: boolean;
	name: string;
	pkgVersion: string;
	plugins: StudioCMSPlugin[] | undefined;
	robotsTXTConfig: boolean | RobotsConfig;
	dashboardRoute: (path: string) => string;
};

/**
 * Handles the setup and configuration of StudioCMS plugins during the Astro build process.
 *
 * This utility function is registered for the `astro:config:setup` hook and is responsible for:
 * - Initializing and validating StudioCMS plugins, including checking minimum version requirements.
 * - Collecting integrations, dashboard grid items, dashboard pages, plugin endpoints, renderers, image services, and other plugin-related data.
 * - Invoking plugin hooks (`studiocms:astro:config`, `studiocms:config:setup`) to allow plugins to register their features and integrations.
 * - Setting up virtual imports for plugin components, endpoints, renderers, and image services for use in the StudioCMS dashboard and editor.
 * - Managing sitemap and robots.txt integrations based on plugin and configuration options.
 * - Verifying plugin dependencies and requirements.
 * - Logging information about installed plugins and their configuration.
 *
 * @param params - Parameters provided by Astro during the config setup phase, including the logger.
 * @param options - StudioCMS configuration options, including plugins, dashboard route, robots.txt config, and other settings.
 * @returns An object containing:
 *   - `integrations`: Array of Astro integrations to be registered.
 *   - `extraRoutes`: Additional routes to be injected into the Astro app (e.g., dashboard plugin pages).
 *   - `safePluginList`: List of validated and processed plugins with their safe configuration data.
 *   - `messages`: Informational messages about the plugin setup process.
 *
 * @throws {StudioCMSError} If a plugin specifies an invalid minimum version requirement or if no rendering plugins are found.
 * @throws {AstroError} If no rendering plugins are installed.
 */
export const pluginHandler = defineUtility('astro:config:setup')(
	async (params, options: Options) => {
		const { logger, config } = params;

		const { dbStartPage, verbose, name, pkgVersion, plugins, robotsTXTConfig, dashboardRoute } =
			options;

		const logInfo = { logger, logLevel: 'info' as const, verbose };

		/////

		// List of Astro integrations
		const integrations: {
			integration: AstroIntegration;
		}[] = [];

		// Define the available Dashboard Grid Items
		const availableDashboardGridItems: GridItemInput[] = [];

		// Define the available Dashboard Pages
		const availableDashboardPages: AvailableDashboardPages = {
			user: [],
			admin: [],
		};

		// Define the Plugin Settings Endpoints
		const pluginSettingsEndpoints: {
			apiEndpoint: string;
			identifier: string;
			safeIdentifier: string;
		}[] = [];

		// Define if the Sitemap is enabled
		let sitemapEnabled = false;

		// Define the Sitemaps Array
		const sitemaps: {
			pluginName: string;
			sitemapXMLEndpointPath: string | URL;
		}[] = [];

		// Define the Plugin Endpoints
		const pluginEndpoints: {
			apiEndpoint: string;
			identifier: string;
			safeIdentifier: string;
		}[] = [];

		// Define the plugin renderers
		const pluginRenderers: {
			pageType: string;
			safePageType: string;
			content: string;
		}[] = [];

		const pluginAugments: (
			| {
					type: 'component';
					id: string;
					safeId: string;
					components: Record<string, string>;
			  }
			| {
					type: 'prefix';
					id: string;
					safeId: string;
					components: Record<string, string>;
					html: string;
			  }
			| {
					type: 'suffix';
					id: string;
					safeId: string;
					components: Record<string, string>;
					html: string;
			  }
		)[] = [];

		// Define the Safe Plugin List
		const safePluginList: SafePluginListType = [];

		// List of extra routes
		const extraRoutes: InjectedRoute[] = [];

		// List of messages
		const messages: Messages = [];

		// Count of rendering plugins
		let renderingPluginCount = 0;

		// source plugins installed
		const sourcePluginsList: string[] = [];

		// Define the list of requirements
		const pluginRequires: PluginRequire[] = [];

		// Define the Image Service Identifier Keys
		const imageServiceKeys: {
			identifier: string;
			safe: string;
		}[] = [];

		// Define the Image Service Endpoints
		const imageServiceEndpoints: string[] = [];

		// Define the Auth Service Endpoints
		const unInjectedAuthProviders: {
			name: string;
			safeName: string;
			formattedName: string;
			svg: string;
			endpoints: string;
			enabled: boolean;
		}[] = [];

		// Define if the OAuth providers are configured
		let oAuthProvidersConfigured = false;

		// Define the Virtual Imports mapping
		const VirtualImports: Imports = [];

		const pluginsTranslations: PluginTranslationCollection = {};

		const augmentTranslations: PluginAugmentsTranslationCollection = {};

		/////

		/**
		 * Runs a specified hook from the provided plugin hooks.
		 *
		 * @param hooks - An object containing the plugin hooks.
		 * @returns A function that takes a hook name and arguments, and executes the corresponding hook if it exists.
		 */
		function runHook({
			hooks,
			safeData,
		}: Pick<ReturnType<typeof getPluginData>, 'hooks' | 'safeData'>) {
			/**
			 * Executes a specified hook with the given arguments.
			 *
			 * @param hook - The name of the hook to execute.
			 * @param args - The arguments to pass to the hook function.
			 */
			return async <H extends keyof BasePluginHooks>(
				hook: H,
				args: Omit<HookParameters<H>, 'logger'>
			) => {
				if (typeof hooks[hook] === 'function') {
					return await hooks[hook]({
						// biome-ignore lint/suspicious/noExplicitAny: needed for dynamic hook args
						...(args as any),
						logger: pluginLogger(safeData.identifier, logger),
					});
				}
			};
		}

		function getAugmentTranslationsForAllLangs(translations: PluginTranslations) {
			const augmentCollection: PluginAugmentsTranslationCollection = {};

			for (const [lang, langData] of Object.entries(translations)) {
				if (langData.augments) {
					for (const [augmentKey, augmentValue] of Object.entries(langData.augments)) {
						if (!augmentCollection[lang]) {
							augmentCollection[lang] = { augments: {} };
						}
						augmentCollection[lang].augments[augmentKey] = augmentValue;
					}
				}
			}

			return augmentCollection;
		}

		function getPlugins() {
			// Check for `@astrojs/web-vitals` Integration
			const wvPlugin = checkForWebVitals(params, { name, verbose, version: pkgVersion });

			// Initialize and Add the default StudioCMS Plugin to the Safe Plugin List
			const pluginsToProcess: StudioCMSPlugin[] = [defaultPlugin];

			if (wvPlugin) pluginsToProcess.push(wvPlugin);

			if (plugins) pluginsToProcess.push(...plugins);

			return pluginsToProcess;
		}

		/**
		 * Extracts and validates plugin data, ensuring it meets the required format and version.
		 *
		 * @param plugin - The StudioCMSPlugin instance to process.
		 * @returns An object containing the validated plugin data, including hooks and other properties.
		 * @throws {StudioCMSError} If the plugin's minimum version requirement is not met.
		 */
		function getPluginData(plugin: StudioCMSPlugin) {
			const { studiocmsMinimumVersion = '0.0.0', hooks = {}, requires, ...safeData } = plugin;
			let comparison: number;
			try {
				comparison = semCompare(studiocmsMinimumVersion, pkgVersion);
			} catch (_error) {
				throw new StudioCMSError(
					`Plugin ${safeData.name} has invalid version requirement: ${studiocmsMinimumVersion}`,
					'The minimum version requirement must be a valid semver string.'
				);
			}
			if (comparison === 1) {
				throw new StudioCMSError(
					`Plugin ${safeData.name} requires StudioCMS version ${studiocmsMinimumVersion} or higher.`,
					`Plugin ${safeData.name} requires StudioCMS version ${studiocmsMinimumVersion} or higher. Please update StudioCMS to the required version, contact the plugin author to update the minimum version requirement or remove the plugin from the StudioCMS config.`
				);
			}

			return {
				hooks,
				requires,
				safeData,
			};
		}

		/**
		 * Registers an OAuth provider for the StudioCMS plugins.
		 *
		 * @param oAuthProvider - The OAuth provider to register.
		 * @param messages - The messages array to push any errors or warnings.
		 * @param unInjectedAuthProviders - The list of un-injected auth providers.
		 */
		function registerOAuthProvider(
			oAuthProvider: {
				endpointPath: string;
				formattedName: string;
				name: string;
				svg: string;
				requiredEnvVariables?: string[];
			},
			messages: Messages,
			unInjectedAuthProviders: Array<{
				name: string;
				safeName: string;
				formattedName: string;
				svg: string;
				endpoints: string;
				enabled: boolean;
			}>
		) {
			const { endpointPath, formattedName, name, svg, requiredEnvVariables } = oAuthProvider;
			const safeName = convertToSafeString(name);
			let enabled = true;
			const endpoints = `export { initSession as ${safeName}_initSession, initCallback as ${safeName}_initCallback } from '${endpointPath}';`;
			const env = loadEnv('', process.cwd(), '');

			if (requiredEnvVariables) {
				const missingKeys = requiredEnvVariables.filter((key) => !env[key] || env[key] === '');
				if (missingKeys.length > 0) {
					messages.push({
						label: `studiocms:plugins:${safeName}:missing-env-keys`,
						logLevel: 'error',
						message: boxen(
							`The following environment variables are required for ${name} to work: ${missingKeys.join(', ')}. Please set them in your environment.`,
							{ title: `Missing ${name} Environment Variables`, borderColor: 'red' }
						),
					});
					enabled = false;
				}
			}

			unInjectedAuthProviders.push({
				name,
				safeName,
				formattedName,
				svg,
				endpoints,
				enabled,
			});
		}

		function buildOAuthArtifacts(
			entries: {
				name: string;
				safeName: string;
				formattedName: string;
				svg: string;
				endpoints: string;
				enabled: boolean;
			}[]
		): {
			oAuthEndpoints: {
				content: string;
				enabled: boolean;
				safeName: string;
			}[];
			oAuthButtons: {
				label: string;
				image: string;
				enabled: boolean;
				safeName: string;
			}[];
		} {
			return entries
				.map(({ enabled, endpoints, formattedName, safeName, svg }) => ({
					endpoints: {
						content: endpoints,
						enabled,
						safeName,
					},
					button: {
						label: formattedName,
						image: svg,
						enabled,
						safeName,
					},
				}))
				.reduce(
					(acc, { endpoints, button }) => {
						acc.oAuthEndpoints.push(endpoints);
						acc.oAuthButtons.push(button);
						return acc;
					},
					{ oAuthEndpoints: [], oAuthButtons: [] } as {
						oAuthEndpoints: { content: string; enabled: boolean; safeName: string }[];
						oAuthButtons: { label: string; image: string; enabled: boolean; safeName: string }[];
					}
				);
		}

		function convertToRuntimeAugment(augment: z.infer<typeof RenderAugmentSchema>) {
			const id = augment.id;
			const safeId = convertToSafeString(id);
			const type = augment.type;

			const components: Record<string, string> = {};

			if (augment.components) {
				for (const [key, value] of Object.entries(augment.components)) {
					components[key] = rendererComponentFilter(value, convertToSafeString(safeId + key));
				}
			}

			if (type === 'component') {
				return {
					id,
					safeId,
					type,
					components,
				};
			}
			return { id, safeId, type, components, html: augment.html };
		}

		/////

		integrationLogger(logInfo, 'Setting up StudioCMS plugins...');

		// If dbStartPage is true, we will process the plugins but only get the Auth Providers
		// for usage during First-time-setup. No other plugins will be processed.
		if (dbStartPage) {
			const pluginsToProcess = getPlugins();

			for (const plugin of pluginsToProcess) {
				const { hooks, requires, safeData } = getPluginData(plugin);

				const hookRunner = runHook({ hooks, safeData });

				await hookRunner('studiocms:auth', {
					setAuthService({ oAuthProvider }) {
						if (oAuthProvider)
							registerOAuthProvider(oAuthProvider, messages, unInjectedAuthProviders);
					},
				});

				if (requires) {
					pluginRequires.push({
						source: safeData.identifier,
						requires,
					});
				}

				sourcePluginsList.push(safeData.identifier);
			}

			// Verify Plugin Requirements
			verifyPluginRequires(sourcePluginsList, pluginRequires);

			const { oAuthButtons, oAuthEndpoints } = buildOAuthArtifacts(unInjectedAuthProviders);

			if (oAuthEndpoints.length > 0) {
				oAuthProvidersConfigured = true;
			}

			// Add the Virtual Imports for the Auth Providers
			VirtualImports.push(
				{
					id: 'virtual:studiocms:plugins/auth/providers',
					content: `
						${oAuthEndpoints.map(({ content }) => content).join('\n')}
					`,
				},
				{
					id: 'studiocms:plugins/auth/providers',
					content: `
						import * as providers from 'virtual:studiocms:plugins/auth/providers';

						const oAuthEndpoints = ${JSON.stringify(oAuthEndpoints.map(({ safeName, enabled }) => ({ safeName, enabled })))};

						export const oAuthButtons = ${JSON.stringify(oAuthButtons)};

						export const oAuthProviders = oAuthEndpoints.map(({ safeName, enabled }) => ({
							safeName,
							enabled,
							initSession: providers[safeName + '_initSession'] || null,
							initCallback: providers[safeName + '_initCallback'] || null,
						}));
					`,
				}
			);
		}

		// If dbStartPage is false, we will process the plugins and get all the data
		// for the StudioCMS Dashboard and Editors.
		if (!dbStartPage) {
			// Get the plugins to process
			const pluginsToProcess = getPlugins();

			// Resolve StudioCMS Plugins
			for (const plugin of pluginsToProcess) {
				const { hooks, requires, safeData } = getPluginData(plugin);

				let foundSettingsPage: SafePluginListItemType['settingsPage'];
				let foundFrontendNavigationLinks: SafePluginListItemType['frontendNavigationLinks'];
				let foundPageTypes: SafePluginListItemType['pageTypes'];

				const hookRunner = runHook({ hooks, safeData });

				await hookRunner('studiocms:astro-config', {
					addIntegrations(integration) {
						if (integration) {
							if (Array.isArray(integration)) {
								integrations.push(...integration.map((integration) => ({ integration })));
								return;
							}
							integrations.push({ integration });
						}
					},
				});

				await hookRunner('studiocms:auth', {
					setAuthService({ oAuthProvider }) {
						if (oAuthProvider)
							registerOAuthProvider(oAuthProvider, messages, unInjectedAuthProviders);
					},
				});

				await hookRunner('studiocms:dashboard', {
					async setDashboard({ dashboardGridItems, dashboardPages, settingsPage, translations }) {
						if (translations) {
							pluginsTranslations[convertToSafeString(safeData.identifier)] = translations;

							if (translations.en.augments) {
								const augmentTrans = getAugmentTranslationsForAllLangs(translations);

								for (const [lang, langData] of Object.entries(augmentTrans)) {
									if (!augmentTranslations[lang]) {
										augmentTranslations[lang] = { augments: {} };
									}

									augmentTranslations[lang] = await runEffect(
										deepmerge((merge) => merge(augmentTranslations[lang], langData))
									);
								}
							}
						}

						if (dashboardGridItems) {
							availableDashboardGridItems.push(
								...dashboardGridItems.map((item) => ({
									...item,
									name: `${convertToSafeString(safeData.identifier)}/${convertToSafeString(item.name)}`,
								}))
							);
						}

						if (dashboardPages) {
							if (dashboardPages.user) {
								availableDashboardPages.user?.push(
									...dashboardPages.user.map((page) => ({
										...page,
										slug: `${convertToSafeString(safeData.identifier)}/${convertToSafeString(page.route)}`,
									}))
								);
							}
							if (dashboardPages.admin) {
								availableDashboardPages.admin?.push(
									...dashboardPages.admin.map((page) => ({
										...page,
										slug: `${convertToSafeString(safeData.identifier)}/${convertToSafeString(page.route)}`,
									}))
								);
							}
						}

						if (settingsPage) {
							const { endpoint } = settingsPage;

							if (endpoint) {
								pluginSettingsEndpoints.push({
									identifier: safeData.identifier,
									safeIdentifier: convertToSafeString(safeData.identifier),
									apiEndpoint: `
											export { onSave as ${convertToSafeString(safeData.identifier)}_onSave } from '${endpoint}';
										`,
								});
							}

							foundSettingsPage = settingsPage;
						}
					},
				});

				await hookRunner('studiocms:sitemap', {
					setSitemap({ sitemaps: pluginSitemaps, triggerSitemap }) {
						if (triggerSitemap) sitemapEnabled = triggerSitemap;

						if (pluginSitemaps) {
							sitemaps.push(...pluginSitemaps);
						}
					},
				});

				await hookRunner('studiocms:frontend', {
					setFrontend({ frontendNavigationLinks }) {
						if (frontendNavigationLinks) {
							foundFrontendNavigationLinks = frontendNavigationLinks;
						}
					},
				});

				await hookRunner('studiocms:rendering', {
					setRendering({ pageTypes, augments }) {
						for (const { apiEndpoint, identifier, rendererComponent } of pageTypes || []) {
							if (apiEndpoint) {
								pluginEndpoints.push({
									identifier: identifier,
									safeIdentifier: convertToSafeString(identifier),
									apiEndpoint: `
											export { onCreate as ${convertToSafeString(identifier)}_onCreate } from '${apiEndpoint}';
											export { onEdit as ${convertToSafeString(identifier)}_onEdit } from '${apiEndpoint}';
											export { onDelete as ${convertToSafeString(identifier)}_onDelete } from '${apiEndpoint}';
										`,
								});
							}

							if (rendererComponent) {
								const builtIns = rendererComponentFilter(
									rendererComponent,
									convertToSafeString(identifier)
								);
								pluginRenderers.push({
									pageType: identifier,
									safePageType: convertToSafeString(identifier),
									content: builtIns,
								});

								renderingPluginCount++;
							}
						}

						foundPageTypes = pageTypes;

						// Handle Augments
						for (const augment of augments || []) {
							const runtimeAugment = convertToRuntimeAugment(augment);
							pluginAugments.push(runtimeAugment);
						}
					},
				});

				await hookRunner('studiocms:image-service', {
					setImageService({ imageService }) {
						if (imageService) {
							imageServiceKeys.push({
								identifier: imageService.identifier,
								safe: convertToSafeString(imageService.identifier),
							});

							imageServiceEndpoints.push(
								`export { default as ${convertToSafeString(imageService.identifier)} } from '${imageService.servicePath}';`
							);
						}
					},
				});

				if (requires) {
					pluginRequires.push({
						source: safeData.identifier,
						requires,
					});
				}

				sourcePluginsList.push(safeData.identifier);

				const safePlugin: SafePluginListItemType = {
					...safeData,
					settingsPage: foundSettingsPage,
					frontendNavigationLinks: foundFrontendNavigationLinks,
					pageTypes: foundPageTypes,
				};

				safePluginList.push(safePlugin);
			}

			if (renderingPluginCount === 0) {
				throw new AstroError(
					"No rendering plugins found, StudioCMS requires at least one rendering plugin. Please install one, such as '@studiocms/md' or '@studiocms/html'."
				);
			}

			// Verify Plugin Requirements
			verifyPluginRequires(sourcePluginsList, pluginRequires);

			const robotsDefaultConfig = StudioCMSDefaultRobotsConfig({
				config,
				sitemapEnabled,
				dashboardRoute,
			});

			// Robots.txt Integration (Default)
			if (robotsTXTConfig === true) {
				integrations.push({
					integration: robotsTXT(robotsDefaultConfig),
				});
			} else if (typeof robotsTXTConfig === 'object') {
				integrations.push({
					integration: robotsTXT({
						...robotsDefaultConfig,
						...robotsTXTConfig,
					}),
				});
			}

			if (sitemapEnabled) {
				integrations.push({
					integration: dynamicSitemap({ sitemaps }),
				});
			}

			// Inject Dashboard plugin page route, if any plugins have dashboard pages
			if (
				(availableDashboardPages.user && availableDashboardPages.user.length > 0) ||
				(availableDashboardPages.admin && availableDashboardPages.admin.length > 0)
			) {
				extraRoutes.push({
					pattern: dashboardRoute('[...pluginPage]'),
					entrypoint: 'studiocms/frontend/pages/[dashboard]/[...pluginPage].astro',
					prerender: false,
				});
			}

			const allPageTypes = safePluginList.flatMap(({ pageTypes }) => pageTypes || []);

			const { oAuthButtons, oAuthEndpoints } = buildOAuthArtifacts(unInjectedAuthProviders);

			if (oAuthEndpoints.length > 0) {
				oAuthProvidersConfigured = true;
			}

			VirtualImports.push(
				{
					id: 'virtual:studiocms/components/Editors',
					content: `
						import { convertToSafeString } from '${resolve('../utils/safeString.js')}';
						export const editorKeys = ${JSON.stringify([
							...allPageTypes.map(({ identifier }) => convertToSafeString(identifier)),
						])};
						${allPageTypes
							.map(({ identifier, pageContentComponent }) => {
								return pageContentComponentFilter(
									pageContentComponent,
									convertToSafeString(identifier)
								);
							})
							.join('\n')}
					`,
				},
				{
					id: 'studiocms:components/dashboard-grid-components',
					content: availableDashboardGridItems
						.map((item) => {
							const components: Record<string, string> = item.body?.components || {};

							const remappedComps = Object.entries(components).map(
								([key, value]) => `export { default as ${key} } from '${value}';`
							);

							return remappedComps.join('\n');
						})
						.join('\n'),
				},
				{
					id: 'studiocms:components/dashboard-grid-items',
					content: `
						import * as components from 'studiocms:components/dashboard-grid-components';

						const currentComponents = ${JSON.stringify(availableDashboardGridItems)};

						const dashboardGridItems = currentComponents.map((item) => {
							const gridItem = { ...item };

							if (gridItem.body?.components) {
								gridItem.body.components = Object.entries(gridItem.body.components).reduce(
									(acc, [key, value]) => ({
										...acc,
										[key]: components[key],
									}),
									{}
								);
							}

							return gridItem;
						});

						export default dashboardGridItems;
					`,
				},
				{
					id: 'studiocms:plugins/dashboard-pages/components/user',
					content:
						availableDashboardPages.user
							?.map(({ pageBodyComponent, pageActionsComponent, ...item }) => {
								const components: Record<string, string> = {
									pageBodyComponent,
								};

								if (item.sidebar === 'double') {
									components.innerSidebarComponent = item.innerSidebarComponent;
								}

								if (pageActionsComponent) {
									components.pageActionsComponent = pageActionsComponent;
								}

								const remappedComps = Object.entries(components).map(
									([key, value]) =>
										`export { default as ${convertToSafeString(item.title + key)} } from '${value}';`
								);

								return remappedComps.join('\n');
							})
							.join('\n') || '',
				},
				{
					id: 'studiocms:plugins/dashboard-pages/components/admin',
					content:
						availableDashboardPages.admin
							?.map(({ pageBodyComponent, pageActionsComponent, ...item }) => {
								const components: Record<string, string> = {
									pageBodyComponent,
								};

								if (item.sidebar === 'double') {
									components.innerSidebarComponent = item.innerSidebarComponent;
								}

								if (pageActionsComponent) {
									components.pageActionsComponent = pageActionsComponent;
								}

								const remappedComps = Object.entries(components).map(
									([key, value]) =>
										`export { default as ${convertToSafeString(item.title + key)} } from '${value}';`
								);

								return remappedComps.join('\n');
							})
							.join('\n') || '',
				},
				{
					id: 'studiocms:plugins/dashboard-pages/user',
					content: `
						import { convertToSafeString } from '${resolve('../utils/safeString.js')}';
						import * as components from 'studiocms:plugins/dashboard-pages/components/user';

						const currentComponents = ${JSON.stringify(availableDashboardPages.user || [])};

						const dashboardPages = currentComponents.map((item) => {
							const page = {
								...item,
								components: {
									PageBodyComponent: components[convertToSafeString(item.title + 'pageBodyComponent')],
									PageActionsComponent: components[convertToSafeString(item.title + 'pageActionsComponent')] || null,
									InnerSidebarComponent: item.sidebar === 'double' ? components[convertToSafeString(item.title + 'innerSidebarComponent')] || null : null,
								},
							};

							return page;
						});

						export default dashboardPages;
					`,
				},
				{
					id: 'studiocms:plugins/dashboard-pages/admin',
					content: `
						import { convertToSafeString } from '${resolve('../utils/safeString.js')}';
						import * as components from 'studiocms:plugins/dashboard-pages/components/admin';

						const currentComponents = ${JSON.stringify(availableDashboardPages.admin || [])};

						const dashboardPages = currentComponents.map((item) => {
							const page = {
								...item,
								components: {
									PageBodyComponent: components[convertToSafeString(item.title + 'pageBodyComponent')],
									PageActionsComponent: components[convertToSafeString(item.title + 'pageActionsComponent')] || null,
									InnerSidebarComponent: item.sidebar === 'double' ? components[convertToSafeString(item.title + 'innerSidebarComponent')] || null : null,
								},
							};

							return page;
						});

						export default dashboardPages;
					`,
				},
				{
					id: 'virtual:studiocms/plugins/endpoints',
					content: [
						pluginEndpoints.map(({ apiEndpoint }) => apiEndpoint).join('\n'),
						pluginSettingsEndpoints.map(({ apiEndpoint }) => apiEndpoint).join('\n'),
					].join('\n'),
				},
				{
					id: 'studiocms:plugins/endpoints',
					content: `
						import * as endpoints from 'virtual:studiocms/plugins/endpoints';

						const pluginEndpoints = ${JSON.stringify(
							pluginEndpoints.map(({ identifier, safeIdentifier }) => ({
								identifier,
								safeIdentifier,
							})) || []
						)};

						const pluginSettingsEndpoints = ${JSON.stringify(pluginSettingsEndpoints.map(({ identifier, safeIdentifier }) => ({ identifier, safeIdentifier })) || [])};

						export const apiEndpoints = pluginEndpoints.map(({ identifier, safeIdentifier }) => ({
							identifier,
							onCreate: endpoints[safeIdentifier + '_onCreate'] || null,
							onEdit: endpoints[safeIdentifier + '_onEdit'] || null,
							onDelete: endpoints[safeIdentifier + '_onDelete'] || null,
						}));

						export const settingsEndpoints = pluginSettingsEndpoints.map(({ identifier, safeIdentifier }) => ({
							identifier,
							onSave: endpoints[safeIdentifier + '_onSave'] || null,
						}));
					`,
				},
				{
					id: 'virtual:studiocms/plugins/renderers',
					content: pluginRenderers ? pluginRenderers.map(({ content }) => content).join('\n') : '',
				},
				{
					id: 'studiocms:plugins/renderers',
					content: `
						export const pluginRenderers = ${JSON.stringify(pluginRenderers.map(({ pageType, safePageType }) => ({ pageType, safePageType })) || [])};
					`,
				},
				{
					id: 'virtual:studiocms/plugins/augments',
					content: [...pluginAugments]
						.map(({ components }) =>
							Object.entries(components)
								// value is the "export { default as ... } from '...';" string
								.map(([_key, value]) => value)
								.join('\n')
						)
						.join('\n'),
				},
				{
					id: 'studiocms:plugins/augments',
					content: `
						import * as augments from 'virtual:studiocms/plugins/augments';
						import { convertToSafeString } from '${resolve('../utils/safeString.js')}';

						const pluginAugments = ${JSON.stringify(pluginAugments || [])};

						export const renderAugments = pluginAugments.map((entry) => {
							const { id, safeId, type, components } = entry;
							if (type === 'component') {
								return {
									id,
									type,
									components: Object.entries(components).reduce((acc, [key, value]) => ({
										...acc,
										[key]: augments[convertToSafeString(safeId + key)],
									}), {}),
								};
							}
							return {
								id,
								type,
								html: entry.html,
								components: Object.entries(components).reduce((acc, [key, value]) => ({
									...acc,
									[key]: augments[convertToSafeString(safeId + key)],
								}), {}),
							};
						});
					`,
				},
				{
					id: 'studiocms:plugins/imageService',
					content: `
						export const imageServiceKeys = ${JSON.stringify(imageServiceKeys)};

						${imageServiceEndpoints.length > 0 ? imageServiceEndpoints.join('\n') : ''}
					`,
				},
				{
					id: 'virtual:studiocms:plugins/auth/providers',
					content: oAuthEndpoints.map(({ content }) => content).join('\n'),
				},
				{
					id: 'studiocms:plugins/auth/providers',
					content: `
						import * as providers from 'virtual:studiocms:plugins/auth/providers';

						const oAuthEndpoints = ${JSON.stringify(oAuthEndpoints.map(({ safeName, enabled }) => ({ safeName, enabled })))};

						export const oAuthButtons = ${JSON.stringify(oAuthButtons)};

						export const oAuthProviders = oAuthEndpoints.map(({ safeName, enabled }) => ({
							safeName,
							enabled,
							initSession: providers[safeName + '_initSession'] || null,
							initCallback: providers[safeName + '_initCallback'] || null,
						}));
					`,
				}
			);
		}

		addVirtualImports(params, {
			name,
			imports: VirtualImports,
		});

		let pluginListLength = 0;
		let pluginListMessage = '';

		pluginListLength = safePluginList.length;
		pluginListMessage = safePluginList.map((p, i) => `${i + 1}. ${p.name}`).join('\n');

		const messageBox = boxen(pluginListMessage, {
			padding: 1,
			title: `Currently Installed StudioCMS Modules (${pluginListLength})`,
		});

		messages.push({
			label: 'studiocms:plugins',
			logLevel: 'info',
			message: ` \n \n${messageBox} \n \n`,
		});

		return {
			integrations,
			extraRoutes,
			safePluginList,
			messages,
			oAuthProvidersConfigured,
			pluginsTranslations,
			augmentTranslations,
		};
	}
);
