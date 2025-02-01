import { makeAPIRoute } from '@studiocms/core/lib';
import { defineUtility } from 'astro-integration-kit';
import type { StudioCMSDashboardOptions } from '../schema.js';
import { integrationLogger } from './integrationLogger.js';

const apiRoute = makeAPIRoute('dashboard');

export const injectDashboardAPIRoutes = defineUtility('astro:config:setup')(
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
				dashboardConfig: { dashboardEnabled },
			},
			routes,
		} = opts;

		// Check if the Dashboard is enabled
		if (dashboardEnabled) {
			// Log that the Dashboard is enabled
			integrationLogger({ logger, logLevel: 'info', verbose }, 'Injecting Up API Routes...');
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
	}
);
