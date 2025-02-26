import type { StarlightPlugin } from '@astrojs/starlight/types';
import { createStarlightTypeDocPlugin } from 'starlight-typedoc';
import type { StarlightTypeDocOptions } from 'starlight-typedoc';

// Utility function to create TypeDoc related paths
export function getFilePathToPackage(name: string, path: string) {
	return `../packages/${name}/${path}`;
}

// Utility function to create TypeDoc options for the StudioCMS packages so that each package documentation is the same when generated
export function makeTypedocOpts(o: {
	name: string;
	dir: string;
	output: string;
	entryPoints: StarlightTypeDocOptions['entryPoints'];
}): StarlightTypeDocOptions {
	return {
		tsconfig: getFilePathToPackage(o.dir, 'tsconfig.json'),
		entryPoints: o.entryPoints,
		output: `typedoc/${o.output}`,
		typeDoc: {
			plugin: [
				'typedoc-plugin-zod',
				'typedoc-plugin-frontmatter',
				'./src/plugins/frontmatter.js',
				'./src/plugins/readmes.js',
			],
			skipErrorChecking: true,
			gitRemote: 'https://github.com/withstudiocms/studiocms/blob',
			gitRevision: 'main',
			sourceLinkTemplate:
				'https://github.com/withstudiocms/studiocms/blob/{gitRevision}/{path}#L{line}',
			includeVersion: true,
			expandObjects: true,
			expandParameters: true,
			useCodeBlocks: true,
			useHTMLAnchors: true,
			sourceLinkExternal: true,
			outputFileStrategy: 'modules',
			pretty: true,
		},
	};
}
// Create Starlight TypeDoc Plugins for different parts of the Astro StudioCMS Project

// studiocms
const tdStudioCMS = createStarlightTypeDocPlugin()[0];
// @studiocms/devapps
const tdDevApps = createStarlightTypeDocPlugin()[0];
// @studiocms/blog
const tdBlog = createStarlightTypeDocPlugin()[0];

// Set to true to enable testing mode for TypeDoc
const testTypeDoc = true;

const isProd = process.env.NODE_ENV === 'production';

