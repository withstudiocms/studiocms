/**
 * These triple-slash directives defines dependencies to various declaration files that will be
 * loaded when a user imports the StudioCMS integration in their Astro configuration file. These
 * directives must be first at the top of the file and can only be preceded by this comment.
 */
/// <reference types="@astrojs/db" />

import inlineMod from '@inox-tools/aik-mod';
import { runtimeLogger } from '@inox-tools/runtime-logger';
import auth from '@studiocms/auth';
import dashboard from '@studiocms/dashboard';
import frontend from '@studiocms/frontend';
import robotsTXT from '@studiocms/robotstxt';
import ui from '@studiocms/ui';
import {
	addVirtualImports,
	createResolver,
	defineIntegration,
	withPlugins,
} from 'astro-integration-kit';
import { envField } from 'astro/config';
import { z } from 'astro/zod';
import boxen from 'boxen';
import packageJson from 'package-json';
import copy from 'rollup-plugin-copy';
import { compare as semCompare } from 'semver';
import { loadEnv } from 'vite';
import { StudioCMSError } from './errors.js';
import { makeAPIRoute } from './lib/index.js';
import { shared } from './renderer/shared.js';
import type { SafePluginListType, StudioCMSConfig, StudioCMSOptions } from './schemas/index.js';
import changelogDtsFileOutput from './stubs/changelog.js';
import componentsDtsFileOutput from './stubs/components.js';
import coreDtsFileOutput from './stubs/core.js';
import i18nDTSOutput from './stubs/i18n-dts.js';
import { getImagesDTS } from './stubs/images.js';
import libDtsFileOutput from './stubs/lib.js';
import pluginsDtsFileOutput from './stubs/plugins.js';
import getProxyDTS from './stubs/proxy.js';
import rendererConfigDTS from './stubs/renderer-config.js';
import rendererMarkdownConfigDTS from './stubs/renderer-markdownConfig.js';
import rendererDTS from './stubs/renderer.js';
import sdkDtsFile from './stubs/sdk.js';
import type { Messages } from './types.js';
import { addAstroEnvConfig } from './utils/astroEnvConfig.js';
import {
	addIntegrationArray,
	changelogHelper,
	checkAstroConfig,
	configResolver,
	integrationLogger,
	nodeNamespaceBuiltinsAstro,
	readJson,
	watchStudioCMSConfig,
} from './utils/index.js';

// Read the package.json file for the package name and version
const { name: pkgName, version: pkgVersion } = readJson<{ name: string; version: string }>(
	new URL('../package.json', import.meta.url)
);

// Load Environment Variables
const env = loadEnv('all', process.cwd(), 'CMS');

// SDK Route Resolver
const sdkRouteResolver = makeAPIRoute('sdk');
// API Route Resolver
const apiRoute = makeAPIRoute('renderer');

/**
 * **StudioCMS Integration**
 *
 * A CMS built for Astro by the Astro Community for the Astro Community.
 *
 * @see The [GitHub Repo: `withstudiocms/studiocms`](https://github.com/withstudiocms/studiocms) for more information on how to contribute to StudioCMS.
 * @see The [StudioCMS Docs](https://docs.studiocms.dev) for more information on how to use StudioCMS.
 *
 */
