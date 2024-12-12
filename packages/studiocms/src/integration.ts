import { addIntegrationArray } from '@matthiesenxyz/integration-utils/aikUtils';
import {
	integrationLogger,
	nodeNamespaceBuiltinsAstro,
} from '@matthiesenxyz/integration-utils/astroUtils';
import studioCMSAuth from '@studiocms/auth';
import studioCMSCore from '@studiocms/core';
import {
	type StudioCMSOptions,
	StudioCMSOptionsSchema as optionsSchema,
} from '@studiocms/core/schemas';
import { CoreStrings, robotsTXTPreset } from '@studiocms/core/strings';
import { checkAstroConfig, configResolver, getStudioConfigFileUrl } from '@studiocms/core/utils';
import studioCMSDashboard from '@studiocms/dashboard';
import studioCMSFrontend from '@studiocms/frontend';
import studioCMSImageHandler from '@studiocms/imagehandler';
import studioCMSRenderers from '@studiocms/renderers';
import studioCMSRobotsTXT from '@studiocms/robotstxt';
import { defineIntegration } from 'astro-integration-kit';
import { name, version } from '../package.json';
import { pluginsResolver } from './plugins';
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
				// @ts-ignore
				'astro:db:setup': ({ extendDb }) => {
					extendDb({ configEntrypoint: '@studiocms/core/db/config' });
				},
				'astro:config:setup': async (params) => {
					// Destructure Params
					const { config: astroConfig, addWatchFile, logger } = params;

					// Watch the StudioCMS Config File for changes (including creation/deletion)
					addWatchFile(getStudioConfigFileUrl(astroConfig.root.pathname));

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

					pluginsResolver(params, name, version, resolvedOptions);

					// Setup Integrations (External)

					// Robots.txt
					if (
						includedIntegrations?.robotsTXT === true ||
						typeof includedIntegrations?.robotsTXT === 'object'
					) {
						const robotsTXTConfig =
							includedIntegrations?.robotsTXT === true ? {} : includedIntegrations?.robotsTXT;

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
