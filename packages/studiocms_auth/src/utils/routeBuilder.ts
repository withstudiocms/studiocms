import { integrationLogger } from '@matthiesenxyz/integration-utils/astroUtils';
import { removeLeadingTrailingSlashes } from '@studiocms/core/lib';
import { DashboardStrings } from '@studiocms/core/strings';
import { defineUtility } from 'astro-integration-kit';
import type { StudioCMSAuthOptions } from '../schema';

export const makeStudioCMSAuthAPIRoute = (route: string) => {
	return `studiocms_api/auth/${route}`;
};

export const makeDashboardRoute = (route: string, options: StudioCMSAuthOptions) => {
	// Get the dashboard route override from the options
	const {
		dashboardConfig: { dashboardRouteOverride },
	} = options;

	// Get the default dashboard route if the override is not set
	const defaultDashboardRoute = dashboardRouteOverride
		? removeLeadingTrailingSlashes(dashboardRouteOverride)
		: 'dashboard';

	return `${defaultDashboardRoute}/${route}`;
};

export const injectAuthAPIRoutes = defineUtility('astro:config:setup')(
	(
		params,
		opts: {
			options: StudioCMSAuthOptions;
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
				dashboardConfig: {
					dashboardEnabled,
					AuthConfig: { enabled: authEnabled },
					developerConfig: { testingAndDemoMode },
				},
			},
			routes,
		} = opts;

		// Check if the Dashboard is enabled
		if (dashboardEnabled) {
			// Log that the Dashboard is enabled
			integrationLogger({ logger, logLevel: 'info', verbose }, DashboardStrings.DashboardEnabled);
		} else {
			// Log that the Dashboard is disabled
			integrationLogger({ logger, logLevel: 'info', verbose }, DashboardStrings.DashboardDisabled);
		}

		if (!authEnabled) {
			// Log that the Auth is disabled
			integrationLogger({ logger, logLevel: 'info', verbose }, DashboardStrings.AuthDisabled);
			return;
		}

		// Log that the Auth is enabled
		integrationLogger({ logger, logLevel: 'info', verbose }, DashboardStrings.AuthEnabled);

		// If Testing and Demo Mode is enabled, log that it is enabled
		if (testingAndDemoMode) {
			integrationLogger({ logger, logLevel: 'info', verbose }, DashboardStrings.TestAndDemo);
		}

		// Inject the API routes
		for (const route of routes) {
			const { enabled, pattern, entrypoint } = route;

			if (!enabled) {
				continue;
			}

			injectRoute({
				pattern: makeStudioCMSAuthAPIRoute(pattern),
				entrypoint,
				prerender: false,
			});
		}
	}
);

export const injectAuthPageRoutes = defineUtility('astro:config:setup')(
	(
		params,
		opts: {
			options: StudioCMSAuthOptions;
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
				dashboardConfig: {
					dashboardEnabled,
					AuthConfig: { enabled: authEnabled },
					developerConfig: { testingAndDemoMode },
				},
			},
			options,
			routes,
		} = opts;

		// Check if the Dashboard is enabled
		if (dashboardEnabled) {
			// Log that the Dashboard is enabled
			integrationLogger({ logger, logLevel: 'info', verbose }, DashboardStrings.DashboardEnabled);
		} else {
			// Log that the Dashboard is disabled
			integrationLogger({ logger, logLevel: 'info', verbose }, DashboardStrings.DashboardDisabled);
		}

		if (!authEnabled) {
			// Log that the Auth is disabled
			integrationLogger({ logger, logLevel: 'info', verbose }, DashboardStrings.AuthDisabled);
			return;
		}

		// Log that the Auth is enabled
		integrationLogger({ logger, logLevel: 'info', verbose }, DashboardStrings.AuthEnabled);

		// If Testing and Demo Mode is enabled, log that it is enabled
		if (testingAndDemoMode) {
			integrationLogger({ logger, logLevel: 'info', verbose }, DashboardStrings.TestAndDemo);
		}

		// Inject the API routes
		for (const route of routes) {
			const { enabled, pattern, entrypoint } = route;

			if (!enabled) {
				continue;
			}

			injectRoute({
				pattern: makeDashboardRoute(pattern, options),
				entrypoint,
				prerender: false, // TODO: Change this to true once hybrid mode is ready
			});
		}
	}
);
