import { addIntegrationArray } from '@matthiesenxyz/integration-utils/aikUtils';
import {
	integrationLogger,
	nodeNamespaceBuiltinsAstro as nodeNamespace,
} from '@matthiesenxyz/integration-utils/astroUtils';
import auth from '@studiocms/auth';
import core from '@studiocms/core';
import { StudioCMSError } from '@studiocms/core/errors';
import type { SafePluginListType, StudioCMSConfig } from '@studiocms/core/schemas';
import { checkAstroConfig, configResolver, watchStudioCMSConfig } from '@studiocms/core/utils';
import dashboard from '@studiocms/dashboard';
import frontend from '@studiocms/frontend';
import imageHandler from '@studiocms/imagehandler';
import renderers from '@studiocms/renderers';
import robotsTXT from '@studiocms/robotstxt';
import ui from '@studiocms/ui';
import { addVirtualImports, defineUtility } from 'astro-integration-kit';
import { compare as semCompare } from 'semver';
import type { ConfigSetupOptions } from '../types';
import { changelogHelper } from '../utils/changelog';

export const configSetup = defineUtility('astro:config:setup')(
	async (params, o: ConfigSetupOptions) => {
		// Destructure the params
		const {
			logger,
			config: { output },
		} = params;

		// Destructure the options
		const { messages, opts, pkgName, pkgVersion } = o;

		logger.info('Checking configuration...');

		// Watch the StudioCMS Config File(s) for changes (including creation/deletion)
		const configFileResponse = watchStudioCMSConfig(params);
		if (configFileResponse) {
			messages.push({
				label: 'studiocms:config',
				logLevel: 'error',
				message: configFileResponse,
			});
		}

		// Resolve Options
		const options: StudioCMSConfig = await configResolver(params, opts);

		const {
			verbose,
			rendererConfig,
			defaultFrontEndConfig,
			includedIntegrations,
			plugins,
			dashboardConfig: { prerender },
		} = options;

		// Check if the dashboard routes should be prerendered
		const prerenderRoutes = output === 'static' || prerender;

		// Setup Logger
		integrationLogger({ logger, logLevel: 'info', verbose }, 'Setting up StudioCMS...');

		// Check Astro Config for required settings
		checkAstroConfig(params);

		// Setup Logger
		integrationLogger({ logger, logLevel: 'info', verbose }, 'Setting up StudioCMS internals...');

		// Setup StudioCMS Integrations Array (Default Integrations)
		const integrations = [
			{ integration: nodeNamespace() },
			{ integration: ui() },
			{ integration: core(options, prerenderRoutes) },
			{ integration: renderers(rendererConfig, verbose) },
			{ integration: imageHandler(options) },
			{ integration: auth(options, prerenderRoutes) },
			{ integration: dashboard(options, prerenderRoutes) },
		];

		// Frontend Integration (Default)
		if (defaultFrontEndConfig !== false) {
			integrations.push({ integration: frontend(options) });
		}

		integrationLogger({ logger, logLevel: 'info', verbose }, 'Adding optional integrations...');

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
			},
		];

		integrationLogger({ logger, logLevel: 'info', verbose }, 'Setting up StudioCMS plugins...');

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

		// Generate the Virtual Imports for the plugins
		addVirtualImports(params, {
			name: pkgName,
			imports: {
				'studiocms:plugins': `export default ${JSON.stringify(safePluginList)};`,
				'studiocms:mode': `
					export const output = ${JSON.stringify(output)};
					export const prerenderRoutes = ${prerenderRoutes};
					export default { output, prerenderRoutes };
				`,
			},
		});

		let pluginListLength = 0;
		let pluginListMessage = '';

		pluginListLength = safePluginList.length;
		pluginListMessage = safePluginList.map((p, i) => ` ${i + 1}. ${p.name}`).join('\n');

		o.messages.push({
			label: 'studiocms:plugins',
			logLevel: 'info',
			message: `Currently Installed StudioCMS Plugins: (${pluginListLength})\n${pluginListMessage}`,
		});

		changelogHelper(params);

		return options as StudioCMSConfig;
	}
);

export default configSetup;
