import type { AstroIntegration } from 'astro';
import { addVirtualImports, createResolver, defineUtility } from 'astro-integration-kit';
import boxen from 'boxen';
import { compare as semCompare } from 'semver';
import { routesDir } from './consts.js';
import { StudioCMSError } from './errors.js';
import { DefaultPageTypeComponents } from './index.js';
import type { GridItemInput } from './lib/dashboardGrid.js';
import { dynamicSitemap } from './lib/dynamic-sitemap/index.js';
import robotsTXT from './lib/robots/index.js';
import type { RobotsConfig } from './lib/robots/types.js';
import { checkForWebVitals } from './lib/webVitals/checkForWebVitalsPlugin.js';
import type {
	AvailableDashboardPages,
	SafePluginListItemType,
	SafePluginListType,
	StudioCMSPlugin,
} from './schemas/index.js';
import type { Messages, Route } from './types.js';
import { convertHyphensToUnderscores } from './utils/convert-hyphens.js';
import { integrationLogger } from './utils/integrationLogger.js';
import { pageContentComponentFilter, rendererComponentFilter } from './utils/pageTypeFilter.js';
import { pluginLogger } from './utils/pluginLogger.js';
import { readJson } from './utils/readJson.js';
import { convertToSafeString } from './utils/safeString.js';

// Resolver Function
const { resolve } = createResolver(import.meta.url);

// Read the package.json file for the package name and version
const { version: pkgVersion } = readJson<{ name: string; version: string }>(
	resolve('../package.json')
);

/**
 * **Default StudioCMS Plugin**
 *
 * **NOTE** - Internal use only
 *
 * The default StudioCMS Plugin that comes with StudioCMS.
 *
 * @see The [StudioCMS Docs](https://docs.studiocms.dev) for more information on how to use StudioCMS.
 */
export const defaultPlugin: StudioCMSPlugin = {
	name: 'StudioCMS (Built-in)',
	identifier: 'studiocms',
	studiocmsMinimumVersion: pkgVersion,
	hooks: {
		'studiocms:config:setup': ({ setDashboard, setRendering }) => {
			setDashboard({
				dashboardGridItems: [
					{
						name: 'overview',
						span: 1,
						variant: 'default',
						requiresPermission: 'editor',
						header: { title: 'Overview', icon: 'bolt' },
						body: {
							html: '<totals></totals>',
							components: {
								totals: resolve('./components/default-grid-items/Totals.astro'),
							},
						},
					},
					{
						name: 'recently-updated-pages',
						span: 2,
						variant: 'default',
						requiresPermission: 'editor',
						header: { title: 'Recently Updated Pages', icon: 'document-arrow-up' },
						body: {
							html: '<recentlyupdatedpages></recentlyupdatedpages>',
							components: {
								recentlyupdatedpages: resolve(
									'./components/default-grid-items/Recently-updated-pages.astro'
								),
							},
						},
					},
					{
						name: 'recently-signed-up-users',
						span: 1,
						variant: 'default',
						requiresPermission: 'admin',
						header: { title: 'Recently Signed Up Users', icon: 'user-group' },
						body: {
							html: '<recentlysignedupusers></recentlysignedupusers>',
							components: {
								recentlysignedupusers: resolve(
									'./components/default-grid-items/Recently-signed-up.astro'
								),
							},
						},
					},
					{
						name: 'recently-created-pages',
						span: 2,
						variant: 'default',
						requiresPermission: 'editor',
						header: { title: 'Recently Created Pages', icon: 'document-plus' },
						body: {
							html: '<recentlycreatedpages></recentlycreatedpages>',
							components: {
								recentlycreatedpages: resolve(
									'./components/default-grid-items/Recently-created-pages.astro'
								),
							},
						},
					},
				],
			});

			setRendering({
				pageTypes: [
					{
						label: 'Markdown (Built-in)',
						identifier: 'studiocms/markdown',
						pageContentComponent:
							DefaultPageTypeComponents['studiocms/markdown'].pageContentComponent,
						rendererComponent: DefaultPageTypeComponents['studiocms/markdown'].rendererComponent,
					},
					{
						label: 'HTML (Built-in)',
						identifier: 'studiocms/html',
						pageContentComponent: DefaultPageTypeComponents['studiocms/html'].pageContentComponent,
						rendererComponent: DefaultPageTypeComponents['studiocms/html'].rendererComponent,
					},
				],
			});
		},
	},
};

