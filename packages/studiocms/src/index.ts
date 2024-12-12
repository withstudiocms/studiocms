import astroDTSBuilder from '@matthiesenxyz/astrodtsbuilder';
import { addIntegrationArray } from '@matthiesenxyz/integration-utils/aikUtils';
import {
	integrationLogger,
	nodeNamespaceBuiltinsAstro,
} from '@matthiesenxyz/integration-utils/astroUtils';
import studioCMSAuth from '@studiocms/auth';
import studioCMSCore from '@studiocms/core';
import { StudioCMSError } from '@studiocms/core/errors';
import { definePlugin } from '@studiocms/core/schemas';
import type {
	CustomRenderer,
	Renderer,
	SafePluginListType,
	StudioCMSOptions,
	StudioCMSPluginOptions,
} from '@studiocms/core/schemas';
import { robotsTXTPreset } from '@studiocms/core/strings';
import { defineStudioCMSConfig } from '@studiocms/core/utils';
import { checkAstroConfig, configResolver, watchStudioCMSConfig } from '@studiocms/core/utils';
import studioCMSDashboard from '@studiocms/dashboard';
import studioCMSFrontend from '@studiocms/frontend';
import studioCMSImageHandler from '@studiocms/imagehandler';
import studioCMSRenderers from '@studiocms/renderers';
import studioCMSRobotsTXT from '@studiocms/robotstxt';
import type { AstroIntegration } from 'astro';
import { addIntegration, addVirtualImports, createResolver } from 'astro-integration-kit';
import packageJson from 'package-json';
import * as semver from 'semver';
import packageJsonData from '../package.json';

/**
 * **StudioCMS Integration**
 *
 * A CMS built for Astro by the Astro Community for the Astro Community.
 *
 * @see [GitHub Repo: 'withstudiocms/studiocms'](https://github.com/withstudiocms/studiocms) for more information on how to contribute to StudioCMS.
 * @see [StudioCMS Docs](https://docs.studiocms.dev) for more information on how to use StudioCMS.
 *
 */
