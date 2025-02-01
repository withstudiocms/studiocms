// @ts-nocheck
import { dashboardConfig } from 'studiocms:config';
import { removeLeadingTrailingSlashes } from 'studiocms:lib';

const { dashboardRouteOverride } = dashboardConfig;

// Get the User set or Default dashboard URL
const dashboardURL = dashboardRouteOverride
	? removeLeadingTrailingSlashes(dashboardRouteOverride)
	: 'dashboard';

/**
 * Checks if a route is a dashboard route
 *
 * @param {string} pageRoute - The route to check if it is a dashboard route
 * @returns {boolean} - Returns true if the route is a dashboard route
 */
export const isDashboardRoute = (pageRoute: string): boolean => {
	return removeLeadingTrailingSlashes(pageRoute).includes(dashboardURL);
};
