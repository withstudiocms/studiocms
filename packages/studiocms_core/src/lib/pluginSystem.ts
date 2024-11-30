import type { SideBarLink, StudioCMSPluginOptions } from '../types';
import { convertDashboardLinksType } from './convertDashboardLinksType';

/**
 * # Define StudioCMS Plugin
 *
 * Register a StudioCMS Plugin with the StudioCMS Core.
 *
 * @param options.pkgname {string} - The Package Name of the Plugin
 * @param options.opts.pluginLabel {string} - The Label for the Plugin
 * @param options.opts.navigationLinks Array<{ text: string, slug: string }> - The Navigation Links for the Plugin
 * @param options.opts.customRendererPluginPath { string } - The Custom Renderer Plugin Path - This is used to replace the built-in Markdown Renderer. Recommended for Advanced Users.
 * @deprecated This function has been deprecated in favor of the `definePlugin` function.
 */
export function defineStudioCMSPlugin(options: StudioCMSPluginOptions) {
	// Extract the options
	const { pkgname, opts } = options;
	const { pluginLabel, navigationLinks, customRendererPluginPath, dashboardPageLinks } = opts;

	// Add the plugin to the StudioCMS Plugin List
	studioCMSPluginList.set(pkgname, { name: pkgname, label: pluginLabel });

	// Add the navigation links to the External Navigation Map
	if (navigationLinks) {
		for (const link of navigationLinks) {
			externalNavigation.set(`${pkgname}:${link.slug}`, { text: link.text, slug: link.slug });
		}
	}

	// Add the custom Dashboard pages to the Dashboard Page Links
	if (dashboardPageLinks) {
		// Convert the Dashboard Page Links to the SideBarLink type
		const DashboardPluginLinkList = convertDashboardLinksType(
			dashboardPageLinks,
			pkgname,
			pluginLabel
		);

		// Add the Dashboard Page Links to the Dashboard Page Links Map
		dashboardPageLinksMap.set(pkgname, DashboardPluginLinkList);
	}

	// Add the custom renderer plugin path to the Custom Renderer Plugin Set
	if (customRendererPluginPath) {
		customRendererPlugin.add(customRendererPluginPath);
	}
}

/**
 * # StudioCMSPluginList
 *
 * A Map of StudioCMS Plugins used to register with the StudioCMS Core.
 */
export const studioCMSPluginList = new Map<string, { name: string; label: string }>();

/**
 * # External Navigation
 *
 * A Map of External Navigation Links used to register with the StudioCMS Core for usage on the Front-end Navigation bar.
 */
export const externalNavigation = new Map<string, { text: string; slug: string }>();

/**
 * # Dashboard Page Links Map
 *
 * A map of dashboard page links used to register with the StudioCMS Core for usage on the dashboard sidebar for displaying custom plugin pages.
 */
export const dashboardPageLinksMap = new Map<string, SideBarLink[]>();

/**
 * # Custom Renderer Plugin
 *
 * A Set of Custom Renderer Plugins used to register with the StudioCMS Core to replace the built in Markdown renderer.
 *
 * Note: This may require additional setup and configuration to work properly.
 * ## Deprecated This feature has been moved to the StudioCMS Renderer Configuration.
 */
export const customRendererPlugin = new Set<string>();
