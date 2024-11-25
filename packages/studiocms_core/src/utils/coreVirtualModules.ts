import { addVirtualImports, createResolver, defineUtility } from 'astro-integration-kit';
import {
	customRendererPlugin,
	dashboardPageLinksMap,
	externalNavigation,
	stringify,
	stringifyMap,
	studioCMSPluginList,
} from '../lib';
import type { StudioCMSOptions } from '../schemas';
import { dtsFile } from '../stubs/dts';

/**
 * Core Virtual Module Generation
 *
 * This utility is used to generate the virtual modules for the StudioCMS Core Astro Integration.
 */
export const coreVirtualModuleGeneration = defineUtility('astro:config:setup')(
	(
		params,
		name,
		options: {
			StudioCMSConfig: StudioCMSOptions;
			currentVersion: string;
			overrides?:
				| {
						FormattedDateOverride?: string | undefined;
				  }
				| undefined;
		}
	) => {
		// Destructure Params and Options
		const { StudioCMSConfig, currentVersion, overrides } = options;

		// Create Resolver for Virtual Imports
		const { resolve } = createResolver(import.meta.url);

		// Get customRendererPlugin
		let customRenderPlugin: string[] | undefined;
		if (customRendererPlugin) {
			customRenderPlugin = Array.from(customRendererPlugin);
		} else {
			customRenderPlugin = undefined;
		}

		// Setup the Plugin Module
		let pluginModule = '';
		pluginModule += `export const externalNav = new Map(${stringifyMap(externalNavigation)});\n`;
		pluginModule += `export const dashboardPageLinks = new Map(${stringifyMap(dashboardPageLinksMap)});\n`;
		pluginModule += `export const pluginList = new Map(${stringifyMap(studioCMSPluginList)});\n`;
		pluginModule += `export const customRenderers = ${stringify(customRenderPlugin)};\n`;

		// Setup the Resolvers
		const contentHelperResolved = resolve('../helpers/contentHelper.ts');
		const headDefaultsResolved = resolve('../helpers/headDefaults.ts');
		const routeMapResolved = resolve('../helpers/routemap.ts');

		// Component Resolvers
		const componentResolvers = {
			Avatar: resolve('../components/Avatar.astro'),
			FormattedDate:
				overrides?.FormattedDateOverride || resolve('../components/FormattedDate.astro'),
			Genericheader: resolve('../components/GenericHeader.astro'),
			Navigation: resolve('../components/Navigation.astro'),
		};

		// Map the Components to form the Virtual Components
		let virtualComponents = '';
		for (const [key, value] of Object.entries(componentResolvers)) {
			virtualComponents += `export { default as ${key} } from '${value}';\n`;
		}

		// Helpers Resolvers
		const helpersNamedResolvers = {
			urlGenFactory: resolve('../helpers/urlGen.ts'),
		};

		const helpersUnnamedResolvers = {
			pathGenerators: resolve('../helpers/pathGenerators.ts'),
		};

		// Map the Helpers to form the Virtual Helpers
		let virtualHelpers = '';
		for (const [key, value] of Object.entries(helpersNamedResolvers)) {
			virtualHelpers += `export { default as ${key} } from '${value}';\n`;
		}

		virtualHelpers += `export * from '${resolve('../helpers/pathGenerators.ts')}';\n`;

		// Create the Virtual Modules Map
		const imports: Record<string, string> = {
			'virtual:studiocms/config': `export default ${stringify(StudioCMSConfig)}`,
			'virtual:studiocms/version': `export default '${currentVersion}'`,
			'virtual:studiocms/pluginSystem': pluginModule,
			'studiocms:components': virtualComponents,
			'studiocms:helpers': virtualHelpers,
			'studiocms:helpers/contentHelper': `export * from '${contentHelperResolved}';`,
			'studiocms:helpers/headDefaults': `export * from '${headDefaultsResolved}';`,
			'studiocms:helpers/routemap': `export * from '${routeMapResolved}';`,
			'studiocms:i18n': `export * from '${resolve('../i18n/index.ts')}'`,
		};

		// Inject the Virtual Imports
		addVirtualImports(params, { name, imports });

		// Build the declaration file
		const dtsFileOutput = dtsFile(
			{
				Avatar: componentResolvers.Avatar,
				FormattedDate: componentResolvers.FormattedDate,
				Genericheader: componentResolvers.Genericheader,
				Navigation: componentResolvers.Navigation,
			},
			{
				urlGenFactory: helpersNamedResolvers.urlGenFactory,
				pathGenerators: helpersUnnamedResolvers.pathGenerators,
				contentHelper: contentHelperResolved,
				headDefaults: headDefaultsResolved,
				routemap: routeMapResolved,
			}
		);

		// Return the declaration file to be used in the 'config:setup:done' hook with the injectTypes function
		return { dtsFileOutput };
	}
);
