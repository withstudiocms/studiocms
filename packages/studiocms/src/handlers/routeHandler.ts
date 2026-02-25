import { Effect } from '@withstudiocms/effect';
import type { AstroIntegrationMiddleware, InjectedRoute } from 'astro';
import { addVirtualImports, defineUtility } from 'astro-integration-kit';
import {
	getAstroProject,
	getRouteConfig,
	type RouteConfig,
	StudioCMSRouteConfig,
} from './frontend/routes.js';

/**
 * Utility that integrates StudioCMS routes into Astro's configuration during setup.
 *
 * This function is registered as an Astro config setup utility and, when invoked,
 * retrieves the configured routes from the StudioCMS route effect and injects
 * each route into Astro via the provided `injectRoute` callback.
 *
 * The implementation:
 * - Constructs a route effect using `getRoutes` and provides it with a live
 *   `StudioCMSRouteConfig` constructed from the passed `options`.
 * - Executes the effect to obtain the resolved routes.
 * - Calls `injectRoute` for each resolved route, allowing Astro to register them.
 *
 * @param params - The utility invocation parameters. Expected to include:
 *   - `injectRoute` (function): callback provided by Astro to register a route.
 * @param options - A `RouteConfig` used to configure the StudioCMS route effect.
 *
 * @returns A promise that resolves when all routes have been injected.
 *
 * @remarks
 * - This utility performs side effects (route injection) and may throw if the
 *   route effect fails or if `injectRoute` throws.
 * - Designed to run during Astro's config setup lifecycle.
 *
 * @example
 * // (Registered automatically via defineUtility('astro:config:setup'))
 */
export const routeHandler = defineUtility('astro:config:setup')(
	async (params, options: RouteConfig) => {
		const { injectRoute, addMiddleware } = params;

		// Helper function to inject a route using the provided `injectRoute` callback
		const _injectRoutes = (route: InjectedRoute) => Effect.sync(() => injectRoute(route));

		// Helper function to add middleware using the provided `addMiddleware` callback
		const _addMiddleware = (mw: AstroIntegrationMiddleware) => Effect.sync(() => addMiddleware(mw));

		// Create a shared configuration layer for the route effect
		const sharedConfig = StudioCMSRouteConfig.Live(options);

		// Execute both the route configuration retrieval and Astro project retrieval in parallel, then process the results
		await Effect.all([
			// Retrieve the processed route configuration and add it as a virtual import for use in other parts of the application
			getRouteConfig.pipe(
				Effect.map((config) => {
					// Add virtual imports for the route configuration, allowing it to be imported in other parts of the application
					addVirtualImports(params, {
						name: 'studiocms:routeHandler',
						imports: {
							'virtual:studiocms/route-config': `export const routeConfig = ${JSON.stringify(config)}; export default routeConfig;`,
						},
					});
				})
			),
			// Retrieve the Astro project configuration, which includes the routes and middleware to be injected, and process them by injecting routes and adding middleware
			getAstroProject.pipe(
				Effect.flatMap(({ middleware, routes }) =>
					Effect.all([
						Effect.forEach(routes, _injectRoutes),
						Effect.forEach(middleware, _addMiddleware),
					])
				)
			),
		]).pipe(Effect.provide(sharedConfig), Effect.runPromise);
	}
);
