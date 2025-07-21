/**
 * These triple-slash directives defines dependencies to various declaration files that will be
 * loaded when a user imports the StudioCMS integration in their Astro configuration file. These
 * directives must be first at the top of the file and can only be preceded by this comment.
 */
/// <reference types="@astrojs/db" preserve="true" />
/// <reference types="./global.d.ts" preserve="true" />
/// <reference types="./virtual.d.ts" preserve="true" />
/// <reference types="./theme.d.ts" preserve="true" />

import fs from 'node:fs';
import inlineMod, { defineModule } from '@inox-tools/inline-mod/vite';
import { runtimeLogger } from '@inox-tools/runtime-logger';
import ui from '@studiocms/ui';
import { addVirtualImports, createResolver, defineIntegration } from 'astro-integration-kit';
import { envField } from 'astro/config';
import { z } from 'astro/zod';
import { compare as semCompare } from 'semver';
import { loadEnv } from 'vite';
import { componentRegistryHandler } from './componentRegistry/handler.js';
import { StudioCMSMarkdownDefaults, makeDashboardRoute, routesDir } from './consts.js';
import { shared } from './lib/renderer/shared.js';
import { pluginHandler } from './pluginHandler.js';
import { routeHandler } from './routeHandler.js';
import type { StudioCMSConfig, StudioCMSOptions } from './schemas/index.js';
import { scriptHandler } from './scriptHandler.js';
import type { Messages } from './types.js';
import { addIntegrationArray } from './utils/addIntegrationArray.js';
import { checkAstroConfig } from './utils/astroConfigCheck.js';
import { changelogHelper } from './utils/changelog.js';
import { checkEnvKeys } from './utils/checkENV.js';
import { exists, watchStudioCMSConfig } from './utils/configManager.js';
import { configResolver } from './utils/configResolver.js';
import { getLatestVersion } from './utils/getLatestVersion.js';
import { integrationLogger } from './utils/integrationLogger.js';
import { nodeNamespaceBuiltinsAstro } from './utils/integrations.js';
import { readJson } from './utils/readJson.js';

// Resolver Function
const { resolve } = createResolver(import.meta.url);

// Read the package.json file for the package name and version
const { name: pkgName, version: pkgVersion } = readJson<{ name: string; version: string }>(
	resolve('../package.json')
);

// Load Environment Variables
const env = loadEnv('', process.cwd(), '');

// Renderer Component Resolver
const RendererComponent = resolve('./components/Renderer.astro');

// Default Custom Image Component Resolver
const defaultCustomImageComponent = resolve('./components/image/CustomImage.astro');

/**
 * Default PageType components for the default StudioCMS Plugin
 */
export const DefaultPageTypeComponents = {
	'studiocms/markdown': {
		pageContentComponent: resolve('./components/editors/markdown.astro'),
		rendererComponent: resolve('./components/renderers/studiocms-markdown.astro'),
	},
	'studiocms/html': {
		pageContentComponent: resolve('./components/editors/html.astro'),
		rendererComponent: resolve('./components/renderers/studiocms-html.astro'),
	},
};

/**
 * **StudioCMS Integration**
 *
 * A CMS built for Astro by the Astro Community for the Astro Community.
 *
 * @see The [GitHub Repo: `withstudiocms/studiocms`](https://github.com/withstudiocms/studiocms) for more information on how to contribute to StudioCMS.
 * @see The [StudioCMS Docs](https://docs.studiocms.dev) for more information on how to use StudioCMS.
 *
 */
