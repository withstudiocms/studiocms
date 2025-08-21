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
import { runtimeLogger } from '@inox-tools/runtime-logger';
import ui from '@studiocms/ui';
import { componentRegistryHandler } from '@withstudiocms/component-registry';
import { configResolverBuilder, exists, watchConfigFileBuilder } from '@withstudiocms/config-utils';
import { envField } from 'astro/config';
import { z } from 'astro/zod';
import { addVirtualImports, createResolver, defineIntegration } from 'astro-integration-kit';
import { compare as semCompare } from 'semver';
import { loadEnv } from 'vite';
import {
	AstroConfigImageSettings,
	AstroConfigViteSettings,
	makeDashboardRoute,
	routesDir,
} from './consts.js';
import { nodeNamespaceBuiltinsAstro } from './integrations/node-namespace.js';
import { pluginHandler } from './pluginHandler.js';
import { routeHandler } from './routeHandler.js';
import {
	type StudioCMSConfig,
	type StudioCMSOptions,
	StudioCMSOptionsSchema,
} from './schemas/index.js';
import { scriptHandler } from './scriptHandler.js';
import type { Messages } from './types.js';
import { addIntegrationArray } from './utils/addIntegrationArray.js';
import { checkAstroConfig } from './utils/astroConfigCheck.js';
import { changelogHelper } from './utils/changelog.js';
import { getLatestVersion } from './utils/getLatestVersion.js';
import { integrationLogger } from './utils/integrationLogger.js';
import { readJson } from './utils/readJson.js';
import {
	buildAstroComponentVirtualExport,
	buildDefaultOnlyVirtual,
	buildDynamicAndAstroVirtualExport,
	buildDynamicOnlyVirtual,
	buildNamedMultiExportVirtual,
	buildNamedVirtual,
	buildVirtualAmbientScript,
	buildVirtualConfig,
} from './virtuals/utils.js';

// Resolver Function
const { resolve } = createResolver(import.meta.url);

// Read the package.json file for the package name and version
const { name: pkgName, version: pkgVersion } = readJson<{ name: string; version: string }>(
	resolve('../package.json')
);

// Load Environment Variables
const env = loadEnv('', process.cwd(), '');

const StudioCMSRendererComponentPath = './virtuals/components/Renderer.astro';
const CustomImageComponentPath = './virtuals/components/CustomImage.astro';

// Built-in Components for the Component Registry
const builtInComponents = {
	'cms-img': resolve(CustomImageComponentPath),
};

/**
 * Paths to search for the StudioCMS config file,
 * sorted by how likely they're to appear.
 */
