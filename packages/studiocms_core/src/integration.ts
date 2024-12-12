import { integrationLogger } from '@matthiesenxyz/integration-utils/astroUtils';
import { addVirtualImports, createResolver, defineIntegration } from 'astro-integration-kit';
import { name, version } from '../package.json';
import { StudioCMSOptionsSchema as optionsSchema } from './schemas';
import { CoreStrings } from './strings';
import componentsDtsFileOutput from './stubs/components';
import coreDtsFileOutput from './stubs/core';
import helpersDtsFileOutput from './stubs/helpers';
import i18nDTSOutput from './stubs/i18n-dts';
import libDtsFileOutput from './stubs/lib';
import sdkDtsFile from './stubs/sdk';

export default defineIntegration({
	name,
	optionsSchema,
	setup({ name, options }) {
		const { resolve } = createResolver(import.meta.url);

		return {
			hooks: {
				'astro:config:setup': async (params) => {
					// Destructure Params
					const {
						config: {
							root: { pathname: astroConfigPath },
						},
						logger,
					} = params;

					// Destruction Options
					const { verbose } = options;

					// Create resolver to resolve to the Astro Config
					const { resolve: astroConfigResolved } = createResolver(astroConfigPath);

					// Setup Virtual Imports
					integrationLogger({ logger, logLevel: 'info', verbose }, CoreStrings.AddVirtualImports);

					addVirtualImports(params, {
						name,
						imports: {
							// Old Virtual helpers - TO BE REMOVED
							'studiocms:helpers': `
								export { default as pathGenerators } from '${resolve('./lib/pathGenerators.ts')}';
							`,
							'studiocms:helpers/contentHelper': `
								export * from '${resolve('./helpers/contentHelper.ts')}';
							`,
							'studiocms:helpers/headDefaults': `
								export * from '${resolve('./lib/headDefaults.ts')}';
							`,
							'studiocms:helpers/routemap': `
								export * from '${resolve('./lib/routeMap.ts')}';
							`,

							// Core Virtual Modules
							'studiocms:config': `
								export default ${JSON.stringify(options)};
								export const config = ${JSON.stringify(options)};
								export const dashboardConfig = ${JSON.stringify(options.dashboardConfig)};
								export const AuthConfig = ${JSON.stringify(options.dashboardConfig.AuthConfig)};
								export const developerConfig = ${JSON.stringify(options.dashboardConfig.developerConfig)};
								export const defaultFrontEndConfig = ${JSON.stringify(options.defaultFrontEndConfig)};
							`,
							'studiocms:version': `
								export default '${version}';
							`,

							// Core Virtual Components
							'studiocms:components': `
								export { default as Avatar } from '${resolve('./components/Avatar.astro')}';
								export { default as FormattedDate } from '${
									options.overrides.FormattedDateOverride
										? astroConfigResolved(options.overrides.FormattedDateOverride)
										: resolve('./components/FormattedDate.astro')
								}';
								export { default as GenericHeader } from '${resolve('./components/GenericHeader.astro')}';
								export { default as Navigation } from '${resolve('./components/Navigation.astro')}';
							`,

							// StudioCMS lib
							'studiocms:lib': `
								export * from '${resolve('./lib/head.ts')}';
								export * from '${resolve('./lib/headDefaults.ts')}';
								export * from '${resolve('./lib/jsonUtils.ts')}';
								export * from '${resolve('./lib/pathGenerators.ts')}';
								export * from '${resolve('./lib/removeLeadingTrailingSlashes.ts')}';
								export * from '${resolve('./lib/routeMap.ts')}';
								export * from '${resolve('./lib/urlGen.ts')}';
							`,

							// StudioCMS Core i18n
							'studiocms:i18n': `
								export * from '${resolve('./i18n/index.ts')}';
							`,

							// StudioCMS SDK
							'studiocms:sdk': `
								import studioCMS_SDK from '${resolve('./sdk-utils/index.ts')}';
								export default studioCMS_SDK;
							`,
							'studiocms:sdk/get': `
								import studioCMS_SDK_GET from '${resolve('./sdk-utils/get/index.ts')}';
								export default studioCMS_SDK_GET;
							`,
							'studiocms:sdk/post': `
								import studioCMS_SDK_POST from '${resolve('./sdk-utils/post/index.ts')}';
								export default studioCMS_SDK_POST;
							`,
							'studiocms:sdk/update': `
								import studioCMS_SDK_UPDATE from '${resolve('./sdk-utils/update/index.ts')}';
								export default studioCMS_SDK_UPDATE;
							`,
							'studiocms:sdk/delete': `
								import studioCMS_SDK_DELETE from '${resolve('./sdk-utils/delete/index.ts')}';
								export default studioCMS_SDK_DELETE;
							`,
							'studiocms:sdk/auth': `
								import studioCMS_SDK_AUTH from '${resolve('./sdk-utils/auth/index.ts')}';
								export default studioCMS_SDK_AUTH;
							`,
							'studiocms:sdk/types': `
								export * from '${resolve('./sdk-utils/types.ts')}';
							`,
						},
					});
				},
				'astro:config:done': async ({ injectTypes }) => {
					// Inject the DTS File
					injectTypes(componentsDtsFileOutput);
					injectTypes(coreDtsFileOutput);
					injectTypes(i18nDTSOutput);
					injectTypes(sdkDtsFile);
					injectTypes(libDtsFileOutput);
					// TODO Remove the following once the new helpers are in place
					injectTypes(helpersDtsFileOutput);
				},
			},
		};
	},
});
