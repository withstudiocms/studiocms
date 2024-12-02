import { addIntegrationArray } from '@matthiesenxyz/integration-utils/aikUtils';
import { integrationLogger } from '@matthiesenxyz/integration-utils/astroUtils';
import type { StudioCMSOptions } from '@studiocms/core/schemas';
import { addIntegration, addVirtualImports, defineUtility } from 'astro-integration-kit';
import { AstroError } from 'astro/errors';
import type { SafePluginListType, StudioCMSPluginOptions } from './types';

const StudioCMSPluginList: StudioCMSPluginOptions[] = [];

export const pluginsResolver = defineUtility('astro:config:setup')(
	async (params, name: string, options: StudioCMSOptions) => {
		// Get the plugins from the options
		const plugins = options?.plugins || [];

		// Loop through the plugins
		for (const plugin of plugins) {
			// Get the name, identifier and integration from the plugin
			const { name, identifier, integration } = plugin;

			// Check if the identifier is reserved
			if (identifier === 'studiocms') {
				throw new AstroError(
					'Plugin Identifier "studiocms" is reserved for the default StudioCMS package.',
					`Plugin ${name} has the identifier "studiocms" which is reserved for the default StudioCMS package, please change the identifier to something else, if the plugin is from a third party, please contact the author to change the identifier.`
				);
			}

			// Add the plugin Integration to the Astro config
			if (integration && Array.isArray(integration)) {
				addIntegrationArray(
					params,
					integration.map((integration) => ({ integration }))
				);
			} else if (integration) {
				addIntegration(params, { integration });
			}

			// Add the plugin to the StudioCMS Plugin List
			StudioCMSPluginList.push(plugin);
		}

		// Convert the StudioCMS Plugin List to a Safe Plugin List (removing the integrations from each plugin, so they can be serialized to JSON)
		const SafePluginList: SafePluginListType = StudioCMSPluginList.map(
			({ name, identifier, frontendNavigationLinks, pageType, settingsPage }) => ({
				name,
				identifier,
				pageType,
				settingsPage,
				frontendNavigationLinks,
			})
		);

		// Add the default StudioCMS Plugin to the Safe Plugin List
		SafePluginList.push({
			name: 'StudioCMS (Default)',
			identifier: 'studiocms',
		});

		// Generate the Virtual Imports for the plugins
		addVirtualImports(params, {
			name,
			imports: {
				'studiocms:plugins': `export default ${JSON.stringify(SafePluginList)};`,
			},
		});

		// Log the current plugins
		integrationLogger(
			{
				logger: params.logger.fork('studiocms/plugins'),
				logLevel: 'info',
				verbose: options?.verbose || false,
			},
			`Current Installed Plugins:\n Plugin Label - Plugin Identifier\n${SafePluginList.map((p) => ` > ${p.name} - ${p.identifier}`).join('\n')}`
		);
	}
);
