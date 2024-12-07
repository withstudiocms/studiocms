import type { StarlightPlugin } from '@astrojs/starlight/types';
import { createStarlightTypeDocPlugin } from 'starlight-typedoc';
import { getFilePathToPackage, makeTypedocOpts } from './src/typedocHelpers.ts';
import type { SidebarGroup } from './starlight-types.ts';

// Create Starlight TypeDoc Plugins for different parts of the Astro StudioCMS Project

// studiocms
const [tdStudioCMS, tdStudioCMS_SB] = createStarlightTypeDocPlugin();
// @studiocms/core
const [tdCore, tdCore_SB] = createStarlightTypeDocPlugin();
// @studiocms/dashboard
const [tdDashboard, tdDashboard_SB] = createStarlightTypeDocPlugin();
// @studiocms/auth
const [tdAuth, tdAuth_SB] = createStarlightTypeDocPlugin();
// @studiocms/frontend
const [tdFrontend, tdFrontend_SB] = createStarlightTypeDocPlugin();
// @studiocms/imagehandler
const [tdImageHandler, tdImageHandler_SB] = createStarlightTypeDocPlugin();
// @studiocms/renderers
const [tdRenderers, tdRenderers_SB] = createStarlightTypeDocPlugin();
// @studiocms/robotstxt
const [tdRobotsTxt, tdRobotsTxt_SB] = createStarlightTypeDocPlugin();
// @studiocms/devapps
const [tdDevApps, tdDevApps_SB] = createStarlightTypeDocPlugin();
// @studiocms/blog
const [tdBlog, tdBlog_SB] = createStarlightTypeDocPlugin();