export default defineIntegration({
	name: pkgName,
	optionsSchema: z.custom<StudioCMSOptions>(),
	setup: ({ options: opts }) => {
		// Resolved Options for StudioCMS
		let options: StudioCMSConfig;

		// Messages Array for Logging
		const messages: Messages = [];

		// Resolver Function
		const { resolve } = createResolver(import.meta.url);

		// Component Registry for Custom user Components
		let ComponentRegistry: Record<string, string>;

		let resolvedCalloutTheme: string;

		const RendererComponent = resolve('../components/Renderer.js');

		// Define the Image Component Path
		let imageComponentPath: string;

		// Return the Integration
		return withPlugins({
			name: pkgName,
			plugins: [inlineMod],
			hooks: {
				// DB Setup: Setup the Database Connection for AstroDB and StudioCMS
				'astro:db:setup': ({ extendDb }) => {
					extendDb({ configEntrypoint: 'studiocms/db/config' });
				},
				'astro:config:setup': async (params) => {
					// Destructure the params
					const { logger, defineModule, config, updateConfig, injectRoute, injectScript } = params;

					logger.info('Checking configuration...');

					watchStudioCMSConfig(params);

					options = await configResolver(params, opts);

					const {
						verbose,
						rendererConfig,
						defaultFrontEndConfig,
						includedIntegrations,
						imageService,
						plugins,
						componentRegistry,
						overrides,
					} = options;

					// Create logInfo object
					const logInfo = { logger, logLevel: 'info' as const, verbose };

					if (componentRegistry) ComponentRegistry = componentRegistry;

					// Resolve the callout theme based on the user's configuration
					resolvedCalloutTheme = resolve(
						`./styles/md-remark-callouts/${rendererConfig.studiocms.callouts.theme}.css`
					);

					// Setup Logger
					integrationLogger(logInfo, 'Setting up StudioCMS...');

					// Check Astro Config for required settings
					checkAstroConfig(params);

					const { resolve: astroConfigResolve } = createResolver(config.root.pathname);

					// Setup Logger
					integrationLogger(logInfo, 'Setting up StudioCMS internals...');

					// TODO: Migrate the following
					// - Auth package
					// - Dashboard package
					// - Frontend package

					// Add Astro Environment Configuration
					addAstroEnvConfig(params, {
						validateSecrets: false,
						schema: {
							CMS_CLOUDINARY_CLOUDNAME: envField.string({
								context: 'server',
								access: 'secret',
								optional: true,
							}),
						},
					});

					// Check for Cloudinary CDN Plugin
					if (imageService.cdnPlugin === 'cloudinary-js') {
						if (!env.CMS_CLOUDINARY_CLOUDNAME) {
							integrationLogger(
								{ logger, logLevel: 'warn', verbose: true },
								'Using the Cloudinary CDN JS SDK Plugin requires the CMS_CLOUDINARY_CLOUDNAME environment variable to be set. Please add this to your .env file.'
							);
						}
					}

					integrationLogger(logInfo, 'Configuring CustomImage Component...');

					imageComponentPath = overrides.CustomImageOverride
						? astroConfigResolve(overrides.CustomImageOverride)
						: resolve('../static/components/image/CustomImage.astro');

					updateConfig({
						image: {
							remotePatterns: [
								{
									protocol: 'https',
								},
							],
						},
						vite: {
							plugins: [
								copy({
									copyOnce: true,
									hook: 'buildStart',
									targets: [
										{
											src: resolve('../static/studiocms-resources/*'),
											dest: 'public/studiocms-resources/',
										},
									],
								}),
							],
						},
					});

					integrationLogger(logInfo, 'Injecting SDK Routes...');

					injectRoute({
						pattern: sdkRouteResolver('list-pages'),
						entrypoint: resolve('./routes/sdk/list-pages.js'),
						prerender: false,
					});

					injectRoute({
						pattern: sdkRouteResolver('update-latest-version-cache'),
						entrypoint: resolve('./routes/sdk/update-latest-version-cache.js'),
						prerender: false,
					});

					injectRoute({
						pattern: sdkRouteResolver('fallback-list-pages.json'),
						entrypoint: resolve('./routes/sdk/fallback-list-pages.json.js'),
						prerender: true,
					});

					injectRoute({
						pattern: sdkRouteResolver('full-changelog.json'),
						entrypoint: resolve('./routes/sdk/full-changelog.json.js'),
						prerender: false,
					});

					integrationLogger(logInfo, 'Setting up StudioCMS Renderer...');
					runtimeLogger(params, { name: 'studiocms-renderer' });

					injectRoute({
						pattern: apiRoute('render'),
						entrypoint: resolve('./routes/api/render.astro'),
						prerender: false,
					});

					if (rendererConfig.renderer === 'studiocms') {
						injectScript('page-ssr', 'import "studiocms:renderer/markdown-remark/css";');
					}

					// Setup StudioCMS Integrations Array (Default Integrations)
					const integrations = [
						{ integration: nodeNamespaceBuiltinsAstro() },
						{ integration: ui({ noInjectCSS: true }) },
						{ integration: auth(options) },
						{ integration: dashboard(options) },
					];

					// Frontend Integration (Default)
					if (defaultFrontEndConfig !== false) {
						integrations.push({ integration: frontend(options) });
					}

					integrationLogger(logInfo, 'Adding optional integrations...');

					// Robots.txt Integration (Default)
					if (includedIntegrations.robotsTXT === true) {
						integrations.push({ integration: robotsTXT() });
					} else if (typeof includedIntegrations.robotsTXT === 'object') {
						integrations.push({ integration: robotsTXT(includedIntegrations.robotsTXT) });
					}

					// Initialize and Add the default StudioCMS Plugin to the Safe Plugin List
					const safePluginList: SafePluginListType = [
						{
							name: 'StudioCMS (Default)',
							identifier: 'studiocms',
							pageTypes: [{ label: 'Normal (StudioCMS)', identifier: 'studiocms' }],
						},
					];

					integrationLogger(logInfo, 'Setting up StudioCMS plugins...');

					// Resolve StudioCMS Plugins
					for (const {
						name,
						identifier,
						studiocmsMinimumVersion,
						integration,
						frontendNavigationLinks,
						pageTypes,
						settingsPage,
					} of plugins || []) {
						// Check if the identifier is reserved
						if (identifier === 'studiocms') {
							throw new StudioCMSError(
								'Plugin Identifier "studiocms" is reserved for the default StudioCMS package.',
								`Plugin ${name} has the identifier "studiocms" which is reserved for the default StudioCMS package, please change the identifier to something else, if the plugin is from a third party, please contact the author to change the identifier.`
							);
						}

						// Check if the plugin has a minimum version requirement
						const comparison = semCompare(studiocmsMinimumVersion, pkgVersion);

						if (comparison === 1) {
							throw new StudioCMSError(
								`Plugin ${name} requires StudioCMS version ${studiocmsMinimumVersion} or higher.`,
								`Plugin ${name} requires StudioCMS version ${studiocmsMinimumVersion} or higher, please update StudioCMS to the required version, contact the plugin author to update the minimum version requirement or remove the plugin from the StudioCMS config.`
							);
						}

						// Add the plugin Integration to the Astro config
						if (integration && Array.isArray(integration)) {
							integrations.push(...integration.map((integration) => ({ integration })));
						} else if (integration) {
							integrations.push({ integration });
						}

						safePluginList.push({
							identifier,
							name,
							frontendNavigationLinks,
							pageTypes,
							settingsPage,
						});
					}

					// Setup Integrations
					addIntegrationArray(params, integrations);

					integrationLogger(logInfo, 'Adding Virtual Imports...');

					defineModule('studiocms:plugins', {
						defaultExport: safePluginList,
					});

					defineModule('studiocms:config', {
						defaultExport: options,
						constExports: {
							config: options,
							dashboardConfig: options.dashboardConfig,
							AuthConfig: options.dashboardConfig.AuthConfig,
							developerConfig: options.dashboardConfig.developerConfig,
							defaultFrontEndConfig: options.defaultFrontEndConfig,
							sdk: options.sdk,
						},
					});

					defineModule('studiocms:version', {
						defaultExport: pkgVersion,
					});

					const componentKeys = ComponentRegistry
						? Object.keys(ComponentRegistry).map((key) => key.toLowerCase())
						: [];

					const components = ComponentRegistry
						? Object.entries(ComponentRegistry)
								.map(
									([key, value]) =>
										`export { default as ${key} } from '${astroConfigResolve(value)}';`
								)
								.join('\n')
						: '';

					addVirtualImports(params, {
						name: pkgName,
						imports: {
							// Core Virtual Components
							'studiocms:components': `
								export { default as Avatar } from 'studiocms/static/components/Avatar.astro';
								export { default as FormattedDate } from '${
									options.overrides.FormattedDateOverride
										? astroConfigResolve(options.overrides.FormattedDateOverride)
										: 'studiocms/static/components/FormattedDate.astro'
								}';
								export { default as GenericHeader } from 'studiocms/static/components/GenericHeader.astro';
								export { default as Navigation } from 'studiocms/static/components/Navigation.astro';
								export { default as Generator } from 'studiocms/static/components/Generator.astro';
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

							// SDK Virtual Modules
							'studiocms:sdk': `
								import studioCMS_SDK from '${resolve('./sdk/index.js')}';
								export default studioCMS_SDK;
							`,
							'studiocms:sdk/cache': `
								export * from '${resolve('../sdk/cache.js')}';
								import studioCMS_SDK_Cache from '${resolve('../sdk/cache.js')}';
								export default studioCMS_SDK_Cache;
							`,
							'studiocms:sdk/types': `
								export * from '${resolve('../sdk/types.js')}';
							`,

							// i18n Virtual Module
							'studiocms:i18n': `
								export * from 'studiocms/static/i18n/index.ts';
								export { default as LanguageSelector } from 'studiocms/static/i18n/LanguageSelector.astro';
							`,

							// User Virtual Components
							'studiocms:component-proxy': `
								export * from "${resolve('./runtime/AstroComponentProxy.js')}";

								export const componentKeys = ${JSON.stringify(componentKeys)};
								${components}
							`,

							// Plugin Helpers
							'studiocms:plugin-helpers': `
								export * from "${resolve('./plugins.js')}";
							`,

							// Renderer Virtual Imports
							'studiocms:renderer/config': `
								export default ${JSON.stringify(opts)};
							`,
							'studiocms:renderer': `
								export { default as StudioCMSRenderer } from '${RendererComponent}';
							`,
							'studiocms:renderer/current': `
								export * from '${resolve('./lib/contentRenderer.js')}';
								import contentRenderer from '${resolve('./lib/contentRenderer.js')}';
								export default contentRenderer;
							`,
							'studiocms:renderer/markdown-remark/css': `
								import '${resolve('./styles/md-remark-headings.css')}';
								${rendererConfig.studiocms.callouts.enabled ? `import '${resolvedCalloutTheme}';` : ''}
							`,

							// Image Handler Virtual Imports
							'studiocms:imageHandler/components': `
								export { default as CustomImage } from '${imageComponentPath}';
							`,
						},
					});

					let pluginListLength = 0;
					let pluginListMessage = '';

					pluginListLength = safePluginList.length;
					pluginListMessage = safePluginList.map((p, i) => `${i + 1}. ${p.name}`).join('\n');

					const messageBox = boxen(pluginListMessage, {
						padding: 1,
						title: `Currently Installed StudioCMS Plugins (${pluginListLength})`,
					});

					messages.push({
						label: 'studiocms:plugins',
						logLevel: 'info',
						message: ` \n \n${messageBox} \n \n`,
					});

					changelogHelper(params);
				},
				// Config Done: Make DTS file for StudioCMS Plugins Virtual Module
				'astro:config:done': ({ injectTypes, config }) => {
					const { resolve: astroConfigResolve } = createResolver(config.root.pathname);

					injectTypes(changelogDtsFileOutput);
					injectTypes(componentsDtsFileOutput);
					injectTypes(coreDtsFileOutput);
					injectTypes(i18nDTSOutput);
					injectTypes(libDtsFileOutput);
					injectTypes(pluginsDtsFileOutput);
					injectTypes(getProxyDTS(ComponentRegistry, astroConfigResolve));
					injectTypes(sdkDtsFile);
					injectTypes(rendererDTS);
					injectTypes(rendererConfigDTS);
					injectTypes(rendererMarkdownConfigDTS);
					injectTypes(getImagesDTS(imageComponentPath));

					// Inject the Markdown configuration into the shared state
					shared.markdownConfig = config.markdown;
					shared.studiocms = options.rendererConfig.studiocms;

					// Log Setup Complete
					messages.push({
						label: 'studiocms:setup',
						logLevel: 'info',
						message: 'Setup Complete. 🚀',
					});
				},
				// DEV SERVER: Check for updates on server start and log messages
				'astro:server:start': async ({ logger: l }) => {
					const logger = l.fork(`${pkgName}:update-check`);

					try {
						const { version: latestVersion } = await packageJson(pkgName.toLowerCase());

						const comparison = semCompare(pkgVersion, latestVersion);

						if (comparison === -1) {
							logger.warn(
								`A new version of '${pkgName}' is available. Please update to ${latestVersion} using your favorite package manager.`
							);
						} else if (comparison === 0) {
							logger.info(`You are using the latest version of '${pkgName}' (${pkgVersion})`);
						} else {
							logger.info(
								`You are using a newer version (${pkgVersion}) of '${pkgName}' than the latest release (${latestVersion})`
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
				},
			},
		});
	},
});
