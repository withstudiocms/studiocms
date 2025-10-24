import type { InjectedRoute } from 'astro';
import { Context, Effect, Layer } from '../effect.js';
import {
	dashboardAPIEnabledRoutes,
	dashboardEnabledRoutes,
	error404Route,
	middleware,
	noDbSetupRoutes,
	oAuthEnabledRoutes,
	restRoutes,
	setupRoutes,
	usernameAndPasswordAPIRoutes,
	userRegistrationEnabledRoutes,
} from './routes.js';
import type { InjectedRoutesWithMiddleware, ProcessedRouteConfig, RouteConfig } from './types.js';

/**
 * Effect Layer providing the StudioCMS route configuration.
 */
export class StudioCMSRouteConfig extends Context.Tag('StudioCMSRouteConfig')<
	StudioCMSRouteConfig,
	RouteConfig
>() {
	static Live = (config: RouteConfig) => Layer.succeed(this, config);
}

/**
 * Process and derive route settings from the main configuration.
 */
export const processedConfig = Effect.fn(
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
			userRegistrationEnabled: authEnabled && usernameAndPassword && allowUserRegistration,
			oAuthEnabled: authEnabled && oAuthProvidersConfigured,
		})
);

/**
 * Sets the `prerender` property to `false` for the given routes.
 *
 * @param items - An array of `InjectedRoute` objects.
 * @returns An array of `InjectedRoute` objects with `prerender` set to `false`.
 */
export const setPrerenderFalse = (items: InjectedRoute[] | InjectedRoute) => {
	const routes = Array.isArray(items) ? items : [items];
	return routes.map((item) => ({ ...item, prerender: false }));
};

/**
 * Map processed configuration to route groups.
 */
export const mapProcessedConfig = Effect.fn(
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
export const flatMapProcessedConfig = (config: Pick<RouteConfig, 'dashboardRoute'>) =>
	Effect.fn((processed: ProcessedRouteConfig) =>
		mapProcessedConfig({
			...processed,
			dashboardRoute: config.dashboardRoute,
		})
	);

/**
 * Map route groups to a flat array of routes.
 */
export const mapRouteGroups = Effect.fn(
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
 * Inject extra routes from the configuration.
 */
export const injectExtraRoutes = (config: Pick<RouteConfig, 'extraRoutes'>) =>
	Effect.fn((routes: InjectedRoute[]) =>
		Effect.succeed<InjectedRoute[]>([...routes, ...config.extraRoutes])
	);

/**
 * Inject middleware based on the configuration.
 */
export const injectMiddleware = ({ dbStartPage }: Pick<RouteConfig, 'dbStartPage'>) =>
	Effect.fn((routes: InjectedRoute[]) =>
		Effect.succeed<InjectedRoutesWithMiddleware>({
			routes,
			middleware: middleware(dbStartPage),
		})
	);
