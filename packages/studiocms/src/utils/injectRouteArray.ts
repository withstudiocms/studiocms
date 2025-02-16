import { defineUtility } from 'astro-integration-kit';
import { removeLeadingTrailingSlashes } from '../lib/index.js';
import type { StudioCMSConfig } from '../schemas/index.js';
import { integrationLogger } from './integrationLogger.js';

export const injectRouteArray = defineUtility('astro:config:setup')(
	(
		params,
		opts: {
			options: StudioCMSConfig;
			routes: {
				enabled: boolean;
				pattern: string;
				entrypoint: string;
				_non_dashboard?: boolean;
			}[];
		}
	) => {
		const { injectRoute } = params;

		const {
			options: {
				dashboardConfig: { dashboardRouteOverride },
			},
			routes,
		} = opts;

		const defaultDashboardRoute = dashboardRouteOverride
			? removeLeadingTrailingSlashes(dashboardRouteOverride)
			: 'dashboard';

		const makeDashboardRoute = (path: string) => {
			return `${defaultDashboardRoute}/${path}`;
		};

		for (const route of routes) {
			const { enabled, _non_dashboard, pattern, entrypoint } = route;

			if (enabled) {
				if (_non_dashboard) {
					injectRoute({
						pattern,
						entrypoint,
					});
				} else {
					injectRoute({
						pattern: makeDashboardRoute(pattern),
						entrypoint,
					});
				}
			}
		}
	}
);

export const injectDashboardRoute = defineUtility('astro:config:setup')(
	(
		params,
		opts: {
			options: StudioCMSConfig;
			routes: {
				enabled: boolean;
				pattern: string;
				entrypoint: string;
				prerender?: boolean;
			}[];
		},
		prerenderRoutes: boolean
	) => {
		const { injectRoute, logger } = params;

		const {
			options: {
				verbose,
				dashboardConfig: { dashboardRouteOverride, dashboardEnabled },
			},
			routes,
		} = opts;

		// Check if the Dashboard is enabled
		if (dashboardEnabled) {
			// Log that the Dashboard is enabled
			integrationLogger({ logger, logLevel: 'info', verbose }, 'Injecting Page Routes...');

			let defaultDashboardRoute = dashboardRouteOverride
				? removeLeadingTrailingSlashes(dashboardRouteOverride)
				: 'dashboard';

			if (defaultDashboardRoute === '/') {
				defaultDashboardRoute = '';
			}

			const makeDashboardRoute = (path: string) => {
				return `${defaultDashboardRoute}/${path}`;
			};

			for (const route of routes) {
				const { enabled, pattern, entrypoint, prerender = prerenderRoutes } = route;

				if (enabled) {
					injectRoute({
						pattern: makeDashboardRoute(pattern),
						entrypoint,
						prerender,
					});
				}
			}
		} else {
			// Log that the Dashboard is disabled
			integrationLogger(
				{ logger, logLevel: 'info', verbose },
				'Dashboard is Disabled, Some tools and Utilities are still available for developers who are customizing their setup!'
			);
		}
	}
);
