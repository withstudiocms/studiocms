import { integrationLogger } from '@matthiesenxyz/integration-utils/astroUtils';
import { removeLeadingTrailingSlashes } from '@studiocms/core/lib';
import { defineUtility } from 'astro-integration-kit';
import type { StudioCMSDashboardOptions } from '../schema';

export const injectRouteArray = defineUtility('astro:config:setup')(
	(
		params,
		opts: {
			options: StudioCMSDashboardOptions;
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
			options: StudioCMSDashboardOptions;
			routes: {
				enabled: boolean;
				pattern: string;
				entrypoint: string;
			}[];
		}
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

			const defaultDashboardRoute = dashboardRouteOverride
				? removeLeadingTrailingSlashes(dashboardRouteOverride)
				: 'dashboard';

			const makeDashboardRoute = (path: string) => {
				return `${defaultDashboardRoute}/${path}`;
			};

			for (const route of routes) {
				const { enabled, pattern, entrypoint } = route;

				if (enabled) {
					injectRoute({
						pattern: makeDashboardRoute(pattern),
						entrypoint,
						prerender: true,
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
