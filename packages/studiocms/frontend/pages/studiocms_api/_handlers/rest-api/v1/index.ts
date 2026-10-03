import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSRestApiV1Spec } from '@withstudiocms/api-spec';
import { Layer } from 'effect';
import { RestApiPublicHandler } from './public.js';
import { RestApiSecureHandler } from './secure.js';

/**
 * Collection of REST API handlers for the new Effect HttpApi handlers. This collection currently includes both public and secure handlers for REST API v1, but can be expanded in the future to include additional versions or handler groups as needed.
 */
const RestAPILayers = Layer.merge(RestApiPublicHandler, RestApiSecureHandler);

/**
 * Live REST API V1 Handler Layer - Provides the REST API with all necessary dependencies for live operation.
 */
export const RestAPIV1Live = HttpApiBuilder.api(StudioCMSRestApiV1Spec).pipe(
	Layer.provide(RestAPILayers)
);
