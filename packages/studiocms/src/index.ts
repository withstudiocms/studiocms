/**
 * These triple-slash directives defines dependencies to various declaration files that will be
 * loaded when a user imports the StudioCMS integration in their Astro configuration file. These
 * directives must be first at the top of the file and can only be preceded by this comment.
 */
/// <reference types="@astrojs/db" preserve="true" />
/// <reference types="@studiocms/ui/v/types" preserve="true" />
/// <reference types="./global.d.ts" preserve="true" />
/// <reference types="./virtual.d.ts" preserve="true" />
/// <reference types="./theme.d.ts" preserve="true" />

import { promises as fsP, writeFileSync } from 'node:fs';
import { runtimeLogger } from '@inox-tools/runtime-logger';
import studiocmsUi from '@studiocms/ui';
import { componentRegistryHandler } from '@withstudiocms/component-registry';
import { configResolverBuilder, exists, watchConfigFileBuilder } from '@withstudiocms/config-utils';
import {
	addIntegrationArray,
	getLatestVersion,
	injectScripts,
	integrationLogger,
	logMessages,
	type Messages,
} from '@withstudiocms/internal_helpers/astro-integration';
import { readJson } from '@withstudiocms/internal_helpers/utils';
import { envField } from 'astro/config';
import { z } from 'astro/zod';
import { addVirtualImports, createResolver, defineIntegration } from 'astro-integration-kit';
import { compare as semCompare } from 'semver';
import { loadEnv } from 'vite';
import {
	AstroConfigImageSettings,
	AstroConfigViteSettings,
	getUiOpts,
	makeDashboardRoute,
	routesDir,
} from './consts.js';
import {
	changelogHelper,
	checkAstroConfig,
	pluginHandler,
	routeHandler,
} from './handlers/index.js';
import { nodeNamespaceBuiltinsAstro } from './integrations/node-namespace.js';
import {
	type StudioCMSConfig,
	type StudioCMSOptions,
	StudioCMSOptionsSchema,
} from './schemas/index.js';
import {
	availableTranslationFileKeys,
	availableTranslations,
	currentFlags,
} from './virtuals/i18n/v-files.js';
import { VirtualModuleBuilder } from './virtuals/utils.js';

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

					changelogHelper(params, resolve('../CHANGELOG.md'));

					injectScripts(params, [
						{
							stage: 'page',
							content: await fsP.readFile(
								resolve('./virtuals/scripts/user-quick-tools.js'),
								'utf-8'
							),
							enabled: injectQuickActionsMenu && !dbStartPage,
						},
					]);

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

					const {
						extraRoutes,
						integrations: pluginIntegrations,
						safePluginList,
						messages: pluginMessages,
						oAuthProvidersConfigured,
						pluginsTranslations,
					} = await pluginHandler(params, {
						dashboardRoute,
						dbStartPage,
						name,
						pkgVersion,
						plugins,
						robotsTXTConfig,
						verbose,
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

					if (!dbStartPage)
						addMiddleware({
							order: 'pre',
							entrypoint: routesDir.middleware('index.ts'),
						});

					// Inject Integrations into Astro project
					addIntegrationArray(params, [
						{ integration: nodeNamespaceBuiltinsAstro() },
						{ integration: studiocmsUi(getUiOpts(currentFlags)) },
						...pluginIntegrations,
					]);

					// Inject Virtual modules
					integrationLogger(logInfo, 'Adding Virtual Imports...');

					const {
						dynamicVirtual,
						ambientScripts,
						namedVirtual,
						astroComponentVirtual,
						dynamicWithAstroVirtual,
						buildDefaultOnlyVirtual,
						buildLoggerVirtual,
						buildNamedMultiExportVirtual,
						buildVirtualConfig,
					} = VirtualModuleBuilder(resolve);

					addVirtualImports(params, {
						name,
						imports: {
							'studiocms:config': buildVirtualConfig(options),
							'studiocms:plugins': buildDefaultOnlyVirtual(safePluginList),
							'studiocms:version': buildDefaultOnlyVirtual(pkgVersion),
							'studiocms:logger': buildLoggerVirtual(verbose),
							'virtual:studiocms/sdk/env': buildNamedMultiExportVirtual({
								dbUrl: env.ASTRO_DB_REMOTE_URL,
								dbSecret: env.ASTRO_DB_APP_TOKEN,
								cmsEncryptionKey: env.CMS_ENCRYPTION_KEY,
							}),
							'studiocms:lib': dynamicVirtual([
								'./virtuals/lib/head.js',
								'./virtuals/lib/headDefaults.js',
								'./virtuals/lib/pathGenerators.js',
								'./virtuals/lib/routeMap.js',
								'./virtuals/lib/urlGen.js',
							]),
							'studiocms:notifier': dynamicVirtual(['./virtuals/notifier/index.js']),
							'studiocms:notifier/client': dynamicVirtual(['./virtuals/notifier/client.js']),
							'studiocms:mailer': dynamicVirtual(['./virtuals/mailer/index.js']),
							'studiocms:mailer/templates': namedVirtual({
								namedExport: 'getTemplate',
								path: './virtuals/mailer/template.js',
								exportDefault: true,
							}),
							'studiocms:template-engine': namedVirtual({
								namedExport: 'templateEngine',
								path: './virtuals/template-engine/index.js',
								exportDefault: true,
							}),
							'studiocms:components': astroComponentVirtual({
								FormattedDate: './virtuals/components/FormattedDate.astro',
								Generator: './virtuals/components/Generator.astro',
							}),
							'studiocms:renderer': astroComponentVirtual({
								StudioCMSRenderer: StudioCMSRendererComponentPath,
							}),
							'studiocms:imageHandler/components': astroComponentVirtual({
								CustomImage: CustomImageComponentPath,
							}),
							'studiocms:plugin-helpers': dynamicVirtual([
								'./plugins.js',
								'./virtuals/plugins/index.js',
							]),
							'studiocms:auth/lib': dynamicVirtual(['./virtuals/auth/index.js']),
							'studiocms:auth/lib/types': dynamicVirtual(['./virtuals/auth/types.js']),
							'studiocms:auth/utils/validImages': dynamicVirtual([
								'./virtuals/auth/validImages/index.js',
							]),
							'studiocms:auth/utils/getLabelForPermissionLevel': dynamicVirtual([
								'./virtuals/auth/getLabelForPermissionLevel.js',
							]),
							'studiocms:auth/scripts/three': ambientScripts(['./virtuals/auth/scripts/three.js']),
							'studiocms:i18n/virtual': `
								export const availableTranslationFileKeys = ${JSON.stringify(availableTranslationFileKeys)};
								export const availableTranslations = ${JSON.stringify(availableTranslations)};
								export const currentFlags = ${JSON.stringify(currentFlags)};
							`,
							'studiocms:i18n': dynamicWithAstroVirtual({
								dynamicExports: ['./virtuals/i18n/server.js'],
								astroComponents: {
									LanguageSelector: './virtuals/i18n/LanguageSelector.astro',
								},
							}),
							'studiocms:i18n/client': dynamicVirtual(['./virtuals/i18n/client.js']),
							'studiocms:i18n/plugin-translations': `
							  const pluginTranslations = ${JSON.stringify(pluginsTranslations)};
								export default pluginTranslations;
							`,
							'studiocms:i18n/plugins': dynamicVirtual(['./virtuals/i18n/plugin.js']),
							'studiocms:sdk': dynamicVirtual(['./virtuals/sdk/index.js']),
							'studiocms:sdk/types': dynamicVirtual(['./virtuals/sdk/types.js']),
							'studiocms:template-editor/script': ambientScripts([
								'./components/dashboard/smtp-config/template-editor.js',
							]),
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
						writeFileSync(cacheJsonFile, '{}', 'utf-8');
					}
				},
				'astro:config:done': ({ config }) => {
					// Log Setup Complete
					messages.push({
						label: 'studiocms:setup',
						logLevel: 'info',
						message: 'Setup Complete. 🚀',
					});

					if (options.dbStartPage) {
						if (isDevMode) {
							messages.push({
								label: 'studiocms:start-page',
								logLevel: 'warn',
								message: `Start Page is enabled. This will be the only page available until you initialize your database and disable the config option that forces this page to be displayed. To get started, visit http://localhost:${config.server.port}/start/ in your browser to initialize your database and set up your installation.`,
							});
						} else {
							messages.push({
								label: 'studiocms:start-page',
								logLevel: 'error',
								message:
									'Start Page is enabled. Please ensure you have set up your StudioCMS database and disabled the Start Page before building for production.',
							});
						}
					}

					if (options.features.developerConfig.demoMode !== false) {
						messages.push({
							label: 'studiocms:demo-mode',
							logLevel: 'info',
							message:
								'Demo Mode is Enabled. This means that the StudioCMS Dashboard will be available to the public using the provided credentials and the REST API has been disabled. To disable Demo Mode, set the `demoMode` option to `false` or remove the option in your StudioCMS configuration.',
						});
					}
				},
				// DEV SERVER: Check for updates on server start and log messages
				'astro:server:start': async ({ logger }) => {
					/**
					 * Logs an update check message with the specified log level.
					 *
					 * @param logLevel - The severity level of the log message. Can be 'info', 'warn', 'error', or 'debug'.
					 * @param message - The message to log.
					 */
					function logUpdateCheck(logLevel: Messages[number]['logLevel'], message: string) {
						messages.push({
							label: 'studiocms:update-check',
							logLevel,
							message,
						});
					}

					try {
						// Fetch the latest version from the npm registry
						const latestVersion = await getLatestVersion(
							pkgName,
							logger.fork('studiocms:update-check'),
							cacheJsonFile,
							isDevMode
						);

						// If the latest version is found, compare it with the current version and log messages accordingly
						if (latestVersion) {
							// Compare the current package version with the latest version
							const comparison = semCompare(pkgVersion, latestVersion);

							// Log a warning if the latest version is newer
							if (comparison === -1) {
								logUpdateCheck(
									'warn',
									`A new version of '${name}' is available. Please update to ${latestVersion} using your favorite package manager.`
								);

								// Log an info message if the versions are the same
							} else if (comparison === 0) {
								logUpdateCheck(
									'info',
									`You are using the latest version of '${name}' (${pkgVersion})`
								);

								// Log an info message if you are ahead of the latest (pre-release/canary)
							} else {
								logUpdateCheck(
									'info',
									`You are using a newer version (${pkgVersion}) of '${name}' than the latest release (${latestVersion})`
								);
							}
						}
						// If an error occurs while fetching the latest version, log an error message
					} catch (error) {
						logUpdateCheck(
							'error',
							`Error fetching latest version from npm registry: ${
								error instanceof Error ? error.message : String(error)
							}`
						);
					}

					// Log all messages
					await logMessages(messages, options, logger);
				},
				// BUILD: Log messages at the end of the build
				'astro:build:done': async ({ logger }) => {
					// Log messages at the end of the build
					await logMessages(messages, options, logger);
				},
			},
		};
	},
});

export default studiocms;
