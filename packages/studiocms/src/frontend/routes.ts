import type { InjectedRoute } from 'astro';
import { Context, Effect, Layer, pipe } from '../effect.js';

/**
 * Resolves the file path for a given route.
 *
 * @param path - The relative path to be resolved.
 * @returns The full path string for the route.
 */
const resolvePath = (path: string) => `studiocms/frontend/${path}`;

/**
 * Setup routes for the StudioCMS setup process.
 *
 * These routes handle both the frontend setup pages and the backend
 * API endpoints required during the setup.
 *
 * Enabled when dbStartPage is true.
 */
const setupRoutes: InjectedRoute[] = [
	// Frontend setup pages
	{
		pattern: '/',
		entrypoint: resolvePath('setup-pages/index.astro'),
	},
	{
		pattern: '/start',
		entrypoint: resolvePath('setup-pages/1-start.astro'),
	},
	{
		pattern: '/start/1',
		entrypoint: resolvePath('setup-pages/1-start.astro'),
	},
	{
		pattern: '/start/2',
		entrypoint: resolvePath('setup-pages/2-next.astro'),
	},
	{
		pattern: '/done',
		entrypoint: resolvePath('setup-pages/3-done.astro'),
	},
	// Backend setup API routes
	{
		pattern: '/studiocms_api/dashboard/step-1',
		entrypoint: resolvePath('setup-pages/studiocms_api/dashboard/step-1.ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/step-2',
		entrypoint: resolvePath('setup-pages/studiocms_api/dashboard/step-2.ts'),
	},
];

/**
 * Routes to be injected when there is no database start page.
 *
 * These routes include SDK API endpoints and the renderer service.
 */
const noDbSetupRoutes: InjectedRoute[] = [
	// SDK API routes
	{
		pattern: '/studiocms_api/sdk/list-pages',
		entrypoint: resolvePath('pages/studiocms_api/sdk/list-pages.ts'),
	},
	{
		pattern: '/studiocms_api/sdk/update-latest-version-cache',
		entrypoint: resolvePath('pages/studiocms_api/sdk/update-latest-version-cache.ts'),
	},
	{
		pattern: '/studiocms_api/sdk/fallback-list-pages.json',
		entrypoint: resolvePath('pages/studiocms_api/sdk/fallback-list-pages.json.ts'),
	},
	{
		pattern: '/studiocms_api/sdk/full-changelog.json',
		entrypoint: resolvePath('pages/studiocms_api/sdk/full-changelog.json.ts'),
	},
	// Renderer service route
	{
		pattern: '/studiocms_api/renderer/render',
		entrypoint: resolvePath('pages/studiocms_api/renderer/render.astro'),
	},
];

/**
 * REST API routes for StudioCMS.
 *
 * These routes cover folders, pages, settings, users, and public access.
 */
const restRoutes: InjectedRoute[] = [
	{
		pattern: '/studiocms_api/rest/v1/folders',
		entrypoint: resolvePath('pages/studiocms_api/rest/v1/folders/index.ts'),
	},
	{
		pattern: '/studiocms_api/rest/v1/folders/[id]',
		entrypoint: resolvePath('pages/studiocms_api/rest/v1/folders/[id].ts'),
	},
	{
		pattern: '/studiocms_api/rest/v1/pages',
		entrypoint: resolvePath('pages/studiocms_api/rest/v1/pages/index.ts'),
	},
	{
		pattern: '/studiocms_api/rest/v1/pages/[id]',
		entrypoint: resolvePath('pages/studiocms_api/rest/v1/pages/[id]/index.ts'),
	},
	{
		pattern: '/studiocms_api/rest/v1/pages/[id]/history',
		entrypoint: resolvePath('pages/studiocms_api/rest/v1/pages/[id]/history/index.ts'),
	},
	{
		pattern: '/studiocms_api/rest/v1/pages/[id]/history/[diffid]',
		entrypoint: resolvePath('pages/studiocms_api/rest/v1/pages/[id]/history/[diffid].ts'),
	},
	{
		pattern: '/studiocms_api/rest/v1/settings',
		entrypoint: resolvePath('pages/studiocms_api/rest/v1/settings/index.ts'),
	},
	{
		pattern: '/studiocms_api/rest/v1/users',
		entrypoint: resolvePath('pages/studiocms_api/rest/v1/users/index.ts'),
	},
	{
		pattern: '/studiocms_api/rest/v1/users/[id]',
		entrypoint: resolvePath('pages/studiocms_api/rest/v1/users/[id].ts'),
	},
	{
		pattern: '/studiocms_api/rest/v1/public/pages',
		entrypoint: resolvePath('pages/studiocms_api/rest/v1/public/pages/index.ts'),
	},
	{
		pattern: '/studiocms_api/rest/v1/public/pages/[id]',
		entrypoint: resolvePath('pages/studiocms_api/rest/v1/public/pages/[id].ts'),
	},
	{
		pattern: '/studiocms_api/rest/v1/public/folders',
		entrypoint: resolvePath('pages/studiocms_api/rest/v1/public/folders/index.ts'),
	},
];

/**
 * OAuth Enabled Routes
 *
 * Injected when oAuthEnabled is true.
 */
const oAuthEnabledRoutes: InjectedRoute[] = [
	{
		pattern: '/studiocms_api/auth/[provider]',
		entrypoint: resolvePath('pages/studiocms_api/auth/[provider]/index.ts'),
	},
	{
		pattern: '/studiocms_api/auth/[provider]/callback',
		entrypoint: resolvePath('pages/studiocms_api/auth/[provider]/callback.ts'),
	},
];

/**
 * Username and Password API Routes
 *
 * Injected when usernameAndPasswordAPI is true.
 */
const usernameAndPasswordAPIRoutes: InjectedRoute[] = [
	{
		pattern: '/studiocms_api/auth/login',
		entrypoint: resolvePath('pages/studiocms_api/auth/login.ts'),
	},
	{
		pattern: '/studiocms_api/auth/forgot-password',
		entrypoint: resolvePath('pages/studiocms_api/auth/forgot-password.ts'),
	},
];

/**
 * User Registration Enabled Routes
 *
 * Injected when userRegistrationEnabled is true.
 */
const userRegistrationEnabledRoutes = (
	dashboardRoute: (path: string) => string
): InjectedRoute[] => [
	{
		pattern: '/studiocms_api/auth/register',
		entrypoint: resolvePath('pages/studiocms_api/auth/register.ts'),
	},
	{
		pattern: dashboardRoute('signup/'),
		entrypoint: resolvePath('pages/[dashboard]/signup.astro'),
	},
];

/**
 * Dashboard Enabled Routes
 *
 * Injected when dashboardEnabled is true.
 */
const dashboardEnabledRoutes = (dashboardRoute: (path: string) => string): InjectedRoute[] => [
	// Dashboard API Routes
	{
		pattern: '/studiocms_api/dashboard/templates',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/templates.ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/live-render',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/partials/LiveRender.astro'),
	},
	{
		pattern: '/studiocms_api/dashboard/editor',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/partials/Editor.astro'),
	},
	{
		pattern: '/studiocms_api/dashboard/search-list',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/search-list.ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/user-list-items',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/partials/UserListItems.astro'),
	},
	{
		pattern: '/studiocms_api/auth/logout',
		entrypoint: resolvePath('pages/studiocms_api/auth/logout.ts'),
	},

	// Dashboard Frontend Route
	{
		pattern: dashboardRoute('/'),
		entrypoint: resolvePath('pages/[dashboard]/index.astro'),
	},
	{
		pattern: dashboardRoute('content-management'),
		entrypoint: resolvePath('pages/[dashboard]/content-management/index.astro'),
	},
	{
		pattern: dashboardRoute('content-management/create'),
		entrypoint: resolvePath('pages/[dashboard]/content-management/createpage.astro'),
	},
	{
		pattern: dashboardRoute('content-management/create-folder'),
		entrypoint: resolvePath('pages/[dashboard]/content-management/createfolder.astro'),
	},
	{
		pattern: dashboardRoute('content-management/edit'),
		entrypoint: resolvePath('pages/[dashboard]/content-management/editpage.astro'),
	},
	{
		pattern: dashboardRoute('content-management/edit-folder'),
		entrypoint: resolvePath('pages/[dashboard]/content-management/editfolder.astro'),
	},
	{
		pattern: dashboardRoute('content-management/diff'),
		entrypoint: resolvePath('pages/[dashboard]/content-management/diff.astro'),
	},
	{
		pattern: dashboardRoute('profile'),
		entrypoint: resolvePath('pages/[dashboard]/profile.astro'),
	},
	{
		pattern: dashboardRoute('configuration'),
		entrypoint: resolvePath('pages/[dashboard]/configuration.astro'),
	},
	{
		pattern: dashboardRoute('user-management'),
		entrypoint: resolvePath('pages/[dashboard]/user-management/index.astro'),
	},
	{
		pattern: dashboardRoute('user-management/edit'),
		entrypoint: resolvePath('pages/[dashboard]/user-management/edit.astro'),
	},
	{
		pattern: dashboardRoute('plugins/[plugin]'),
		entrypoint: resolvePath('pages/[dashboard]/plugins/[plugin].astro'),
	},
	{
		pattern: dashboardRoute('smtp-configuration'),
		entrypoint: resolvePath('pages/[dashboard]/smtp-configuration.astro'),
	},
	{
		pattern: dashboardRoute('unverified-email'),
		entrypoint: resolvePath('pages/[dashboard]/unverified-email.astro'),
	},
	{
		pattern: dashboardRoute('login/'),
		entrypoint: resolvePath('pages/[dashboard]/login.astro'),
	},
	{
		pattern: dashboardRoute('logout/'),
		entrypoint: resolvePath('pages/[dashboard]/logout.astro'),
	},
];

