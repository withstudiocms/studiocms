import { pathWithBase } from './pathGenerators.js';
import { removeLeadingTrailingSlashes } from './removeLeadingTrailingSlashes.js';

/**
 * # urlGenFactory Helper Function
 *
 * Generate a URL based on the path and route type.
 *
 * @param isDashboardRoute
 * @param path
 * @param DashboardRouteOverride
 * @returns
 */
export default function urlGenFactory(
	isDashboardRoute: boolean,
	path: string | undefined,
	DashboardRouteOverride?: string
): string {
	let url: string;
	let dashboardRoute = 'dashboard';

	if (DashboardRouteOverride) {
		dashboardRoute = removeLeadingTrailingSlashes(DashboardRouteOverride);
	}

	if (path) {
		if (isDashboardRoute) {
			url = pathWithBase(`${dashboardRoute}/${path}`);
		} else {
			url = pathWithBase(path);
		}
	} else {
		if (isDashboardRoute) {
			url = pathWithBase(dashboardRoute);
		} else {
			url = '/';
		}
	}
	return url;
}