export const studiocms = defineIntegration({
	name: pkgName,
	optionsSchema: z.custom<StudioCMSOptions>(),
	setup: ({ name, options: opts }) => {
		// Resolved Options for StudioCMS
		let options: StudioCMSConfig;

		// Messages Array for Logging
		const messages: Messages = [];

		// Component Registry for Custom user Components
		let ComponentRegistry: Record<string, string>;

		// Define the resolved Callout Theme
		let resolvedCalloutTheme: string | undefined;

		let cacheJsonFile: URL | undefined = undefined;

		let isDevMode = false;

		// Return the Integration
		return {
			name,
			hooks: {
				// Expose plugins defined in Astro config
				'studiocms:plugins': ({ exposePlugins }) => {
					exposePlugins(opts?.plugins);
				},
				// DB Setup: Setup the Database Connection for AstroDB and StudioCMS
				'astro:db:setup': ({ extendDb }) => {
					extendDb({ configEntrypoint: resolve('./db/config.js') });
				},
				'astro:config:setup': async (params) => {
					// Destructure the params
					const { logger, config, updateConfig, createCodegenDir, command, addMiddleware } = params;

					const { resolve: astroConfigResolve } = createResolver(config.root.pathname);

					logger.info('Checking configuration...');

					isDevMode = command === 'dev';

					// Watch the StudioCMS Config File
					watchStudioCMSConfig(params);

					// Resolve the StudioCMS Configuration
					options = await configResolver(params, opts);

					const {
						dbStartPage,
						plugins,
						verbose,
						componentRegistry,
						features: {
							developerConfig,
							pageTypeOptions,
							robotsTXT: robotsTXTConfig,
							injectQuickActionsMenu,
							dashboardConfig: { dashboardEnabled, inject404Route, dashboardRouteOverride },
							authConfig,
						},
					} = options;

					const shouldInject404Route = inject404Route && dashboardEnabled;

					// Create logInfo object
					const logInfo = { logger, logLevel: 'info' as const, verbose };

					// Check for Component Registry
					if (componentRegistry) ComponentRegistry = componentRegistry;

					const dashboardRoute = makeDashboardRoute(dashboardRouteOverride);
					// Setup Logger
					integrationLogger(logInfo, 'Setting up StudioCMS...');

					runtimeLogger(params, {
						name: 'studiocms-runtime',
					});

					// Check Astro Config for required settings
					checkAstroConfig(params);

					// Setup Logger
					integrationLogger(logInfo, 'Setting up StudioCMS internals...');

					checkEnvKeys(logger, options);

					changelogHelper(params);

					// Resolve the callout theme based on the user's configuration
					if (
						pageTypeOptions.markdown.flavor === 'studiocms' &&
						pageTypeOptions.markdown.callouts !== false
					) {
						resolvedCalloutTheme = resolve(
							`./styles/md-remark-callouts/${pageTypeOptions.markdown.callouts || 'obsidian'}.css`
						);
					}

					const {
						extraRoutes,
						integrations: newIntegrations,
						safePluginList,
						messages: pluginMessages,
					} = await pluginHandler(params, {
						dashboardRoute,
						dbStartPage,
						name,
						pkgVersion,
						plugins,
						robotsTXTConfig,
						verbose,
					});

					// Setup Component Registry
					await componentRegistryHandler(params, {
						name,
						verbose,
						astroConfigResolve,
						componentRegistry: ComponentRegistry,
					});

					// Setup Routes
					routeHandler(params, {
						authConfig,
						dashboardEnabled,
						dashboardRoute,
						dbStartPage,
						developerConfig,
						extraRoutes,
						shouldInject404Route,
					});

					// Setup Scripts
					scriptHandler(params, {
						dbStartPage,
						injectQuickActionsMenu,
						pageTypeOptions,
					});

					if (!dbStartPage)
						addMiddleware({ order: 'pre', entrypoint: routesDir.middleware('index.ts') });

					// Setup StudioCMS Integrations Array (Default Integrations)
					const integrations = [
						{ integration: nodeNamespaceBuiltinsAstro() },
						{ integration: ui({ noInjectCSS: true }) },
					];

					if (newIntegrations.length > 0) {
						integrations.push(...newIntegrations);
					}

					// Inject Integrations into Astro project
					addIntegrationArray(params, integrations);

					// Inject Virtual modules
					integrationLogger(logInfo, 'Adding Virtual Imports...');

					defineModule('studiocms:config', {
						defaultExport: options,
						constExports: {
							dashboardConfig: options.features.dashboardConfig,
							authConfig: options.features.authConfig,
							AuthConfig: options.features.authConfig,
							developerConfig: options.features.developerConfig,
							sdk: options.features.sdk,
						},
					});

					defineModule('studiocms:plugins', {
						defaultExport: safePluginList,
					});

					defineModule('studiocms:version', {
						defaultExport: pkgVersion,
					});

					addVirtualImports(params, {
						name,
						imports: {
							// Core Virtual Components
							'studiocms:components': `
								export { default as FormattedDate } from '${resolve(
									'./components/FormattedDate.astro'
								)}';
								export { default as Generator } from '${resolve('./components/Generator.astro')}';
							`,

							// StudioCMS lib
							'studiocms:lib': `
								export * from '${resolve('./lib/head.js')}';
								export * from '${resolve('./lib/headDefaults.js')}';
								export * from '${resolve('./lib/jsonUtils.js')}';
								export * from '${resolve('./lib/pathGenerators.js')}';
								export * from '${resolve('./lib/removeLeadingTrailingSlashes.js')}';
								export * from '${resolve('./lib/routeMap.js')}';
								export * from '${resolve('./lib/urlGen.js')}';
							`,

							'studiocms:mailer': `
								export * from '${resolve('./lib/mailer/index.js')}';
							`,
							'studiocms:mailer/templates': `
								import { getTemplate } from '${resolve('./lib/mailer/template.js')}';
								export { getTemplate };
								export default getTemplate;
							`,

							'studiocms:notifier': `
								export * from '${resolve('./lib/notifier/index.js')}';
							`,
							'studiocms:notifier/client': `
								export * from '${resolve('./lib/notifier/client.js')}';
							`,

							// SDK Virtual Modules
							'virtual:studiocms/sdk/env': `
								export const dbUrl = '${env.ASTRO_DB_REMOTE_URL}';
								export const dbSecret = '${env.ASTRO_DB_APP_TOKEN}';
								export const cmsEncryptionKey = '${env.CMS_ENCRYPTION_KEY}';
							`,

							'studiocms:sdk': `
							    export * from '${resolve('./sdk/index.js')}';
								import studioCMS_SDK from '${resolve('./sdk/index.js')}';
								export default studioCMS_SDK;
							`,
							'studiocms:sdk/cache': `
								export * from '${resolve('./sdk/cache.js')}';
								import studioCMS_SDK_Cache from '${resolve('./sdk/cache.js')}';
								export default studioCMS_SDK_Cache;
							`,
							'studiocms:sdk/types': `
								export * from '${resolve('./sdk/types.js')}';
							`,

							// i18n Virtual Module
							'studiocms:i18n': `
								export * from '${resolve('./lib/i18n/index.js')}';
								export { default as LanguageSelector } from '${resolve('./lib/i18n/LanguageSelector.astro')}';
							`,
							'studiocms:i18n/client': `
								export * from '${resolve('./lib/i18n/client.js')}';
							`,

							'studiocms:logger': `
								import { logger as _logger } from '@it-astro:logger:studiocms-runtime';

								export const logger = _logger.fork('studiocms:runtime');

								export default logger;

								const apiLogger = _logger.fork('studiocms:runtime/api');

								export const isVerbose = ${verbose};

								function buildErrorMessage(message, error) {
									if (!error) return message;
									if (error instanceof Error) return message + ': ' + error.message + '\\n' + error.stack;
									return message + ': ' + error;
								};

								export function apiResponseLogger(status, message, error) {
									if (status !== 200) {
										apiLogger.error(buildErrorMessage(message, error));
										return new Response(JSON.stringify({ error: message }), { 
											status, 
											headers: { 'Content-Type': 'application/json' } 
										});
									}
									isVerbose &&  apiLogger.info(message);
									return new Response(JSON.stringify({ message }), { 
										status, 
										headers: { 'Content-Type': 'application/json' } 
									});
								};
							`,

							// Plugin Helpers
							'studiocms:plugin-helpers': `
								export * from "${resolve('./plugins.js')}";
								export * from "${resolve('./lib/plugins/index.js')}";
							`,

							// Renderer Virtual Imports
							'studiocms:renderer/config': `
								export default ${JSON.stringify(options.features.pageTypeOptions.markdown)};
							`,
							'studiocms:renderer': `
								export { default as StudioCMSRenderer } from '${RendererComponent}';
							`,
							'studiocms:renderer/markdown-remark/css': `
								import '${resolve('./styles/md-remark-headings.css')}';
								${resolvedCalloutTheme ? `import '${resolvedCalloutTheme}';` : ''}
							`,

							// Image Handler Virtual Imports
							'studiocms:imageHandler/components': `
								export { default as CustomImage } from '${defaultCustomImageComponent}';
							`,

							// Auth Virtual Imports
							'studiocms:auth/lib': `
								export * from '${resolve('./lib/auth/index.js')}';
							`,
							'studiocms:auth/lib/encryption': `
								export * from '${resolve('./lib/auth/encryption.js')}'
							`,
							'studiocms:auth/lib/password': `
								export * from '${resolve('./lib/auth/password.js')}'
							`,
							'studiocms:auth/lib/session': `
								export * from '${resolve('./lib/auth/session.js')}'
							`,
							'studiocms:auth/lib/types': `
								export * from '${resolve('./lib/auth/types.js')}'
							`,
							'studiocms:auth/lib/user': `
								export * from '${resolve('./lib/auth/user.js')}'
							`,
							'studiocms:auth/lib/verify-email': `
								export * from '${resolve('./lib/auth/verify-email.js')}';
							`,
							'studiocms:auth/utils/authEnvCheck': `
								export * from '${resolve('./utils/authEnvCheck.js')}'
							`,
							'studiocms:auth/utils/validImages': `
								export * from '${resolve('./utils/validImages.js')}'
							`,
							'studiocms:auth/utils/getLabelForPermissionLevel': `
								export * from '${resolve('./utils/getLabelForPermissionLevel.js')}'
							`,
							'studiocms:auth/scripts/three': `
								import '${resolve('./scripts/three.js')}';
							`,
						},
					});

					// Update the Astro Config
					integrationLogger(
						logInfo,
						'Updating Astro Config with StudioCMS Resources and settings...'
					);
					updateConfig({
						image: {
							remotePatterns: [
								{
									protocol: 'https',
								},
								{
									protocol: 'http',
								},
							],
						},
						vite: {
							plugins: [inlineMod()],
							optimizeDeps: {
								exclude: ['three'],
							},
						},
						env: {
							validateSecrets: true,
							schema: {
								// Auth Encryption Key
								CMS_ENCRYPTION_KEY: envField.string({
									context: 'server',
									access: 'secret',
									optional: false,
								}),
								// GitHub Auth Provider Environment Variables
								CMS_GITHUB_CLIENT_ID: envField.string({
									context: 'server',
									access: 'secret',
									optional: true,
								}),
								CMS_GITHUB_CLIENT_SECRET: envField.string({
									context: 'server',
									access: 'secret',
									optional: true,
								}),
								CMS_GITHUB_REDIRECT_URI: envField.string({
									context: 'server',
									access: 'secret',
									optional: true,
								}),
								// Discord Auth Provider Environment Variables
								CMS_DISCORD_CLIENT_ID: envField.string({
									context: 'server',
									access: 'secret',
									optional: true,
								}),
								CMS_DISCORD_CLIENT_SECRET: envField.string({
									context: 'server',
									access: 'secret',
									optional: true,
								}),
								CMS_DISCORD_REDIRECT_URI: envField.string({
									context: 'server',
									access: 'secret',
									optional: true,
								}),
								// Google Auth Provider Environment Variables
								CMS_GOOGLE_CLIENT_ID: envField.string({
									context: 'server',
									access: 'secret',
									optional: true,
								}),
								CMS_GOOGLE_CLIENT_SECRET: envField.string({
									context: 'server',
									access: 'secret',
									optional: true,
								}),
								CMS_GOOGLE_REDIRECT_URI: envField.string({
									context: 'server',
									access: 'secret',
									optional: true,
								}),
								// Auth0 Auth Provider Environment Variables
								CMS_AUTH0_CLIENT_ID: envField.string({
									context: 'server',
									access: 'secret',
									optional: true,
								}),
								CMS_AUTH0_CLIENT_SECRET: envField.string({
									context: 'server',
									access: 'secret',
									optional: true,
								}),
								CMS_AUTH0_DOMAIN: envField.string({
									context: 'server',
									access: 'secret',
									optional: true,
								}),
								CMS_AUTH0_REDIRECT_URI: envField.string({
									context: 'server',
									access: 'secret',
									optional: true,
								}),
							},
						},
					});

					if (pluginMessages.length > 0) {
						messages.push(...pluginMessages);
					}

					const codegenDir = createCodegenDir();
					cacheJsonFile = new URL('cache.json', codegenDir);

					if (!exists(cacheJsonFile.href)) {
						fs.writeFileSync(cacheJsonFile, '{}', 'utf-8');
					}
				},
				// CONFIG DONE: Inject the Markdown configuration into the shared state
				'astro:config:done': ({ config }) => {
					// Inject the Markdown configuration into the shared state
					shared.astroMDRemark = config.markdown;
					shared.studiocmsHTML = options.features.pageTypeOptions.html;
					if (options.features.pageTypeOptions.markdown.flavor === 'studiocms') {
						shared.studiocmsMarkdown = options.features.pageTypeOptions.markdown;
					} else {
						shared.studiocmsMarkdown = {
							...StudioCMSMarkdownDefaults,
							sanitize: options.features.pageTypeOptions.markdown.sanitize,
						};
					}

					// Log Setup Complete
					messages.push({
						label: 'studiocms:setup',
						logLevel: 'info',
						message: 'Setup Complete. 🚀',
					});
				},
				// DEV SERVER: Check for updates on server start and log messages
				'astro:server:start': async ({ logger: l }) => {
					const logger = l.fork(`${name}:update-check`);

					try {
						const latestVersion = await getLatestVersion(pkgName, logger, cacheJsonFile, isDevMode);

						if (!latestVersion) {
							return;
						}

						const comparison = semCompare(pkgVersion, latestVersion);

						if (comparison === -1) {
							logger.warn(
								`A new version of '${name}' is available. Please update to ${latestVersion} using your favorite package manager.`
							);
						} else if (comparison === 0) {
							logger.info(`You are using the latest version of '${name}' (${pkgVersion})`);
						} else {
							logger.info(
								`You are using a newer version (${pkgVersion}) of '${name}' than the latest release (${latestVersion})`
							);
						}
					} catch (error) {
						if (error instanceof Error) {
							logger.error(`Error fetching latest version from npm registry: ${error.message}`);
						} else {
							// Handle the case where error is not an Error object
							logger.error(
								'An unknown error occurred while fetching the latest version from the npm registry.'
							);
						}
					}

					// Log all messages
					for (const { label, message, logLevel } of messages) {
						integrationLogger(
							{
								logger: l.fork(label),
								logLevel,
								verbose: logLevel === 'info' ? options.verbose : true,
							},
							message
						);
					}

					if (options.dbStartPage) {
						integrationLogger(
							{ logger, logLevel: 'warn', verbose: true },
							'Start Page is Enabled.  This will be the only page available until you initialize your database and disable the config option forcing this page to be displayed. To get started, visit http://localhost:4321/start/ in your browser to initialize your database. And Setup your installation.'
						);
					}

					if (options.features.developerConfig.demoMode !== false) {
						integrationLogger(
							{ logger, logLevel: 'info', verbose: true },
							'Demo Mode is Enabled. This means that the StudioCMS Dashboard will be available to the public using the provided credentials and the REST API has been disabled. To disable Demo Mode, set the `demoMode` option to `false` or remove the option in your StudioCMS configuration.'
						);
					}
				},
				// BUILD: Log messages at the end of the build
				'astro:build:done': ({ logger }) => {
					// Log messages at the end of the build
					for (const { label, message, logLevel } of messages) {
						integrationLogger(
							{
								logger: logger.fork(label),
								logLevel,
								verbose: logLevel === 'info' ? options.verbose : true,
							},
							message
						);
					}

					if (options.features.developerConfig.demoMode !== false) {
						integrationLogger(
							{ logger, logLevel: 'info', verbose: true },
							'Demo Mode is Enabled. This means that the StudioCMS Dashboard will be available to the public using the provided credentials and the REST API has been disabled. To disable Demo Mode, set the `demoMode` option to `false` or remove the option in your StudioCMS configuration.'
						);
					}
				},
			},
		};
	},
});

export default studiocms;