// Set to true to enable testing mode for TypeDoc
const testTypeDoc = false;

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
						getFilePathToPackage('studiocms', 'src/integration.ts'),
						getFilePathToPackage('studiocms', 'src/updateCheck.ts'),
					],
				})
			),
			tdAuth(
				makeTypedocOpts({
					name: '@studiocms/auth',
					output: 'studiocms-auth',
					dir: 'studiocms_auth',
					entryPoints: [
						getFilePathToPackage('studiocms_auth', 'src/index.ts'),
						getFilePathToPackage('studiocms_auth', 'src/integration.ts'),
						getFilePathToPackage('studiocms_auth', 'src/schema.ts'),
						getFilePathToPackage('studiocms_auth', 'src/utils/checkENV.ts'),
						getFilePathToPackage('studiocms_auth', 'src/astroenv/env.ts'),
						getFilePathToPackage('studiocms_auth', 'src/stubs/auth-lib.ts'),
						getFilePathToPackage('studiocms_auth', 'src/stubs/auth-scripts.ts'),
						getFilePathToPackage('studiocms_auth', 'src/stubs/auth-utils.ts'),
						getFilePathToPackage('studiocms_auth', 'src/lib/encryption.ts'),
						getFilePathToPackage('studiocms_auth', 'src/lib/password.ts'),
						getFilePathToPackage('studiocms_auth', 'src/lib/rate-limit.ts'),
						getFilePathToPackage('studiocms_auth', 'src/lib/session.ts'),
						getFilePathToPackage('studiocms_auth', 'src/lib/types.ts'),
						getFilePathToPackage('studiocms_auth', 'src/lib/user.ts'),
					],
				})
			),
			tdCore(
				makeTypedocOpts({
					name: '@studiocms/core',
					output: 'studiocms-core',
					dir: 'studiocms_core',
					entryPoints: [
						getFilePathToPackage('studiocms_core', 'src/index.ts'),
						getFilePathToPackage('studiocms_core', 'src/integration.ts'),
						getFilePathToPackage('studiocms_core', 'src/consts.ts'),
						getFilePathToPackage('studiocms_core', 'src/strings.ts'),
						getFilePathToPackage('studiocms_core', 'src/types/index.ts'),
						getFilePathToPackage('studiocms_core', 'src/types/auth-types.ts'),
						getFilePathToPackage('studiocms_core', 'src/types/dbtypehelpers.ts'),
						getFilePathToPackage('studiocms_core', 'src/types/locals.ts'),
						getFilePathToPackage('studiocms_core', 'src/types/pluginOptions.ts'),
						getFilePathToPackage('studiocms_core', 'src/types/sideBarLinkType.ts'),
						getFilePathToPackage('studiocms_core', 'src/schemas/index.ts'),
						getFilePathToPackage('studiocms_core', 'src/schemas/config/auth.ts'),
						getFilePathToPackage('studiocms_core', 'src/schemas/config/componentoverrides.ts'),
						getFilePathToPackage('studiocms_core', 'src/schemas/config/dashboard.ts'),
						getFilePathToPackage('studiocms_core', 'src/schemas/config/defaultFrontend.ts'),
						getFilePathToPackage('studiocms_core', 'src/schemas/config/developer.ts'),
						getFilePathToPackage('studiocms_core', 'src/schemas/config/imageService.ts'),
						getFilePathToPackage('studiocms_core', 'src/schemas/config/index.ts'),
						getFilePathToPackage('studiocms_core', 'src/schemas/config/integrations.ts'),
						getFilePathToPackage('studiocms_core', 'src/schemas/config/markdoc.ts'),
						getFilePathToPackage('studiocms_core', 'src/schemas/config/marked.ts'),
						getFilePathToPackage('studiocms_core', 'src/schemas/config/rendererConfig.ts'),
						getFilePathToPackage('studiocms_core', 'src/lib/index.ts'),
						getFilePathToPackage('studiocms_core', 'src/lib/configManager.ts'),
						getFilePathToPackage('studiocms_core', 'src/lib/convertDashboardLinksType.ts'),
						getFilePathToPackage('studiocms_core', 'src/lib/defineStudioCMSConfig.ts'),
						getFilePathToPackage('studiocms_core', 'src/lib/head.ts'),
						getFilePathToPackage('studiocms_core', 'src/lib/jsonUtils.ts'),
						getFilePathToPackage('studiocms_core', 'src/lib/pluginSystem.ts'),
						getFilePathToPackage('studiocms_core', 'src/helpers/index.ts'),
						getFilePathToPackage('studiocms_core', 'src/helpers/authHelper.ts'),
						getFilePathToPackage('studiocms_core', 'src/helpers/contentHelper.ts'),
						getFilePathToPackage('studiocms_core', 'src/helpers/headDefaults.ts'),
						getFilePathToPackage('studiocms_core', 'src/helpers/pathGenerators.ts'),
						getFilePathToPackage('studiocms_core', 'src/helpers/routemap.ts'),
						getFilePathToPackage('studiocms_core', 'src/helpers/urlGen.ts'),
						getFilePathToPackage('studiocms_core', 'src/db/config.ts'),
						getFilePathToPackage('studiocms_core', 'src/db/tables.ts'),
						getFilePathToPackage('studiocms_core', 'src/db/tsTables.ts'),
						getFilePathToPackage('studiocms_core', 'src/components/index.ts'),
					],
				})
			),
			tdDashboard(
				makeTypedocOpts({
					name: '@studiocms/dashboard',
					output: 'studiocms-dashboard',
					dir: 'studiocms_dashboard',
					entryPoints: [
						getFilePathToPackage('studiocms_dashboard', 'src/index.ts'),
						getFilePathToPackage('studiocms_dashboard', 'src/integration.ts'),
						getFilePathToPackage('studiocms_dashboard', 'src/utils/webVital.ts'),
						getFilePathToPackage('studiocms_dashboard', 'src/utils/simpleResponse.ts'),
						getFilePathToPackage('studiocms_dashboard', 'src/utils/pageListPackageLabel.ts'),
						getFilePathToPackage('studiocms_dashboard', 'src/utils/makePageTitle.ts'),
						getFilePathToPackage('studiocms_dashboard', 'src/utils/isDashboardRoute.ts'),
						getFilePathToPackage('studiocms_dashboard', 'src/utils/astroDb.ts'),
						getFilePathToPackage('studiocms_dashboard', 'src/components/index.ts'),
					],
				})
			),
			tdFrontend(
				makeTypedocOpts({
					name: '@studiocms/frontend',
					output: 'studiocms-frontend',
					dir: 'studiocms_frontend',
					entryPoints: [
						getFilePathToPackage('studiocms_frontend', 'src/index.ts'),
						getFilePathToPackage('studiocms_frontend', 'src/integration.ts'),
						getFilePathToPackage('studiocms_frontend', 'src/components/index.ts'),
					],
				})
			),
			tdImageHandler(
				makeTypedocOpts({
					name: '@studiocms/imagehandler',
					output: 'studiocms-imagehandler',
					dir: 'studiocms_imagehandler',
					entryPoints: [
						getFilePathToPackage('studiocms_imagehandler', 'src/index.ts'),
						getFilePathToPackage('studiocms_imagehandler', 'src/schema.ts'),
						getFilePathToPackage('studiocms_imagehandler', 'src/integration.ts'),
						getFilePathToPackage('studiocms_imagehandler', 'src/components/index.ts'),
						getFilePathToPackage('studiocms_imagehandler', 'src/components/props.ts'),
						getFilePathToPackage('studiocms_imagehandler', 'src/plugins/cloudinary.ts'),
					],
				})
			),
			tdRenderers(
				makeTypedocOpts({
					name: '@studiocms/renderers',
					output: 'studiocms-renderers',
					dir: 'studiocms_renderers',
					entryPoints: [
						getFilePathToPackage('studiocms_renderers', 'src/index.ts'),
						getFilePathToPackage('studiocms_renderers', 'src/integration.ts'),
						getFilePathToPackage('studiocms_renderers', 'src/components/index.ts'),
						getFilePathToPackage('studiocms_renderers', 'src/exports/index.ts'),
						getFilePathToPackage(
							'studiocms_renderers',
							'src/exports/markdocRenderers/markdocReact.ts'
						),
						getFilePathToPackage('studiocms_renderers', 'src/lib/contentRenderer.ts'),
						getFilePathToPackage('studiocms_renderers', 'src/lib/astro-remark/index.ts'),
						getFilePathToPackage('studiocms_renderers', 'src/lib/markdoc/index.ts'),
						getFilePathToPackage('studiocms_renderers', 'src/lib/markdoc/markdocHTML.ts'),
						getFilePathToPackage('studiocms_renderers', 'src/lib/markdoc/markdocReactStatic.ts'),
						getFilePathToPackage('studiocms_renderers', 'src/lib/marked/index.ts'),
						getFilePathToPackage('studiocms_renderers', 'src/lib/mdx/index.ts'),
					],
				})
			),
			tdRobotsTxt(
				makeTypedocOpts({
					name: '@studiocms/robotstxt',
					output: 'studiocms-robotstxt',
					dir: 'studiocms_robotstxt',
					entryPoints: [
						getFilePathToPackage('studiocms_robotstxt', 'src/index.ts'),
						getFilePathToPackage('studiocms_robotstxt', 'src/core.ts'),
						getFilePathToPackage('studiocms_robotstxt', 'src/consts.ts'),
						getFilePathToPackage('studiocms_robotstxt', 'src/utils/measureExecutionTime.ts'),
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
						getFilePathToPackage('studiocms_devapps', 'src/integration.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/utils/pathGenerator.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/utils/wp-api/utils.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/utils/wp-api/converters.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/utils/wp-api/index.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/schema/index.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/schema/appsConfig.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/schema/wp-api/index.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/apps/libsqlViewer.ts'),
						getFilePathToPackage('studiocms_devapps', 'src/apps/wp-importer.ts'),
					],
				})
			),
			tdBlog(
				makeTypedocOpts({
					name: '@studiocms/blog',
					output: 'studiocms-blog',
					dir: 'studiocms_blog',
					entryPoints: [
						getFilePathToPackage('studiocms_blog', 'index.ts'),
						getFilePathToPackage('studiocms_blog', 'schema.ts'),
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
			items: [
				tdStudioCMS_SB,
				tdBlog_SB,
				tdDevApps_SB,
				{
					label: 'Internal Packages',
					collapsed: true,
					items: [
						tdCore_SB,
						tdDashboard_SB,
						tdAuth_SB,
						tdFrontend_SB,
						tdImageHandler_SB,
						tdRenderers_SB,
						tdRobotsTxt_SB,
					],
				},
			],
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