/**
 * Dashboard API Enabled Routes
 *
 * Injected when dashboardAPIEnabled is true.
 */
const dashboardAPIEnabledRoutes = (dashboardRoute: (path: string) => string): InjectedRoute[] => [
	// Dashboard page routes
	{
		pattern: dashboardRoute('password-reset'),
		entrypoint: resolvePath('pages/[dashboard]/password-reset.astro'),
	},

	// API Routes
	{
		pattern: '/studiocms_api/dashboard/config',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/config.ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/profile',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/profile.ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/users',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/users.ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/content/page',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/content/page.ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/content/folder',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/content/folder.ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/content/diff',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/content/diff.ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/create-reset-link',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/create-reset-link.ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/reset-password',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/reset-password.ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/plugins/[plugin]',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/plugins/[plugin].ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/create-user',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/create-user.ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/create-user-invite',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/create-user-invite.ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/api-tokens',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/api-tokens.ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/verify-session',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/verify-session.ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/mailer/config',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/mailer/config.ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/mailer/test-email',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/mailer/check-email.ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/verify-email',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/verify-email.ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/email-notification-settings-site',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/email-notification-settings-site.ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/resend-verify-email',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/resend-verify-email.ts'),
	},
	{
		pattern: '/studiocms_api/dashboard/update-user-notifications',
		entrypoint: resolvePath('pages/studiocms_api/dashboard/update-user-notifications.ts'),
	},
];

