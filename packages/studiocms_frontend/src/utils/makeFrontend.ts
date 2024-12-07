import { integrationLogger } from '@matthiesenxyz/integration-utils/astroUtils';
import { MakeFrontendStrings } from '@studiocms/core/strings';
import { defineUtility } from 'astro-integration-kit';
import type { StudioCMSFrontEndOptions } from '../schema';

export const makeFrontend = defineUtility('astro:config:setup')(
	(
		params,
		options: {
			options: StudioCMSFrontEndOptions;
			routes: {
				pattern: string;
				entrypoint: string;
			}[];
			default404Route: string;
		}
	) => {
		// Destructure Params
		const { injectRoute, logger } = params;

		// Destructure Options
		const {
			routes,
			default404Route,
			options: { dbStartPage, verbose, defaultFrontEndConfig: config },
		} = options;

		let injectDefaultFrontEndRoutes = false;
		let inject404Route = false;

		switch (typeof config) {
			case 'boolean':
				if (config === false) {
					return;
				}

				if (config === true) {
					injectDefaultFrontEndRoutes = true;
					inject404Route = true;
				}
				break;
			case 'object':
				injectDefaultFrontEndRoutes = config.injectDefaultFrontEndRoutes;
				inject404Route = config.inject404Route;
				break;
		}

		// Check if DB Start Page is enabled
		if (dbStartPage) {
			integrationLogger(
				{ logger, logLevel: 'info', verbose },
				MakeFrontendStrings.DBStartPageEnabled
			);
			return;
		}

		integrationLogger({ logger, logLevel: 'info', verbose }, MakeFrontendStrings.NoDBStartPage);

		// Inject Default Frontend Routes if Enabled
		if (injectDefaultFrontEndRoutes) {
			integrationLogger(
				{ logger, logLevel: 'info', verbose },
				MakeFrontendStrings.InjectDefaultFrontendRoutes
			);
			for (const route of routes) {
				injectRoute({
					pattern: route.pattern,
					entrypoint: route.entrypoint,
				});
			}

			// Inject 404 Route
			if (inject404Route) {
				integrationLogger(
					{ logger, logLevel: 'info', verbose },
					MakeFrontendStrings.Inject404Route
				);
				injectRoute({
					pattern: '404',
					entrypoint: default404Route,
				});
			}
			integrationLogger(
				{ logger, logLevel: 'info', verbose },
				MakeFrontendStrings.DefaultRoutesInjected
			);
		}
	}
);
