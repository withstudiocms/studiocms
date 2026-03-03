import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
// import { Layer } from 'effect';

/**
 * Combined Dashboard API Handlers.
 */
export const DashboardAPIHandlers = undefined; // Placeholder for actual handler implementation
// Layer.mergeAll();

/**
 * Live implementation of the Dashboard API Handlers.
 */
export const DashboardAPILive = HttpApiBuilder.api(StudioCMSDashboardApiSpec);
// .pipe(
// Layer.provide(DashboardAPIHandlers)
// );