const configPaths = [
	'studiocms.config.js',
	'studiocms.config.mjs',
	'studiocms.config.cjs',
	'studiocms.config.ts',
	'studiocms.config.mts',
	'studiocms.config.cts',
];

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

		// Watch Config File Builder
		const watchConfigFile = watchConfigFileBuilder({
			configPaths,
		});

		// Config Resolver Builder
		const configResolver = configResolverBuilder({
			configPaths,
			label: name,
			zodSchema: StudioCMSOptionsSchema,
		});

		// Messages Array for Logging
		const messages: Messages = [];

		// Cache JSON file for storing the latest version check
		let cacheJsonFile: URL | undefined;

		// Is the integration running in development mode?
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
					const { logger, updateConfig, createCodegenDir, command, addMiddleware } = params;

					logger.info('Checking configuration...');

					isDevMode = command === 'dev';

					// Watch the StudioCMS Config File
					watchConfigFile(params);

					// Load the configuration using the config resolver
					options = await configResolver(params, opts);

					const {
						dbStartPage,
						plugins,
						verbose,
						componentRegistry,
						features: {
							developerConfig,
							robotsTXT: robotsTXTConfig,
							injectQuickActionsMenu,
							dashboardConfig: { dashboardEnabled, inject404Route, dashboardRouteOverride },
							authConfig,
						},
					} = options;

					const shouldInject404Route = inject404Route && dashboardEnabled;

					// Create logInfo object
					const logInfo = { logger, logLevel: 'info' as const, verbose };

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

					changelogHelper(params);

					const {
						extraRoutes,
						integrations: newIntegrations,
						safePluginList,
						messages: pluginMessages,
						oAuthProvidersConfigured,
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
						config: {
							name,
							verbose,
							virtualId: 'studiocms:component-registry',
						},
						componentRegistry,
						builtInComponents,
					});

					// Setup Routes
					routeHandler(params, {
						oAuthProvidersConfigured,
						authConfig,
						dashboardEnabled,
						dashboardRoute,
						dbStartPage,
						developerConfig,
						extraRoutes,
						shouldInject404Route,
					});

					// Setup Scripts
					await scriptHandler(params, {
						dbStartPage,
						injectQuickActionsMenu,
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

					addVirtualImports(params, {
						name,
						imports: {
							'studiocms:config': buildVirtualConfig(options),
							'studiocms:plugins': buildDefaultOnlyVirtual(safePluginList),
							'studiocms:version': buildDefaultOnlyVirtual(pkgVersion),
							'virtual:studiocms/sdk/env': buildNamedMultiExportVirtual({
								dbUrl: env.ASTRO_DB_REMOTE_URL,
								dbSecret: env.ASTRO_DB_APP_TOKEN,
								cmsEncryptionKey: env.CMS_ENCRYPTION_KEY,
							}),
							'studiocms:lib': buildDynamicOnlyVirtual({
								resolve,
								items: [
									'./virtuals/lib/head.js',
									'./virtuals/lib/headDefaults.js',
									'./virtuals/lib/jsonUtils.js',
									'./virtuals/lib/pathGenerators.js',
									'./virtuals/lib/removeLeadingTrailingSlashes.js',
									'./virtuals/lib/routeMap.js',
									'./virtuals/lib/urlGen.js',
								],
							}),
							'studiocms:notifier': buildDynamicOnlyVirtual({
								resolve,
								items: ['./virtuals/notifier/index.js'],
							}),
							'studiocms:notifier/client': buildDynamicOnlyVirtual({
								resolve,
								items: ['./virtuals/notifier/client.js'],
							}),
							'studiocms:mailer': buildDynamicOnlyVirtual({
								resolve,
								items: ['./virtuals/mailer/index.js'],
							}),
							'studiocms:mailer/templates': buildNamedVirtual({
								resolve,
								namedExport: 'getTemplate',
								path: './virtuals/mailer/template.js',
								exportDefault: true,
							}),
							'studiocms:components': buildAstroComponentVirtualExport({
								resolve,
								items: {
									FormattedDate: './virtuals/components/FormattedDate.astro',
									Generator: './virtuals/components/Generator.astro',
								},
							}),
							'studiocms:renderer': buildAstroComponentVirtualExport({
								resolve,
								items: {
									StudioCMSRenderer: StudioCMSRendererComponentPath,
								},
							}),
							'studiocms:imageHandler/components': buildAstroComponentVirtualExport({
								resolve,
								items: {
									CustomImage: CustomImageComponentPath,
								},
							}),
							'studiocms:plugin-helpers': buildDynamicOnlyVirtual({
								resolve,
								items: ['./plugins.js', './virtuals/plugins/index.js'],
							}),
							'studiocms:auth/lib': buildDynamicOnlyVirtual({
								resolve,
								items: ['./virtuals/auth/index.js'],
							}),
							'studiocms:auth/lib/types': buildDynamicOnlyVirtual({
								resolve,
								items: ['./virtuals/auth/types.js'],
							}),
							'studiocms:auth/utils/validImages': buildDynamicOnlyVirtual({
								resolve,
								items: ['./virtuals/auth/validImages/index.js'],
							}),
							'studiocms:auth/utils/getLabelForPermissionLevel': buildDynamicOnlyVirtual({
								resolve,
								items: ['./virtuals/auth/getLabelForPermissionLevel.js'],
							}),
							'studiocms:auth/scripts/three': buildVirtualAmbientScript({
								resolve,
								items: ['./virtuals/auth/scripts/three.js'],
							}),
							'studiocms:i18n': buildDynamicAndAstroVirtualExport({
								resolve,
								dynamicExports: ['./virtuals/i18n/index.js'],
								astroComponents: {
									LanguageSelector: './virtuals/i18n/LanguageSelector.astro',
								},
							}),
							'studiocms:i18n/client': buildDynamicOnlyVirtual({
								resolve,
								items: ['./virtuals/i18n/client.js'],
							}),

							// TODO Migrate SDK to virtuals folder
							'studiocms:sdk': buildDynamicOnlyVirtual({
								resolve,
								items: ['./sdk/index.js'],
							}),
							'studiocms:sdk/types': buildDynamicOnlyVirtual({
								resolve,
								items: ['./sdk/types.js'],
							}),

							// TODO Decide if there is a better way to build this
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
						},
					});

					// Update the Astro Config
					integrationLogger(
						logInfo,
						'Updating Astro Config with StudioCMS Resources and settings...'
					);
					updateConfig({
						image: AstroConfigImageSettings,
						vite: AstroConfigViteSettings,
						env: {
							validateSecrets: true,
							schema: {
								// Auth Encryption Key
								CMS_ENCRYPTION_KEY: envField.string({
									context: 'server',
									access: 'secret',
									optional: false,
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
				'astro:config:done': () => {
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
