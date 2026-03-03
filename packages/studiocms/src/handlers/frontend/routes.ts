import { Effect } from '@withstudiocms/effect';
import type { AstroIntegrationMiddleware, InjectedRoute } from 'astro';
import {
	flatMapProcessedConfig,
	injectExtraRoutes,
	injectMiddleware,
	mapRouteGroups,
	processedConfig,
	remapEntrypoints,
	StudioCMSRouteConfig,
} from './utils.js';

export * from './types.js';
export * from './utils.js';

/*

	/// Route Definitions ///

	The following are the core route definitions for the StudioCMS
	Dashboard, API, and frontend pages.

	These are mappings for converting what looks like a standard Astro
	project structure into injected routes for Astro integrations.

	Each route definition includes the URL pattern and the corresponding
	entrypoint file within the StudioCMS package.

	These route definitions are conditionally included based on the
	configuration options provided to StudioCMS.

*/

/**
 * Setup routes for the StudioCMS setup process.
 *
 * These routes handle both the frontend setup pages and the backend
 * API endpoints required during the setup.
 *
 * Enabled when dbStartPage is true.
 */
export const setupRoutes: InjectedRoute[] = [
	// Frontend setup pages
	{
		pattern: '/',
		entrypoint: 'setup-pages/index.astro',
	},
	{
		pattern: '/start',
		entrypoint: 'setup-pages/1-start.astro',
	},
	{
		pattern: '/start/1',
		entrypoint: 'setup-pages/1-start.astro',
	},
	{
		pattern: '/start/2',
		entrypoint: 'setup-pages/2-next.astro',
	},
	{
		pattern: '/done',
		entrypoint: 'setup-pages/3-done.astro',
	},
	// Backend setup API routes
	{
		pattern: '/studiocms_api/dashboard/step-1',
		entrypoint: 'setup-pages/studiocms_api/dashboard/step-1.ts',
	},
	{
		pattern: '/studiocms_api/dashboard/step-2',
		entrypoint: 'setup-pages/studiocms_api/dashboard/step-2.ts',
	},
	// Renderer service routes
	{
		pattern: '/studiocms_api/partials/render',
		entrypoint: 'pages/studiocms_api/partials/render.astro',
	},
	// Integration routes
	{
		// This will also be joining the combined API route, but will also remain it's own dedicated route for the db setup stage.
		pattern: '/studiocms_api/integrations/[...all]',
		entrypoint: 'pages/studiocms_api/integrations/[...all].ts',
	},
];

/**
 * Routes to be injected when there is no database start page.
 *
 * These routes include SDK API endpoints and the renderer service.
 */
export const noDbSetupRoutes: InjectedRoute[] = [
	// Renderer service routes
	{
		pattern: '/studiocms_api/partials/render',
		entrypoint: 'pages/studiocms_api/partials/render.astro',
	},
	// Integration routes
	{
		pattern: '/studiocms_api/integrations/[...all]',
		entrypoint: 'pages/studiocms_api/integrations/[...all].ts',
	},
	// StudioCMS Primary API routes
	{
		pattern: '/studiocms_api/[...all]',
		entrypoint: 'pages/studiocms_api/[...all].ts',
	},
];

/**
 * User Registration Enabled Routes
 *
 * Injected when userRegistrationEnabled is true.
 */
export const userRegistrationEnabledRoutes = (
	dashboardRoute: (path: string) => string
): InjectedRoute[] => [
	{
		pattern: dashboardRoute('signup/'),
		entrypoint: 'pages/[dashboard]/signup.astro',
	},
];

/**
 * Dashboard Enabled Routes
 *
 * Injected when dashboardEnabled is true.
 */