/**
 * 404 Error Page Route
 *
 * Injected when shouldInject404Route is true.
 */
const error404Route: InjectedRoute = {
	pattern: '/404',
	entrypoint: resolvePath('pages/404.astro'),
};

/**
 * Configuration interface for StudioCMS routes.
 */
export interface RouteConfig {
	dbStartPage: boolean;
	shouldInject404Route: boolean;
	dashboardEnabled: boolean;
	oAuthProvidersConfigured: boolean;
	extraRoutes: InjectedRoute[];
	developerConfig: {
		demoMode:
			| false
			| {
					username: string;
					password: string;
			  };
	};
	authConfig: {
		enabled: boolean;
		providers: {
			usernameAndPassword: boolean;
			usernameAndPasswordConfig: { allowUserRegistration: boolean };
		};
	};
	dashboardRoute: (path: string) => string;
}

/**
 * Effect Layer providing the StudioCMS route configuration.
 */
export class StudioCMSRouteConfig extends Context.Tag('StudioCMSRouteConfig')<
	StudioCMSRouteConfig,
	RouteConfig
>() {
	static Live = (config: RouteConfig) => Layer.succeed(this, config);
}

interface ProcessedRouteConfig {
	dbStartPage: boolean;
	shouldInject404Route: boolean;
	restAPIEnabled: boolean;
	dashboardEnabled: boolean;
	dashboardAPIEnabled: boolean;
	usernameAndPasswordAPI: boolean;
	userRegistrationEnabled: boolean;
	oAuthEnabled: boolean;
}

/**
 * Process and derive route settings from the main configuration.
 */
