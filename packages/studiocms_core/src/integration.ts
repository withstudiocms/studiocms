import { integrationLogger } from '@matthiesenxyz/integration-utils/astroUtils';
import type { InjectedType } from 'astro';
import { addVirtualImports, createResolver, defineIntegration } from 'astro-integration-kit';
import { version } from '../package.json';
import { name } from '../package.json';
import { StudioCMSOptionsSchema as optionsSchema } from './schemas';
import { CoreStrings } from './strings';
import { i18nDTSOutput } from './stubs/i18n-dts';
import { sdkDtsFile } from './stubs/sdk';
import { coreVirtualModuleGeneration } from './utils/coreVirtualModules';

export default defineIntegration({
	name,
	optionsSchema,
	setup({ name, options }) {
		// Declaration for Core DTS File
		let coreDtsFile: InjectedType;

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
					const { dtsFileOutput } = coreVirtualModuleGeneration(params, name, {
						StudioCMSConfig: options,
						currentVersion: version,
						overrides: {
							FormattedDateOverride:
								options.overrides.FormattedDateOverride &&
								astroConfigResolved(options.overrides.FormattedDateOverride),
						},
					});

					addVirtualImports(params, {
						name,
						imports: {
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
								import type { STUDIOCMS_SDK } from '${resolve('./sdk-utils/types.ts')}';
								export type { STUDIOCMS_SDK };
							`,
						},
					});

					// Set the DTS File
					coreDtsFile = dtsFileOutput;
				},
				'astro:config:done': async ({ injectTypes }) => {
					// Inject the DTS File
					injectTypes(coreDtsFile);
					injectTypes(i18nDTSOutput);
					injectTypes(sdkDtsFile);
				},
			},
		};
	},
});