export const dashboardEnabledRoutes = (
	dashboardRoute: (path: string) => string
): InjectedRoute[] => [
	{
		pattern: '/studiocms_api/partials/editor',
		entrypoint: 'pages/studiocms_api/partials/editor.astro',
	},
	{
		pattern: '/studiocms_api/partials/user-list-items',
		entrypoint: 'pages/studiocms_api/partials/user-list-items.astro',
	},

	// Dashboard Frontend Route
	...[
		{
			pattern: '/',
			entrypoint: 'pages/[dashboard]/index.astro',
		},
		{
			pattern: 'content-management',
			entrypoint: 'pages/[dashboard]/content-management/index.astro',
		},
		{
			pattern: 'content-management/create',
			entrypoint: 'pages/[dashboard]/content-management/createpage.astro',
		},
		{
			pattern: 'content-management/create-folder',
			entrypoint: 'pages/[dashboard]/content-management/createfolder.astro',
		},
		{
			pattern: 'content-management/edit',
			entrypoint: 'pages/[dashboard]/content-management/editpage.astro',
		},
		{
			pattern: 'content-management/edit-folder',
			entrypoint: 'pages/[dashboard]/content-management/editfolder.astro',
		},
		{
			pattern: 'content-management/diff',
			entrypoint: 'pages/[dashboard]/content-management/diff.astro',
		},
		{
			pattern: 'taxonomy',
			entrypoint: 'pages/[dashboard]/taxonomy/index.astro',
		},
		{
			pattern: 'taxonomy/categories',
			entrypoint: 'pages/[dashboard]/taxonomy/categories.astro',
		},
		{
			pattern: 'taxonomy/tags',
			entrypoint: 'pages/[dashboard]/taxonomy/tags.astro',
		},
		{
			pattern: 'profile',
			entrypoint: 'pages/[dashboard]/profile.astro',
		},
		{
			pattern: 'configuration',
			entrypoint: 'pages/[dashboard]/configuration.astro',
		},
		{
			pattern: 'user-management',
			entrypoint: 'pages/[dashboard]/user-management/index.astro',
		},
		{
			pattern: 'user-management/edit',
			entrypoint: 'pages/[dashboard]/user-management/edit.astro',
		},
		{
			pattern: 'plugins/[plugin]',
			entrypoint: 'pages/[dashboard]/plugins/[plugin].astro',
		},
		{
			pattern: 'smtp-configuration',
			entrypoint: 'pages/[dashboard]/smtp-configuration.astro',
		},
		{
			pattern: 'unverified-email',
			entrypoint: 'pages/[dashboard]/unverified-email.astro',
		},
		{
			pattern: 'login/',
			entrypoint: 'pages/[dashboard]/login.astro',
		},
		{
			pattern: 'logout/',
			entrypoint: 'pages/[dashboard]/logout.astro',
		},
		{
			pattern: 'system-management',
			entrypoint: 'pages/[dashboard]/system-management.astro',
		},
	].map(({ entrypoint, pattern }) => ({
		// Remap pattern to include dashboard base path
		pattern: dashboardRoute(pattern),
		entrypoint,
	})),
];

/**
 * Dashboard API Enabled Routes
 *
 * Injected when dashboardAPIEnabled is true.
 */
export const dashboardAPIEnabledRoutes = (
	dashboardRoute: (path: string) => string
): InjectedRoute[] => [
	// Dashboard page routes
	{
		pattern: dashboardRoute('password-reset'),
		entrypoint: 'pages/[dashboard]/password-reset.astro',
	},
];

/**
 * 404 Error Page Route
 *
 * Injected when shouldInject404Route is true.
 */
export const error404Route: InjectedRoute = {
	pattern: '/404',
	entrypoint: 'pages/404.astro',
};

/**
 * Resolves the file path for a given route.
 *
 * @param path - The relative path to be resolved.
 * @returns The full path string for the route.
 */
const resolvePath = (path: string) => `studiocms/frontend/${path}`;

/**
 * Generate middleware based on the database start page configuration.
 *
 * @param dbStartPage - Indicates if the database start page is enabled.
 * @returns An array of Astro integration middleware configurations.
 */
export const middleware = (dbStartPage: boolean): AstroIntegrationMiddleware[] => {
	// Generate middleware array
	const middlewares: AstroIntegrationMiddleware[] = [];

	// Add the error handler middleware
	middlewares.push({
		order: 'pre' as const,
		entrypoint: resolvePath('middleware/error-handler.ts'),
	});

	// Add the main middleware only if there is no database start page
	if (!dbStartPage) {
		// Add the StudioCMS main middleware
		middlewares.push({
			order: 'post' as const,
			entrypoint: resolvePath('middleware/index.ts'),
		});
	}

	// Return the configured middleware array
	return middlewares;
};

/*

	/// Primary Utility Export ///

	The following effect retrieves and constructs the full set of routes
	to be injected into the Astro integration based on the provided
	configuration options.

	@see `/src/handlers/routeHandler.ts` for the utility that uses this effect.

*/

/**
 * Effect to get the Astro project routes and middleware for StudioCMS.
 *
 * This effect processes the provided `RouteConfig` and derives the
 * appropriate routes and middleware to be injected into Astro.
 *
 * @returns An effect that resolves to an object containing the routes
 *          and middleware to be injected.
 */
export const getAstroProject = Effect.gen(function* () {
	// Get the StudioCMS route configuration
	const config = yield* StudioCMSRouteConfig;

	// Process the configuration
	return yield* processedConfig(config).pipe(
		// Map processed config to route groups
		Effect.flatMap(flatMapProcessedConfig(config)),
		// Map route groups to final routes
		Effect.flatMap(mapRouteGroups),
		// Remap entrypoints to resolved paths
		Effect.flatMap(remapEntrypoints(resolvePath)),
		// Inject extra routes from config
		Effect.flatMap(injectExtraRoutes(config)),
		// Inject middleware based on config
		Effect.flatMap(injectMiddleware(config))
	);
});

/**
 * Get route configuration for StudioCMS.
 */
export const getRouteConfig = StudioCMSRouteConfig.pipe(Effect.flatMap(processedConfig));
