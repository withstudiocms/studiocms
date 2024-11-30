import { addIntegrationArray } from '@matthiesenxyz/integration-utils/aikUtils';
import {
	integrationLogger,
	nodeNamespaceBuiltinsAstro,
} from '@matthiesenxyz/integration-utils/astroUtils';
import studioCMSAuth from '@studiocms/auth';
import studioCMSCore from '@studiocms/core';
import { getStudioConfigFileUrl } from '@studiocms/core/lib';
import {
	type SafePluginListType,
	type StudioCMSOptions,
	type StudioCMSPluginOptions,
	StudioCMSOptionsSchema as optionsSchema,
} from '@studiocms/core/schemas';
import { CoreStrings, robotsTXTPreset } from '@studiocms/core/strings';
import {
	addIntegrationArrayWithCheck,
	checkAstroConfig,
	configResolver,
} from '@studiocms/core/utils';
import studioCMSDashboard from '@studiocms/dashboard';
import studioCMSFrontend from '@studiocms/frontend';
import studioCMSImageHandler from '@studiocms/imagehandler';
import studioCMSRenderers from '@studiocms/renderers';
import studioCMSRobotsTXT from '@studiocms/robotstxt';
import { addIntegration, addVirtualImports, defineIntegration } from 'astro-integration-kit';
import { AstroError } from 'astro/errors';
import { name, version } from '../package.json';
import { stubs } from './stubs';
import { updateCheck } from './updateCheck';

// Main Integration
export default defineIntegration({
	name,
	optionsSchema,
	setup({ name, options }) {
		// Resolve Options
		let resolvedOptions: StudioCMSOptions;

		return {
			hooks: {
				// Configure `@astrojs/db` integration to include the StudioCMS Database Tables
				'astro:db:setup': ({ extendDb }) => {
					extendDb({ configEntrypoint: '@studiocms/core/db/config' });
				},
				'astro:config:setup': async (params) => {
					// Destructure Params
					const { config: astroConfig, addWatchFile, logger } = params;

					// Watch the StudioCMS Config File for changes (including creation/deletion)
					addWatchFile(getStudioConfigFileUrl(astroConfig.root));

					// Resolve Options
					const ResolvedOptions = await configResolver(params, options);

					// Set Resolved Options
					resolvedOptions = ResolvedOptions;

					// Break out resolved options
					const {
						verbose,
						rendererConfig,
						dbStartPage,
						dashboardConfig,
						defaultFrontEndConfig,
						imageService,
						overrides,
						includedIntegrations,
					} = ResolvedOptions;

					// Setup Logger
					integrationLogger(
						{ logger, logLevel: 'info', verbose: verbose || false },
						CoreStrings.Start
					);

					// Check Astro Config for required settings
					checkAstroConfig(params);

					// Setup Integrations (Internal)
					addIntegrationArray(params, [
						{ integration: nodeNamespaceBuiltinsAstro() },
						{ integration: studioCMSCore(resolvedOptions) },
						{ integration: studioCMSRenderers(rendererConfig) },
						{
							integration: studioCMSFrontend({
								verbose,
								dbStartPage,
								defaultFrontEndConfig,
							}),
						},
						{
							integration: studioCMSImageHandler({
								verbose,
								imageService,
								overrides,
							}),
						},
						{
							integration: studioCMSAuth({
								verbose,
								dbStartPage,
								dashboardConfig,
							}),
						},
						{
							integration: studioCMSDashboard({
								verbose,
								dbStartPage,
								dashboardConfig,
							}),
						},
					]);

					// Setup Integrations (External / Optional)
					addIntegrationArrayWithCheck(params, [
						{
							enabled: includedIntegrations?.useAstroRobots || false,
							knownSimilar: ['astro-robots', 'astro-robots-txt'],
							integration: studioCMSRobotsTXT({
								...robotsTXTPreset,
								...includedIntegrations?.astroRobotsConfig,
							}),
						},
					]);

					// Setup StudioCMS Plugins
					const StudioCMSPluginList: StudioCMSPluginOptions[] = [];

					for (const plugin of options.plugins) {
						if (plugin.identifier === 'studiocms') {
							throw new AstroError(
								'Plugin Identifier "studiocms" is reserved for the default StudioCMS package.',
								`Plugin ${plugin.name} has the identifier "studiocms" which is reserved for the default StudioCMS package, please change the identifier to something else, if the plugin is from a third party, please contact the author to change the identifier.`
							);
						}

						if (plugin.integration && Array.isArray(plugin.integration)) {
							addIntegrationArray(
								params,
								plugin.integration.map((i) => ({ integration: i }))
							);
						} else if (plugin.integration) {
							addIntegration(params, { integration: plugin.integration });
						}
						StudioCMSPluginList.push(plugin);
					}

					const SafePluginList: SafePluginListType = StudioCMSPluginList.map((p) => ({
						name: p.name,
						identifier: p.identifier,
						pageType: p.pageType,
						settingsPage: p.settingsPage,
						frontendNavigationLinks: p.frontendNavigationLinks,
					}));

					SafePluginList.push({
						name: 'StudioCMS (Default)',
						identifier: 'studiocms',
					});

					addVirtualImports(params, {
						name,
						imports: {
							'studiocms:plugins': `export default ${JSON.stringify(SafePluginList)};`,
						},
					});
				},
				'astro:config:done': ({ injectTypes }) => {
					injectTypes(stubs);
				},
				'astro:server:start': async (params) => {
					// Check for Updates on Development Server Start
					updateCheck(params, name, version);
				},
			},
		};
	},
});
