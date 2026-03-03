import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { Layer } from 'effect';
import { AstroLocalsAuthLive } from '../../_middleware/astroLocals.js';
import { ApiTokensHandler } from './apiTokens.js';
import { ConfigHandlers } from './config.js';

/**
 * Combined Dashboard API Handlers.
 */
export const DashboardAPIHandlers = Layer.mergeAll(ApiTokensHandler, ConfigHandlers).pipe(
	Layer.provide(AstroLocalsAuthLive)
);

/**
 * Live implementation of the Dashboard API Handlers.
 */
export const DashboardAPILive = HttpApiBuilder.api(StudioCMSDashboardApiSpec).pipe(
	Layer.provide(DashboardAPIHandlers)
);
