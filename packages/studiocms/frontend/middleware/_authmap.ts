import { dashboardConfig } from 'studiocms:config';

type AuthenticatedRoute = {
	pathname: string;
	requiredPermissionLevel: 'owner' | 'admin' | 'editor' | 'visitor';
};

// Import the dashboard route override from the configuration
// If no override is set, it defaults to 'dashboard'
// This allows for flexibility in the dashboard route without hardcoding it
const dashboardRoute = dashboardConfig.dashboardRouteOverride || 'dashboard';

/**
 * List of authenticated routes with their required permission levels.
 * This list is used to determine if a user has the necessary permissions
 * to access specific dashboard routes.
 */
export const authenticatedRoutes: AuthenticatedRoute[] = [
	{
		pathname: `/${dashboardRoute}/system-management`,
		requiredPermissionLevel: 'owner',
	},
	{
		pathname: `/${dashboardRoute}/smtp-configuration`,
		requiredPermissionLevel: 'owner',
	},
	{
		pathname: `/${dashboardRoute}`,
		requiredPermissionLevel: 'editor',
	},
	{
		pathname: `/${dashboardRoute}/user-management`,
		requiredPermissionLevel: 'admin',
	},
	{
		pathname: `/${dashboardRoute}/user-management/**`,
		requiredPermissionLevel: 'admin',
	},
	{
		pathname: `/${dashboardRoute}/taxonomy`,
		requiredPermissionLevel: 'editor',
	},
	{
		pathname: `/${dashboardRoute}/taxonomy/categories`,
		requiredPermissionLevel: 'editor',
	},
	{
		pathname: `/${dashboardRoute}/taxonomy/tags`,
		requiredPermissionLevel: 'editor',
	},
	{
		pathname: `/${dashboardRoute}/plugins/**`,
		requiredPermissionLevel: 'editor',
	},
	{
		pathname: `/${dashboardRoute}/content-management`,
		requiredPermissionLevel: 'editor',
	},
	{
		pathname: `/${dashboardRoute}/content-management/**`,
		requiredPermissionLevel: 'editor',
	},
];
