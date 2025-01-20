import { makeAPIRoute, removeLeadingTrailingSlashes } from '@studiocms/core/lib';
import { defineUtility } from 'astro-integration-kit';
import type { StudioCMSAuthOptions } from '../schema.js';
import { integrationLogger } from './integrationLogger.js';

const apiRoute = makeAPIRoute('auth');

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
					AuthConfig: { enabled: authEnabled },
					developerConfig: { testingAndDemoMode },
				},
			},
			routes,
		} = opts;

		if (!authEnabled) {
			// Log that the Auth is disabled
			integrationLogger(
				{ logger, logLevel: 'info', verbose },
				'Auth is Disabled by the User Configuration.  You will only be able to edit the database directly'
			);
			return;
		}

		// Log that the Auth is enabled
		integrationLogger(
			{ logger, logLevel: 'info', verbose },
			'Auth is Enabled, Setting Up API Routes...'
		);

		// If Testing and Demo Mode is enabled, log that it is enabled
		if (testingAndDemoMode) {
			integrationLogger(
				{ logger, logLevel: 'info', verbose },
				'Testing and Demo Mode is Enabled, Authentication will not be required to access dashboard pages.  But you will only be able to edit the database directly'
			);
		}

		// Inject the API routes
		for (const route of routes) {
			const { enabled, pattern, entrypoint } = route;

			if (!enabled) {
				continue;
			}

			injectRoute({
				pattern: apiRoute(pattern),
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
		},
		prerenderRoutes
	) => {
		const { injectRoute, logger } = params;

		const {
			options: {
				verbose,
				dashboardConfig: {
					AuthConfig: { enabled: authEnabled },
				},
			},
			options,
			routes,
		} = opts;

		if (!authEnabled) {
			// Log that the Auth is disabled
			integrationLogger(
				{ logger, logLevel: 'info', verbose },
				'Auth is Disabled by the User Configuration.  You will only be able to edit the database directly'
			);
			return;
		}

		// Log that the Auth is enabled
		integrationLogger(
			{ logger, logLevel: 'info', verbose },
			'Auth is Enabled, Setting Up Auth Page Routes...'
		);

		// Inject the page routes
		for (const route of routes) {
			const { enabled, pattern, entrypoint } = route;

			if (!enabled) {
				continue;
			}

			injectRoute({
				pattern: makeDashboardRoute(pattern, options),
				entrypoint,
				prerender: prerenderRoutes,
			});
		}
	}
);