const studioCMSIntegration = (options?: StudioCMSOptions): AstroIntegration & {} => {
	// Setup the Resolver for the current file
	const { resolve } = createResolver(import.meta.url);
	return {
		name: packageJsonData.name,
		hooks: {
			'astro:db:setup': ({ extendDb }) => {
				extendDb({ configEntrypoint: '@studiocms/core/db/config' });
			},
			'astro:config:setup': async (params) => {
				// Destructure Params
				const { logger } = params;

				// Watch the StudioCMS Config File for changes (including creation/deletion)
				watchStudioCMSConfig(params);

				// Resolve Options
				const resolvedOptions = await configResolver(params, options);

				// Setup Logger
				integrationLogger(
					{ logger, logLevel: 'info', verbose: resolvedOptions.verbose || false },
					'Setting up StudioCMS Core...'
				);

				// Check Astro Config for required settings
				checkAstroConfig(params);

				// Setup Integrations (Internal)
				addIntegrationArray(params, [
					{ integration: nodeNamespaceBuiltinsAstro() },
					{ integration: studioCMSCore(resolvedOptions) },
					{ integration: studioCMSRenderers(resolvedOptions.rendererConfig) },
					{
						integration: studioCMSFrontend({
							verbose: resolvedOptions.verbose,
							dbStartPage: resolvedOptions.dbStartPage,
							defaultFrontEndConfig: resolvedOptions.defaultFrontEndConfig,
						}),
					},
					{
						integration: studioCMSImageHandler({
							verbose: resolvedOptions.verbose,
							imageService: resolvedOptions.imageService,
							overrides: resolvedOptions.overrides,
						}),
					},
					{
						integration: studioCMSAuth({
							verbose: resolvedOptions.verbose,
							dbStartPage: resolvedOptions.dbStartPage,
							dashboardConfig: resolvedOptions.dashboardConfig,
						}),
					},
					{
						integration: studioCMSDashboard({
							verbose: resolvedOptions.verbose,
							dbStartPage: resolvedOptions.dbStartPage,
							dashboardConfig: resolvedOptions.dashboardConfig,
						}),
					},
				]);

				// Initialize and Add the default StudioCMS Plugin to the Safe Plugin List
				const safePluginList: SafePluginListType = [
					{
						name: 'StudioCMS (Default)',
						identifier: 'studiocms',
					},
				];

				// Resolve StudioCMS Plugins
				for (const plugin of resolvedOptions.plugins || []) {
					// Check if the identifier is reserved
					if (plugin.identifier === 'studiocms') {
						throw new StudioCMSError(
							'Plugin Identifier "studiocms" is reserved for the default StudioCMS package.',
							`Plugin ${plugin.name} has the identifier "studiocms" which is reserved for the default StudioCMS package, please change the identifier to something else, if the plugin is from a third party, please contact the author to change the identifier.`
						);
					}

					// Check if the plugin has a minimum version requirement
					const comparison = semver.compare(
						plugin.studiocmsMinimumVersion,
						packageJsonData.version
					);

					if (comparison === 1) {
						throw new StudioCMSError(
							`Plugin ${plugin.name} requires StudioCMS version ${plugin.studiocmsMinimumVersion} or higher.`,
							`Plugin ${plugin.name} requires StudioCMS version ${plugin.studiocmsMinimumVersion} or higher, please update StudioCMS to the required version, contact the plugin author to update the minimum version requirement or remove the plugin from the StudioCMS config.`
						);
					}

					// Add the plugin Integration to the Astro config
					if (plugin.integration && Array.isArray(plugin.integration)) {
						addIntegrationArray(
							params,
							plugin.integration.map((integration) => ({ integration }))
						);
					} else if (plugin.integration) {
						addIntegration(params, { integration: plugin.integration });
					}

					safePluginList.push({
						identifier: plugin.identifier,
						name: plugin.name,
						frontendNavigationLinks: plugin.frontendNavigationLinks,
						pageTypes: plugin.pageTypes,
						settingsPage: plugin.settingsPage,
					});
				}

				// Generate the Virtual Imports for the plugins
				addVirtualImports(params, {
					name: packageJsonData.name,
					imports: {
						'studiocms:plugins': `export default ${JSON.stringify(safePluginList)};`,
					},
				});

				// Log the current plugins
				integrationLogger(
					{
						logger: params.logger.fork('studiocms/plugins'),
						logLevel: 'info',
						verbose: options?.verbose || false,
					},
					`Current Installed Plugins:\n Plugin Label - Plugin Identifier\n${safePluginList.map((p) => ` > ${p.name} - ${p.identifier}`).join('\n')}`
				);

				// Robots.txt
				if (
					resolvedOptions.includedIntegrations?.robotsTXT === true ||
					typeof resolvedOptions.includedIntegrations?.robotsTXT === 'object'
				) {
					const robotsTXTConfig =
						resolvedOptions.includedIntegrations?.robotsTXT === true
							? {}
							: resolvedOptions.includedIntegrations?.robotsTXT;

					addIntegrationArray(params, [
						{
							integration: studioCMSRobotsTXT({
								...robotsTXTPreset,
								...robotsTXTConfig,
							}),
						},
					]);
				}
			},
			'astro:config:done': ({ injectTypes }) => {
				// Make DTS file for StudioCMS Plugins Virtual Module
				const dtsFile = astroDTSBuilder();

				dtsFile.addSingleLineNote(
					'// This file is auto-generated by StudioCMS and should not be modified.'
				);

				dtsFile.addModule('studiocms:plugins', {
					defaultExport: {
						typeDef: `import('${resolve('./types')}').SafePluginListType`,
					},
				});

				// Inject the DTS file
				injectTypes(dtsFile.makeAstroInjectedType('plugins.d.ts'));
			},
			'astro:server:start': async ({ logger }) => {
				const log = logger.fork(`${packageJsonData.name}:update-check`);

				try {
					const { version: latestVersion } = await packageJson(packageJsonData.name.toLowerCase());

					const comparison = semver.compare(packageJsonData.version, latestVersion);

					if (comparison === -1) {
						log.warn(
							`A new version of 'studiocms' is available. Please update to ${latestVersion} using your favorite package manager.`
						);
					} else if (comparison === 0) {
						log.info(
							`You are using the latest version of '${packageJsonData.name}' (${packageJsonData.version})`
						);
					} else {
						log.info(
							`You are using a newer version (${packageJsonData.version}) of '${name}' than the latest release (${latestVersion})`
						);
					}
				} catch (error) {
					if (error instanceof Error) {
						log.error(`Error fetching latest version from npm registry: ${error.message}`);
					} else {
						// Handle the case where error is not an Error object
						log.error(
							'An unknown error occurred while fetching the latest version from the npm registry.'
						);
					}
				}
			},
		},
	};
};

export default studioCMSIntegration;

export {
	defineStudioCMSConfig,
	definePlugin,
	studioCMSIntegration,
	type CustomRenderer,
	type Renderer,
	type StudioCMSOptions,
	type StudioCMSPluginOptions,
	type SafePluginListType,
};
