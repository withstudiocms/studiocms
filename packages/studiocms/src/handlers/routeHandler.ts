import { Effect, runEffect } from '@withstudiocms/effect';
import { defineUtility } from 'astro-integration-kit';
import { getRoutes, type RouteConfig, StudioCMSRouteConfig } from '../frontend/routes.js';

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
		const { injectRoute } = params;

		const routeEffect = getRoutes.pipe(Effect.provide(StudioCMSRouteConfig.Live(options)));

		const routes = await runEffect(routeEffect);

		for (const route of routes) {
			injectRoute(route);
		}
	}
);