const TypeDocPlugins = (isProd: boolean, testingMode: boolean): StarlightPlugin[] => {
	if (isProd || testingMode) {
		return [
			tdStudioCMS(
				makeTypedocOpts({
					name: 'studiocms',
					output: 'studiocms',
					dir: 'studiocms',
					entryPoints: [
						getFilePathToPackage('studiocms', 'src/index.ts'),
						getFilePathToPackage('studiocms', 'src/config.ts'),
						getFilePathToPackage('studiocms', 'src/consts.ts'),
						getFilePathToPackage('studiocms', 'src/errors.ts'),
						getFilePathToPackage('studiocms', 'src/plugins.ts'),
						getFilePathToPackage('studiocms', 'src/types.ts'),
						getFilePathToPackage('studiocms', 'src/db/config.ts'),
						getFilePathToPackage('studiocms', 'src/db/tables.ts'),
						getFilePathToPackage('studiocms', 'src/sdk/index.ts'),
						getFilePathToPackage('studiocms', 'src/sdk/cache.ts'),
						getFilePathToPackage('studiocms', 'src/sdk/core.ts'),
						getFilePathToPackage('studiocms', 'src/sdk/StudioCMSVirtualCache.ts'),
						getFilePathToPackage('studiocms', 'src/sdk/errors.ts'),
						getFilePathToPackage('studiocms', 'src/sdk/tables.ts'),
						getFilePathToPackage('studiocms', 'src/sdk/types/index.ts'),
						getFilePathToPackage('studiocms', 'src/sdk/types/tableDefs.ts'),
						getFilePathToPackage('studiocms', 'src/sdk/types/tsAlias.ts'),
						getFilePathToPackage('studiocms', 'src/sdk/lib/foldertree.ts'),
						getFilePathToPackage('studiocms', 'src/sdk/lib/generators.ts'),
						getFilePathToPackage('studiocms', 'src/sdk/lib/packages.ts'),
						getFilePathToPackage('studiocms', 'src/sdk/lib/parsers.ts'),
						getFilePathToPackage('studiocms', 'src/sdk/lib/users.ts'),
						getFilePathToPackage('studiocms', 'src/schemas/index.ts'),
						getFilePathToPackage('studiocms', 'src/schemas/plugins/index.ts'),
						getFilePathToPackage('studiocms', 'src/schemas/plugins/shared.ts'),
						getFilePathToPackage('studiocms', 'src/schemas/config/index.ts'),
						getFilePathToPackage('studiocms', 'src/schemas/config/auth.ts'),
						getFilePathToPackage('studiocms', 'src/schemas/config/componentoverrides.ts'),
						getFilePathToPackage('studiocms', 'src/schemas/config/dashboard.ts'),
						getFilePathToPackage('studiocms', 'src/schemas/config/defaultFrontend.ts'),
						getFilePathToPackage('studiocms', 'src/schemas/config/developer.ts'),
						getFilePathToPackage('studiocms', 'src/schemas/config/imageService.ts'),
						getFilePathToPackage('studiocms', 'src/schemas/config/integrations.ts'),
						getFilePathToPackage('studiocms', 'src/schemas/config/markdoc.ts'),
						getFilePathToPackage('studiocms', 'src/schemas/config/mdx.ts'),
						getFilePathToPackage('studiocms', 'src/schemas/config/rendererConfig.ts'),
						getFilePathToPackage('studiocms', 'src/schemas/config/sdk.ts'),
						getFilePathToPackage('studiocms', 'src/schemas/config/studiocms-markdown-remark.ts'),
						getFilePathToPackage('studiocms', 'src/lib/auth/encryption.ts'),
						getFilePathToPackage('studiocms', 'src/lib/auth/password.ts'),
						getFilePathToPackage('studiocms', 'src/lib/auth/rate-limit.ts'),
						getFilePathToPackage('studiocms', 'src/lib/auth/session.ts'),
						getFilePathToPackage('studiocms', 'src/lib/auth/types.ts'),
						getFilePathToPackage('studiocms', 'src/lib/auth/user.ts'),
						getFilePathToPackage('studiocms', 'src/lib/dynamic-sitemap/index.ts'),
						getFilePathToPackage('studiocms', 'src/lib/dynamic-sitemap/sitemap-index.xml.ts'),
						getFilePathToPackage('studiocms', 'src/lib/i18n/index.ts'),
						getFilePathToPackage('studiocms', 'src/lib/robots/index.ts'),
						getFilePathToPackage('studiocms', 'src/lib/robots/core.ts'),
						getFilePathToPackage('studiocms', 'src/lib/robots/types.ts'),
						getFilePathToPackage('studiocms', 'src/lib/robots/utils.ts'),
						getFilePathToPackage('studiocms', 'src/lib/webVitals/checkForWebVitalsPlugin.ts'),
						getFilePathToPackage('studiocms', 'src/lib/webVitals/consts.ts'),
						getFilePathToPackage('studiocms', 'src/lib/webVitals/schemas.ts'),
						getFilePathToPackage('studiocms', 'src/lib/webVitals/types.ts'),
						getFilePathToPackage('studiocms', 'src/lib/webVitals/webVital.ts'),
						getFilePathToPackage('studiocms', 'src/lib/webVitals/webVitalsRouteSummary.ts'),
						getFilePathToPackage('studiocms', 'src/lib/webVitals/webVitalsSummary.ts'),
						getFilePathToPackage('studiocms', 'src/lib/dashboardGrid.ts'),
						getFilePathToPackage('studiocms', 'src/lib/head.ts'),
						getFilePathToPackage('studiocms', 'src/lib/headDefaults.ts'),
						getFilePathToPackage('studiocms', 'src/lib/makeAPIRoute.ts'),
						getFilePathToPackage('studiocms', 'src/lib/makePublicRoute.ts'),
						getFilePathToPackage('studiocms', 'src/lib/pathGenerators.ts'),
						getFilePathToPackage('studiocms', 'src/lib/removeLeadingTrailingSlashes.ts'),
						getFilePathToPackage('studiocms', 'src/lib/routeMap.ts'),
						getFilePathToPackage('studiocms', 'src/lib/urlGen.ts'),
						getFilePathToPackage('studiocms', 'src/runtime/AstroComponentProxy.ts'),
						getFilePathToPackage('studiocms', 'src/runtime/decoder/index.ts'),
						getFilePathToPackage('studiocms', 'src/runtime/decoder/decode-codepoint.ts'),
						getFilePathToPackage('studiocms', 'src/runtime/decoder/decode-data-html.ts'),
						getFilePathToPackage('studiocms', 'src/runtime/decoder/decode-data-xml.ts'),
						getFilePathToPackage('studiocms', 'src/runtime/decoder/utils.ts'),
						getFilePathToPackage('studiocms', 'src/scripts/formListener.ts'),
						getFilePathToPackage('studiocms', 'src/scripts/three.ts'),
						getFilePathToPackage('studiocms', 'src/scripts/utils/fitModelToViewport.ts'),
					],
				})
			),
			tdDevApps(
				makeTypedocOpts({
					name: '@studiocms/devapps',
					output: 'studiocms-devapps',
					dir: 'studiocms_devapps',
					entryPoints: [
						getFilePathToPackage('studiocms_devapps', 'src/index.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/apps/libsql-viewer.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/apps/wp-importer.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/routes/wp-importer.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/schema/index.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/schema/wp-api.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/utils/wp-api/converters.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/utils/wp-api/index.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/utils/wp-api/pages.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/utils/wp-api/posts.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/utils/wp-api/settings.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/utils/wp-api/utils.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/utils/app-utils.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/utils/pathGenerator.ts'),
					],
				})
			),
			tdBlog(
				makeTypedocOpts({
					name: '@studiocms/blog',
					output: 'studiocms-blog',
					dir: 'studiocms_blog',
					entryPoints: [
						getFilePathToPackage('studiocms_blog', 'src/index.ts'),
						getFilePathToPackage('studiocms_blog', 'src/types.ts'),
					],
				})
			),
		];
	}
	return [] as StarlightPlugin[];
};

export const typeDocPlugins = TypeDocPlugins(isProd, testTypeDoc);