const processedConfig = Effect.fn(
	({
		dbStartPage,
		shouldInject404Route,
		dashboardEnabled,
		developerConfig,
		oAuthProvidersConfigured,
		authConfig: {
			enabled: authEnabled,
			providers: {
				usernameAndPassword,
				usernameAndPasswordConfig: { allowUserRegistration },
			},
		},
	}: RouteConfig) =>
		Effect.succeed<ProcessedRouteConfig>({
			dbStartPage: dbStartPage,
			shouldInject404Route: shouldInject404Route && !dbStartPage,
			restAPIEnabled: !dbStartPage && authEnabled && !developerConfig.demoMode,
			dashboardEnabled: dashboardEnabled && !dbStartPage,
			dashboardAPIEnabled: dashboardEnabled && !dbStartPage && authEnabled,
			usernameAndPasswordAPI: authEnabled && usernameAndPassword,
			userRegistrationEnabled: usernameAndPassword && allowUserRegistration,
			oAuthEnabled: authEnabled && oAuthProvidersConfigured,
		})
);

/**
 * Sets the `prerender` property to `false` for the given routes.
 *
 * @param items - An array of `InjectedRoute` objects.
 * @returns An array of `InjectedRoute` objects with `prerender` set to `false`.
 */
function setPrerenderFalse(items: InjectedRoute[] | InjectedRoute) {
	const routes = Array.isArray(items) ? items : [items];
	return routes.map((item) => ({ ...item, prerender: false }));
}

/**
 * Map processed configuration to route groups.
 */
const mapProcessedConfig = Effect.fn(
	({
		dashboardAPIEnabled,
		dashboardEnabled,
		dbStartPage,
		oAuthEnabled,
		restAPIEnabled,
		shouldInject404Route,
		userRegistrationEnabled,
		usernameAndPasswordAPI,
		dashboardRoute,
	}: ProcessedRouteConfig & { dashboardRoute: (path: string) => string }) =>
		Effect.succeed([
			{
				enabled: dbStartPage,
				routes: setPrerenderFalse(setupRoutes),
			},
			{
				enabled: !dbStartPage,
				routes: setPrerenderFalse(noDbSetupRoutes),
			},
			{
				enabled: shouldInject404Route,
				routes: setPrerenderFalse(error404Route),
			},
			{
				enabled: restAPIEnabled,
				routes: setPrerenderFalse(restRoutes),
			},
			{
				enabled: oAuthEnabled,
				routes: setPrerenderFalse(oAuthEnabledRoutes),
			},
			{
				enabled: usernameAndPasswordAPI,
				routes: setPrerenderFalse(usernameAndPasswordAPIRoutes),
			},
			{
				enabled: userRegistrationEnabled,
				routes: setPrerenderFalse(userRegistrationEnabledRoutes(dashboardRoute)),
			},
			{
				enabled: dashboardEnabled,
				routes: setPrerenderFalse(dashboardEnabledRoutes(dashboardRoute)),
			},
			{
				enabled: dashboardAPIEnabled,
				routes: setPrerenderFalse(dashboardAPIEnabledRoutes(dashboardRoute)),
			},
		])
);

/**
 * Flat map processed configuration to route groups.
 */
const flatMapProcessedConfig = (dashboardRoute: (path: string) => string) =>
	Effect.fn((processed: ProcessedRouteConfig) =>
		mapProcessedConfig({
			...processed,
			dashboardRoute,
		})
	);

/**
 * Map route groups to a flat array of routes.
 */
const mapRouteGroups = Effect.fn(
	(routeGroups: Array<{ enabled: boolean; routes: InjectedRoute[] }>) =>
		Effect.succeed(
			routeGroups.reduce<InjectedRoute[]>((acc, { enabled, routes }) => {
				if (enabled) {
					acc.push(...routes);
				}
				return acc;
			}, [])
		)
);

/**
 * Get the array of routes to be injected into the Astro integration.
 */
export const getRoutes = Effect.gen(function* () {
	// Get the StudioCMS route configuration
	const config = yield* StudioCMSRouteConfig;

	// Destructure necessary properties from the configuration
	const { dashboardRoute, extraRoutes = [] } = config;

	// Process the configuration and map to route groups
	const initialRoutes = yield* pipe(
		processedConfig(config),
		Effect.flatMap(flatMapProcessedConfig(dashboardRoute)),
		Effect.flatMap(mapRouteGroups)
	);

	// Append any extra routes from the configuration
	if (extraRoutes && extraRoutes.length > 0) {
		initialRoutes.push(...extraRoutes);
	}

	// Return the final array of routes
	return initialRoutes;
});