type Options = {
	dbStartPage: boolean;
	verbose: boolean;
	name: string;
	pkgVersion: string;
	plugins: StudioCMSPlugin[] | undefined;
	robotsTXTConfig: boolean | RobotsConfig;
	ComponentRegistry: Record<string, string>;
	dashboardRoute: (path: string) => string;
	astroConfigResolve: (...path: Array<string>) => string;
};

export const pluginHandler = defineUtility('astro:config:setup')(
	async (params, options: Options) => {
		const { logger } = params;

		const {
			dbStartPage,
			verbose,
			name,
			pkgVersion,
			plugins,
			robotsTXTConfig,
			dashboardRoute,
			astroConfigResolve,
			ComponentRegistry,
		} = options;

		const logInfo = { logger, logLevel: 'info' as const, verbose };

		/////

		const integrations: {
			integration: AstroIntegration;
		}[] = [];

		// Define the available Dashboard Grid Items
		const availableDashboardGridItems: GridItemInput[] = [];

		// Define the available Dashboard Pages
		const availableDashboardPages: AvailableDashboardPages = {
			user: [],
			admin: [],
		};

		// Define the Plugin Settings Endpoints
		const pluginSettingsEndpoints: {
			apiEndpoint: string;
			identifier: string;
			safeIdentifier: string;
		}[] = [];

		// Define if the Sitemap is enabled
		let sitemapEnabled = false;

		// Define the Sitemaps Array
		const sitemaps: {
			pluginName: string;
			sitemapXMLEndpointPath: string | URL;
		}[] = [];

		// Define the Plugin Endpoints
		const pluginEndpoints: {
			apiEndpoint: string;
			identifier: string;
			safeIdentifier: string;
		}[] = [];

		const pluginRenderers: {
			pageType: string;
			safePageType: string;
			content: string;
		}[] = [];

		// Define the Safe Plugin List
		const safePluginList: SafePluginListType = [];

		const extraRoutes: Route[] = [];

		const messages: Messages = [];

		/////

		integrationLogger(logInfo, 'Setting up StudioCMS plugins...');

		if (!dbStartPage) {
			// Check for `@astrojs/web-vitals` Integration
			const wvPlugin = checkForWebVitals(params, { name, verbose, version: pkgVersion });

			// Initialize and Add the default StudioCMS Plugin to the Safe Plugin List
			const pluginsToProcess: StudioCMSPlugin[] = [defaultPlugin];

			if (wvPlugin) pluginsToProcess.push(wvPlugin);

			if (plugins) pluginsToProcess.push(...plugins);

			// Resolve StudioCMS Plugins
			for (const plugin of pluginsToProcess) {
				const { studiocmsMinimumVersion = '0.0.0', hooks = {}, ...safeData } = plugin;
				// Check if the plugin has a minimum version requirement
				const comparison = semCompare(studiocmsMinimumVersion, pkgVersion);

				if (comparison === 1) {
					throw new StudioCMSError(
						`Plugin ${safeData.name} requires StudioCMS version ${studiocmsMinimumVersion} or higher.`,
						`Plugin ${safeData.name} requires StudioCMS version ${studiocmsMinimumVersion} or higher. Please update StudioCMS to the required version, contact the plugin author to update the minimum version requirement or remove the plugin from the StudioCMS config.`
					);
				}

				let foundSettingsPage: SafePluginListItemType['settingsPage'] = undefined;
				let foundFrontendNavigationLinks: SafePluginListItemType['frontendNavigationLinks'] =
					undefined;
				let foundPageTypes: SafePluginListItemType['pageTypes'] = undefined;

				if (typeof hooks['studiocms:astro:config'] === 'function') {
					await hooks['studiocms:astro:config']({
						logger: pluginLogger(safeData.identifier, logger),
						// Add the plugin Integration to the Astro config
						addIntegrations(integration) {
							if (integration) {
								if (Array.isArray(integration)) {
									integrations.push(...integration.map((integration) => ({ integration })));
									return;
								}
								integrations.push({ integration });
							}
						},
					});
				}

				if (typeof hooks['studiocms:config:setup'] === 'function') {
					await hooks['studiocms:config:setup']({
						logger: pluginLogger(safeData.identifier, logger),

						setDashboard({ dashboardGridItems, dashboardPages, settingsPage }) {
							if (dashboardGridItems) {
								availableDashboardGridItems.push(
									...dashboardGridItems.map((item) => ({
										...item,
										name: `${convertToSafeString(safeData.identifier)}/${convertToSafeString(item.name)}`,
									}))
								);
							}

							if (dashboardPages) {
								if (dashboardPages.user) {
									availableDashboardPages.user?.push(
										...dashboardPages.user.map((page) => ({
											...page,
											slug: `${convertToSafeString(safeData.identifier)}/${convertToSafeString(page.route)}`,
										}))
									);
								}
								if (dashboardPages.admin) {
									availableDashboardPages.admin?.push(
										...dashboardPages.admin.map((page) => ({
											...page,
											slug: `${convertToSafeString(safeData.identifier)}/${convertToSafeString(page.route)}`,
										}))
									);
								}
							}

							if (settingsPage) {
								const { endpoint } = settingsPage;

								if (endpoint) {
									pluginSettingsEndpoints.push({
										identifier: safeData.identifier,
										safeIdentifier: convertToSafeString(safeData.identifier),
										apiEndpoint: `
														export { onSave as ${convertToSafeString(safeData.identifier)}_onSave } from '${endpoint}';
													`,
									});
								}

								foundSettingsPage = settingsPage;
							}
						},

						setSitemap({ sitemaps: pluginSitemaps, triggerSitemap }) {
							if (triggerSitemap) sitemapEnabled = triggerSitemap;

							if (pluginSitemaps) {
								sitemaps.push(...pluginSitemaps);
							}
						},

						setFrontend({ frontendNavigationLinks }) {
							if (frontendNavigationLinks) {
								foundFrontendNavigationLinks = frontendNavigationLinks;
							}
						},

						setRendering({ pageTypes }) {
							for (const { apiEndpoint, identifier, rendererComponent } of pageTypes || []) {
								if (apiEndpoint) {
									pluginEndpoints.push({
										identifier: identifier,
										safeIdentifier: convertToSafeString(identifier),
										apiEndpoint: `
														export { onCreate as ${convertToSafeString(identifier)}_onCreate } from '${apiEndpoint}';
														export { onEdit as ${convertToSafeString(identifier)}_onEdit } from '${apiEndpoint}';
														export { onDelete as ${convertToSafeString(identifier)}_onDelete } from '${apiEndpoint}';
													`,
									});
								}

								if (rendererComponent) {
									const builtIns = rendererComponentFilter(
										rendererComponent,
										convertToSafeString(identifier),
										DefaultPageTypeComponents
									);
									pluginRenderers.push({
										pageType: identifier,
										safePageType: convertToSafeString(identifier),
										content: builtIns,
									});
								}
							}

							foundPageTypes = pageTypes;
						},
					});
				}

				const safePlugin: SafePluginListItemType = {
					...safeData,
					settingsPage: foundSettingsPage,
					frontendNavigationLinks: foundFrontendNavigationLinks,
					pageTypes: foundPageTypes,
				};

				safePluginList.push(safePlugin);
			}

			// Robots.txt Integration (Default)
			if (robotsTXTConfig === true) {
				integrations.push({ integration: robotsTXT({ sitemap: sitemapEnabled }) });
			} else if (typeof robotsTXTConfig === 'object') {
				integrations.push({
					integration: robotsTXT({
						...robotsTXTConfig,
						sitemap: sitemapEnabled,
					}),
				});
			}

			if (sitemapEnabled) {
				integrations.push({
					integration: dynamicSitemap({ sitemaps }),
				});
			}

			// Inject Dashboard plugin page route, if any plugins have dashboard pages
			if (
				(availableDashboardPages.user && availableDashboardPages.user.length > 0) ||
				(availableDashboardPages.admin && availableDashboardPages.admin.length > 0)
			) {
				extraRoutes.push({
					enabled: true,
					pattern: dashboardRoute('[...pluginPage]'),
					entrypoint: routesDir.dashRoute('[...pluginPage].astro'),
				});
			}

			const allPageTypes = safePluginList.flatMap(({ pageTypes }) => pageTypes || []);

			const editorKeys = allPageTypes.map(({ identifier }) => convertToSafeString(identifier));

			const editorComponents = allPageTypes
				.map(({ identifier, pageContentComponent }) => {
					return pageContentComponentFilter(
						pageContentComponent,
						convertToSafeString(identifier),
						DefaultPageTypeComponents
					);
				})
				.join('\n');

			const componentKeys = ComponentRegistry
				? Object.keys(ComponentRegistry).map((key) =>
						convertHyphensToUnderscores(key.toLowerCase())
					)
				: [];

			const components = ComponentRegistry
				? Object.entries(ComponentRegistry)
						.map(
							([key, value]) =>
								`export { default as ${convertHyphensToUnderscores(key)} } from '${astroConfigResolve(value)}';`
						)
						.join('\n')
				: '';

			const dashboardGridComponents = availableDashboardGridItems
				.map((item) => {
					const components: Record<string, string> = item.body?.components || {};

					const remappedComps = Object.entries(components).map(
						([key, value]) => `export { default as ${key} } from '${value}';`
					);

					return remappedComps.join('\n');
				})
				.join('\n');

			const dashboardPagesComponentsUser =
				availableDashboardPages.user
					?.map(({ pageBodyComponent, pageActionsComponent, ...item }) => {
						const components: Record<string, string> = {
							pageBodyComponent,
						};

						if (item.sidebar === 'double') {
							components.innerSidebarComponent = item.innerSidebarComponent;
						}

						if (pageActionsComponent) {
							components.pageActionsComponent = pageActionsComponent;
						}

						const remappedComps = Object.entries(components).map(
							([key, value]) =>
								`export { default as ${convertToSafeString(item.title + key)} } from '${value}';`
						);

						return remappedComps.join('\n');
					})
					.join('\n') || '';

			const dashboardPagesComponentsAdmin =
				availableDashboardPages.admin
					?.map(({ pageBodyComponent, pageActionsComponent, ...item }) => {
						const components: Record<string, string> = {
							pageBodyComponent,
						};

						if (item.sidebar === 'double') {
							components.innerSidebarComponent = item.innerSidebarComponent;
						}

						if (pageActionsComponent) {
							components.pageActionsComponent = pageActionsComponent;
						}

						const remappedComps = Object.entries(components).map(
							([key, value]) =>
								`export { default as ${convertToSafeString(item.title + key)} } from '${value}';`
						);

						return remappedComps.join('\n');
					})
					.join('\n') || '';

			addVirtualImports(params, {
				name,
				imports: {
					'virtual:studiocms/components/Editors': `
						export const editorKeys = ${JSON.stringify([...editorKeys])};
						${editorComponents}
					`,
					'studiocms:component-proxy': `
						export const componentKeys = ${JSON.stringify(componentKeys || [])};
						${components}
					`,
					'studiocms:components/dashboard-grid-components': `
						${dashboardGridComponents}
					`,
					'studiocms:components/dashboard-grid-items': `
						import * as components from 'studiocms:components/dashboard-grid-components';
						
						const currentComponents = ${JSON.stringify(availableDashboardGridItems)};
						
						const dashboardGridItems = currentComponents.map((item) => {
							const gridItem = { ...item };
						
							if (gridItem.body?.components) {
								gridItem.body.components = Object.entries(gridItem.body.components).reduce(
									(acc, [key, value]) => ({
										...acc,
										[key]: components[key],
									}),
									{}
								);
							}
						
							return gridItem;
						});
						
						export default dashboardGridItems;
					`,
					'studiocms:plugins/dashboard-pages/components/user': `
						${dashboardPagesComponentsUser}
					`,
					'studiocms:plugins/dashboard-pages/user': `
						import { convertToSafeString } from '${resolve('./utils/safeString.js')}';
						import * as components from 'studiocms:plugins/dashboard-pages/components/user';
						
						const currentComponents = ${JSON.stringify(availableDashboardPages.user || [])};
						
						const dashboardPages = currentComponents.map((item) => {
							const page = { 
								...item,
								components: {
									PageBodyComponent: components[convertToSafeString(item.title + 'pageBodyComponent')],
									PageActionsComponent: components[convertToSafeString(item.title + 'pageActionsComponent')] || null,
									InnerSidebarComponent: item.sidebar === 'double' ? components[convertToSafeString(item.title + 'innerSidebarComponent')] || null : null,
								},
							};
						
							return page;
						});
						
						export default dashboardPages;
					`,
					'studiocms:plugins/dashboard-pages/components/admin': `
						${dashboardPagesComponentsAdmin}
					`,
					'studiocms:plugins/dashboard-pages/admin': `
						import { convertToSafeString } from '${resolve('./utils/safeString.js')}';
						import * as components from 'studiocms:plugins/dashboard-pages/components/admin';
						
						const currentComponents = ${JSON.stringify(availableDashboardPages.admin || [])};
						
						const dashboardPages = currentComponents.map((item) => {
							const page = { 
								...item,
								components: {
									PageBodyComponent: components[convertToSafeString(item.title + 'pageBodyComponent')],
									PageActionsComponent: components[convertToSafeString(item.title + 'pageActionsComponent')] || null,
									InnerSidebarComponent: item.sidebar === 'double' ? components[convertToSafeString(item.title + 'innerSidebarComponent')] || null : null,
								},
							};
						
							return page;
						});
						
						export default dashboardPages;
					`,
					'virtual:studiocms/plugins/endpoints': `
						${pluginEndpoints.map(({ apiEndpoint }) => apiEndpoint).join('\n')}
					
						${pluginSettingsEndpoints.map(({ apiEndpoint }) => apiEndpoint).join('\n')}
					`,
					'studiocms:plugins/endpoints': `
						import * as endpoints from 'virtual:studiocms/plugins/endpoints';
					
						const pluginEndpoints = ${JSON.stringify(
							pluginEndpoints.map(({ identifier, safeIdentifier }) => ({
								identifier,
								safeIdentifier,
							})) || []
						)};
					
						const pluginSettingsEndpoints = ${JSON.stringify(pluginSettingsEndpoints.map(({ identifier, safeIdentifier }) => ({ identifier, safeIdentifier })) || [])};
					
						export const apiEndpoints = pluginEndpoints.map(({ identifier, safeIdentifier }) => ({
							identifier,
							onCreate: endpoints[safeIdentifier + '_onCreate'] || null,
							onEdit: endpoints[safeIdentifier + '_onEdit'] || null,
							onDelete: endpoints[safeIdentifier + '_onDelete'] || null,
						}));
					
						export const settingsEndpoints = pluginSettingsEndpoints.map(({ identifier, safeIdentifier }) => ({
							identifier,
							onSave: endpoints[safeIdentifier + '_onSave'] || null,
						}));
					`,
					'virtual:studiocms/plugins/renderers': `
						${pluginRenderers ? pluginRenderers.map(({ content }) => content).join('\n') : ''}
					`,
					'studiocms:plugins/renderers': `
						import * as renderers from 'virtual:studiocms/plugins/renderers';
						
						export const pluginRenderers = ${JSON.stringify(pluginRenderers.map(({ pageType, safePageType }) => ({ pageType, safePageType })) || [])};
					
						export { preRender as mdPreRender } from '${resolve('./components/renderers/markdown-prerender.js')}';
					`,
				},
			});
		}

		let pluginListLength = 0;
		let pluginListMessage = '';

		pluginListLength = safePluginList.length;
		pluginListMessage = safePluginList.map((p, i) => `${i + 1}. ${p.name}`).join('\n');

		const messageBox = boxen(pluginListMessage, {
			padding: 1,
			title: `Currently Installed StudioCMS Modules (${pluginListLength})`,
		});

		messages.push({
			label: 'studiocms:plugins',
			logLevel: 'info',
			message: ` \n \n${messageBox} \n \n`,
		});

		return {
			integrations,
			extraRoutes,
			safePluginList,
			messages
		};
	}
);
