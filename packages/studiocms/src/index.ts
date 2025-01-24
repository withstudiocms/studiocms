import inlineMod from '@inox-tools/aik-mod';
import astroDTSBuilder from '@matthiesenxyz/astrodtsbuilder';
import auth from '@studiocms/auth';
import core from '@studiocms/core';
import { StudioCMSError } from '@studiocms/core/errors';
import type {
	SafePluginListType,
	StudioCMSConfig,
	StudioCMSOptions,
} from '@studiocms/core/schemas';
import dashboard from '@studiocms/dashboard';
import frontend from '@studiocms/frontend';
import imageHandler from '@studiocms/imagehandler';
import renderers from '@studiocms/renderers';
import robotsTXT from '@studiocms/robotstxt';
import ui from '@studiocms/ui';
import { createResolver, defineIntegration, withPlugins } from 'astro-integration-kit';
import { z } from 'astro/zod';
import boxen from 'boxen';
import packageJson from 'package-json';
import { compare as semCompare } from 'semver';
import type { Messages } from './types.js';
import { addIntegrationArray } from './utils/addIntegrationArray.js';
import { checkAstroConfig } from './utils/astroConfigCheck.js';
import { changelogHelper } from './utils/changelog.js';
import { watchStudioCMSConfig } from './utils/configManager.js';
import { configResolver } from './utils/configResolver.js';
import { integrationLogger } from './utils/integrationLogger.js';
import { nodeNamespaceBuiltinsAstro } from './utils/integrations.js';
import readJson from './utils/readJson.js';

const { name: pkgName, version: pkgVersion } = readJson<{ name: string; version: string }>(
	new URL('../package.json', import.meta.url)
);

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

		// Return the Integration
		return withPlugins({
			name: pkgName,
			plugins: [inlineMod],
			hooks: {
				// DB Setup: Setup the Database Connection for AstroDB and StudioCMS
				// @ts-expect-error - This is a custom Integration Hook
				'astro:db:setup': ({ extendDb }) => {
					extendDb({ configEntrypoint: '@studiocms/core/db/config' });
				},
				'astro:config:setup': async (params) => {
					// Destructure the params
					const { logger, defineModule } = params;

					logger.info('Checking configuration...');

					watchStudioCMSConfig(params);

					options = await configResolver(params, opts);

					const { verbose, rendererConfig, defaultFrontEndConfig, includedIntegrations, plugins } =
						options;

					// Setup Logger
					integrationLogger({ logger, logLevel: 'info', verbose }, 'Setting up StudioCMS...');

					// Check Astro Config for required settings
					checkAstroConfig(params);

					// Setup Logger
					integrationLogger(
						{ logger, logLevel: 'info', verbose },
						'Setting up StudioCMS internals...'
					);

					// Setup StudioCMS Integrations Array (Default Integrations)
					const integrations = [
						{ integration: nodeNamespaceBuiltinsAstro() },
						{ integration: ui() },
						{ integration: core(options) },
						{ integration: renderers(rendererConfig, verbose) },
						{ integration: imageHandler(options) },
						{ integration: auth(options) },
						{ integration: dashboard(options) },
					];

					// Frontend Integration (Default)
					if (defaultFrontEndConfig !== false) {
						integrations.push({ integration: frontend(options) });
					}

					integrationLogger(
						{ logger, logLevel: 'info', verbose },
						'Adding optional integrations...'
					);

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

					integrationLogger(
						{ logger, logLevel: 'info', verbose },
						'Setting up StudioCMS plugins...'
					);

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
				'astro:config:done': ({ injectTypes }) => {
					// Make DTS file for StudioCMS Plugins Virtual Module
					const dtsFile = astroDTSBuilder();

					dtsFile.addSingleLineNote(
						'This file is auto-generated by StudioCMS and should not be modified.'
					);

					dtsFile.addModule('studiocms:plugins', {
						defaultExport: {
							typeDef: `import('${resolve('./config.js')}').SafePluginListType`,
						},
					});

					dtsFile.addModule('studiocms:changelog', {
						defaultExport: {
							typeDef: 'string',
						},
					});

					dtsFile.addModule('studiocms:mode', {
						defaultExport: {
							typeDef: `{ output: 'static' | 'server', prerenderRoutes: boolean }`,
						},
						namedExports: [
							{
								name: 'output',
								typeDef: `'static' | 'server'`,
							},
							{
								name: 'prerenderRoutes',
								typeDef: 'boolean',
							},
						],
					});

					// Inject the DTS file
					injectTypes(dtsFile.makeAstroInjectedType('plugins.d.ts'));

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
