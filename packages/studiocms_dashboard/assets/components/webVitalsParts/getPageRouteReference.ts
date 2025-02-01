import Config from 'virtual:studiocms/config';
import { externalNav, pluginList } from 'virtual:studiocms/pluginSystem';

const fixSlashes = (str: string) => str.replace(/^\/+|\/+$/g, '');

const {
	dashboardConfig: { dashboardRouteOverride },
} = Config;

const dashboardURL = dashboardRouteOverride ? fixSlashes(dashboardRouteOverride) : 'dashboard';

const ExternalNav = Array.from(externalNav);
const PluginList = Array.from(pluginList);

export const getPageRouteReference = (pageRoute: string) => {
	// Check if the route is the dashboard
	if (pageRoute.startsWith(`/${dashboardURL}`)) {
		return 'StudioCMS (Dashboard)';
	}

	// Check if the route is a plugin
	for (const entry of PluginList) {
		if (entry[0] !== 'studiocms') {
			const { name, label } = entry[1];

			for (const externalRoute of ExternalNav) {
				if (externalRoute[0].startsWith(name)) {
					if (pageRoute.startsWith(`/${fixSlashes(externalRoute[1].slug)}`)) {
						return label;
					}
				}
			}
		}
	}

	// Check if the route is from the setup
	if (pageRoute === '/start' || pageRoute === '/done') {
		return 'StudioCMS (Setup)';
	}

	return 'Frontend';
};
