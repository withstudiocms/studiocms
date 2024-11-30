import { addIntegrationArray } from '@matthiesenxyz/integration-utils/aikUtils';
import {
	integrationLogger,
	nodeNamespaceBuiltinsAstro,
} from '@matthiesenxyz/integration-utils/astroUtils';
import studioCMSAuth from '@studiocms/auth';
import studioCMSCore from '@studiocms/core';
import { getStudioConfigFileUrl, studioCMSPluginList } from '@studiocms/core/lib';
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
import { name, version } from '../package.json';
import { generateStubs } from './stubs';
import { updateCheck } from './updateCheck';

// Main Integration
export default defineIntegration({
	name,
	optionsSchema,
	setup({ name, options }) {
		// Register StudioCMS into the StudioCMS Plugin List
		studioCMSPluginList.set(name, { name, label: 'StudioCMS' });

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

					const SafePluginList: SafePluginListType = StudioCMSPluginList.map(
						({ name, identifier, pageType, settingsPage }) => ({
							name,
							identifier,
							pageType,
							settingsPage,
						})
					);

					addVirtualImports(params, {
						name,
						imports: {
							'studiocms:plugins': `export default = ${JSON.stringify(SafePluginList)};`,
						},
					});
				},
				'astro:config:done': ({ injectTypes }) => {
					injectTypes(generateStubs());
				},
				'astro:server:start': async (params) => {
					// Check for Updates on Development Server Start
					updateCheck(params, name, version);
				},
			},
		};
	},
});
