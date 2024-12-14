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
		}
	) => {
		// Destructure Params
		const { injectRoute, logger } = params;

		// Destructure Options
		const {
			routes,
			// default404Route,
			options: { dbStartPage, verbose, defaultFrontEndConfig: config },
		} = options;

		let injectDefaultFrontEndRoutes = false;

		switch (typeof config) {
			case 'boolean':
				if (config === false) {
					return;
				}

				if (config === true) {
					injectDefaultFrontEndRoutes = true;
				}
				break;
			case 'object':
				injectDefaultFrontEndRoutes = config.injectDefaultFrontEndRoutes;
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
			integrationLogger(
				{ logger, logLevel: 'info', verbose },
				MakeFrontendStrings.DefaultRoutesInjected
			);
		}
	}
);
