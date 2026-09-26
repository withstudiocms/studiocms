import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSIntegrationsApiSpec } from '@withstudiocms/api-spec';
import { Layer } from 'effect';
import { DbStudioAPIHandler } from './dbStudio.js';
import { StorageManagerAPIHandler } from './storageManager.js';

/**
 * Combined Integrations API Handler.
 */
export const IntegrationsAPIHandler = Layer.merge(DbStudioAPIHandler, StorageManagerAPIHandler);

/**
 * Live implementation of the Integrations API Handler.
 */
export const IntegrationsAPILive = HttpApiBuilder.api(StudioCMSIntegrationsApiSpec).pipe(
	Layer.provide(IntegrationsAPIHandler)
);
