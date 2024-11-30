import { removeLeadingTrailingSlashes } from '../lib/removeLeadingTrailingSlashes';
import { pathWithBase } from './pathGenerators';

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
			url = import.meta.env.BASE_URL;
		}
	}
	return url;
}
