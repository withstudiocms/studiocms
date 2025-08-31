import { pathWithBase, stripLeadingAndTrailingSlashes } from './pathGenerators.js';

/**
 * Creates a URL generator factory function with a default dashboard route.
 *
 * The returned `urlGenFactory` function generates URLs based on whether the route is a dashboard route,
 * an optional path, and an optional dashboard route override.
 *
 * @param defaultDashboardRoute - The default base route for dashboard URLs.
 * @returns A factory function that generates URLs based on the provided parameters.
 *
 * @example
 * const urlGen = createURLGenFactory('dashboard');
 * urlGen(true, 'settings'); // Returns '/dashboard/settings'
 * urlGen(false, 'about');   // Returns '/about'
 */
export function createURLGenFactory(defaultDashboardRoute: string) {
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
	return function urlGenFactory(
		isDashboardRoute: boolean,
		path: string | undefined,
		DashboardRouteOverride?: string
	): string {
		let url: string;
		let dashboardRoute = stripLeadingAndTrailingSlashes(defaultDashboardRoute);

		if (DashboardRouteOverride) {
			dashboardRoute = stripLeadingAndTrailingSlashes(DashboardRouteOverride);
		}

		if (path) {
			const cleanPath = stripLeadingAndTrailingSlashes(path);
			if (isDashboardRoute) {
				url = pathWithBase(`${dashboardRoute}/${cleanPath}`);
			} else {
				url = pathWithBase(cleanPath);
			}
		} else {
			if (isDashboardRoute) {
				url = pathWithBase(dashboardRoute);
			} else {
				url = pathWithBase('');
			}
		}
		return url;
	};
}
