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
			flattenOutputFiles: true,
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
						getFilePathToPackage('studiocms', 'src/sdk/errors.ts'),
						getFilePathToPackage('studiocms', 'src/schemas/index.ts'),
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
						getFilePathToPackage('studiocms_devapps', 'src/schema/index.ts'),
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
