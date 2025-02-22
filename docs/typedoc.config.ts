import type { StarlightPlugin } from '@astrojs/starlight/types';
import { createStarlightTypeDocPlugin } from 'starlight-typedoc';
import { getFilePathToPackage, makeTypedocOpts } from './src/typedocHelpers.ts';
import type { SidebarGroup } from './starlight-types.ts';

// Create Starlight TypeDoc Plugins for different parts of the Astro StudioCMS Project

// studiocms
const [tdStudioCMS, tdStudioCMS_SB] = createStarlightTypeDocPlugin();
// @studiocms/devapps
const [tdDevApps, tdDevApps_SB] = createStarlightTypeDocPlugin();
// @studiocms/blog
const [tdBlog, tdBlog_SB] = createStarlightTypeDocPlugin();

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
						getFilePathToPackage('studiocms', 'src/sdk/StudioCMSVirtualCache.ts'),
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

export const TypeDocSideBarEntry = (isProd: boolean, testingMode: boolean): SidebarGroup => {
	if (isProd || testingMode) {
		return {
			label: 'TypeDoc',
			badge: {
				text: 'Auto Generated',
				variant: 'tip',
			},
			collapsed: true,
			items: [tdStudioCMS_SB, tdBlog_SB, tdDevApps_SB],
		};
	}
	return {
		label: 'TypeDoc',
		badge: {
			text: 'Auto Generated',
			variant: 'tip',
		},
		collapsed: true,
		items: [],
	};
};

export const typeDocSideBarEntry = TypeDocSideBarEntry(isProd, testTypeDoc);
