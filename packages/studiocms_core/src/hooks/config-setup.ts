import { integrationLogger } from '@matthiesenxyz/integration-utils/astroUtils';
import { addVirtualImports, createResolver, defineUtility } from 'astro-integration-kit';
import copy from 'rollup-plugin-copy';
import { name, version } from '../../package.json';
import { makeAPIRoute, makePublicRoute } from '../lib';
import type { StudioCMSConfig } from '../schemas';

export const configSetup = defineUtility('astro:config:setup')(
	(params, options: StudioCMSConfig) => {
		// Destructure the params
		const {
			logger,
			injectRoute,
			updateConfig,
			config: {
				root: { pathname: userSrcDir },
			},
		} = params;

		// Create logInfo object
		const logInfo = { logger, logLevel: 'info' as const, verbose: options.verbose };

		// Log the setup
		integrationLogger(logInfo, 'Setting up StudioCMS Core...');

		// Create resolvers
		const { resolve } = createResolver(import.meta.url);
		const { resolve: userSrcDirResolve } = createResolver(userSrcDir);

		updateConfig({
			vite: {
				plugins: [
					copy({
						copyOnce: true,
						hook: 'buildStart',
						targets: [
							{
								src: resolve('../public/*'),
								dest: makePublicRoute('core'),
							},
						],
					}),
				],
			},
		});

		// Setup Virtual Imports
		integrationLogger(logInfo, 'Adding Virtual Imports...');

		addVirtualImports(params, {
			name,
			imports: {
				// Core Virtual Modules
				'studiocms:config': `
				export default ${JSON.stringify(options)};
				export const config = ${JSON.stringify(options)};
				export const dashboardConfig = ${JSON.stringify(options.dashboardConfig)};
				export const AuthConfig = ${JSON.stringify(options.dashboardConfig.AuthConfig)};
				export const developerConfig = ${JSON.stringify(options.dashboardConfig.developerConfig)};
				export const defaultFrontEndConfig = ${JSON.stringify(options.defaultFrontEndConfig)};
				export const sdk = ${JSON.stringify(options.sdk)};
				`,
				'studiocms:version': `
				export default '${version}';
				`,

				// Core Virtual Components
				'studiocms:components': `
				export { default as Avatar } from '${resolve('../components/Avatar.astro')}';
				export { default as FormattedDate } from '${
					options.overrides.FormattedDateOverride
						? userSrcDirResolve(options.overrides.FormattedDateOverride)
						: resolve('../components/FormattedDate.astro')
				}';
				export { default as GenericHeader } from '${resolve('../components/GenericHeader.astro')}';
				export { default as Navigation } from '${resolve('../components/Navigation.astro')}';
				`,

				// StudioCMS lib
				'studiocms:lib': `
				export * from '${resolve('../lib/head.ts')}';
				export * from '${resolve('../lib/headDefaults.ts')}';
				export * from '${resolve('../lib/jsonUtils.ts')}';
				export * from '${resolve('../lib/pathGenerators.ts')}';
				export * from '${resolve('../lib/removeLeadingTrailingSlashes.ts')}';
				export * from '${resolve('../lib/routeMap.ts')}';
				export * from '${resolve('../lib/urlGen.ts')}';
				`,

				// StudioCMS Core i18n
				'studiocms:i18n': `
				export * from '${resolve('../i18n/index.ts')}';
				`,

				// StudioCMS SDK
				'studiocms:sdk': `
				import studioCMS_SDK from '${resolve('../sdk-utils/index.ts')}';
				export default studioCMS_SDK;
				`,
				'studiocms:sdk/get': `
				import studioCMS_SDK_GET from '${resolve('../sdk-utils/get.ts')}';
				export default studioCMS_SDK_GET;
				`,
				'studiocms:sdk/post': `
				import studioCMS_SDK_POST from '${resolve('../sdk-utils/post.ts')}';
				export default studioCMS_SDK_POST;
				`,
				'studiocms:sdk/update': `
				import studioCMS_SDK_UPDATE from '${resolve('../sdk-utils/update.ts')}';
				export default studioCMS_SDK_UPDATE;
				`,
				'studiocms:sdk/delete': `
				import studioCMS_SDK_DELETE from '${resolve('../sdk-utils/delete.ts')}';
				export default studioCMS_SDK_DELETE;
				`,
				'studiocms:sdk/auth': `
				import studioCMS_SDK_AUTH from '${resolve('../sdk-utils/auth.ts')}';
				export default studioCMS_SDK_AUTH;
				`,
				'studiocms:sdk/types': `
				export * from '${resolve('../sdk-utils/types.ts')}';
				`,
				'studiocms:sdk/cache': `
				export * from '${resolve('../sdk-utils/cache.ts')}';
				import studioCMS_SDK_Cache from '${resolve('../sdk-utils/cache.ts')}';
				export default studioCMS_SDK_Cache;
				`,
			},
		});

		// Inject SDK API Routes
		integrationLogger(logInfo, 'Injecting SDK Routes...');

		const sdkRouteResolver = makeAPIRoute('sdk');

		injectRoute({
			pattern: sdkRouteResolver('list-pages'),
			entrypoint: resolve('../routes/list-pages.ts'),
			prerender: false,
		});

		injectRoute({
			pattern: sdkRouteResolver('fallback-list-pages.json'),
			entrypoint: resolve('../routes/fallback-list-pages.json.ts'),
			prerender: true,
		});

		injectRoute({
			pattern: sdkRouteResolver('update-latest-version-cache'),
			entrypoint: resolve('../routes/update-latest-version-cache.ts'),
			prerender: false,
		});

		integrationLogger(logInfo, 'Core Setup Complete...');
	}
);

export default configSetup;
