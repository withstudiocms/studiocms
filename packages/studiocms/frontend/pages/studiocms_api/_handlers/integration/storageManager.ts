import APIServiceModule from 'studiocms:storage-manager/module';
import { HttpApiBuilder, type HttpServerResponse } from '@effect/platform';
import type { HttpBodyError } from '@effect/platform/HttpBody';
import { StudioCMSIntegrationsApiSpec } from '@withstudiocms/api-spec';
import { AstroAPIContext } from '@withstudiocms/api-spec/astro-context';
import { IntegrationsAPIError } from '@withstudiocms/api-spec/integrations';
import type { APIContext } from 'astro';
import { Effect, Layer } from 'effect';
import type { StorageAPIEndpointFn } from '#storage-api';
import APICore from '#storage-manager/core/api-core';
import UrlMappingDatabase from '#storage-manager/core/database';
import EffectifyAstroContextDriver from '#storage-manager/core/effectify-astro-context';
import UrlMappingService from '#storage-manager/core/url-mapping';
import { AstroLocalsAuthLive } from '../../_middleware/astroLocals.js';

// Singleton instance of the API core
let apiCore: APICore<
	APIContext,
	Effect.Effect<HttpServerResponse.HttpServerResponse, HttpBodyError>
>;

/**
 * Retrieves the singleton instance of the APICore.
 *
 * This function initializes the APICore instance if it hasn't been created yet,
 * setting up the necessary context driver, URL mapping service, and API service module.
 *
 * @returns The singleton APICore instance.
 */
function getAPICore() {
	if (apiCore) {
		return apiCore;
	}

	// Instantiate the Effectify Astro context driver
	const effectifyAstroContextDriver = new EffectifyAstroContextDriver();

	// Instantiate the database
	const database = new UrlMappingDatabase();

	// Instantiate the URL mapping service
	const urlMappingService = new UrlMappingService(database);

	// Instantiate the API service module
	const apiService = new APIServiceModule(effectifyAstroContextDriver, urlMappingService);

	// Instantiate the API core
	apiCore = new APICore({
		driver: effectifyAstroContextDriver,
		urlMappingService: urlMappingService,
		storageDriver: apiService,
	});

	return apiCore;
}

/**
 * Helper function to create storage manager handlers with consistent error handling.
 *
 * This function takes a StorageAPIEndpointFn and returns a handler function that processes the request
 * using the APICore instance. It includes error handling to catch and transform errors into a consistent format.
 *
 * @param _try - The StorageAPIEndpointFn to execute for the request.
 * @returns A function that handles the API request and returns an Effect with the response or error.
 */
const makeStorageManagerHandler = (
	_try: StorageAPIEndpointFn<
		APIContext,
		Effect.Effect<HttpServerResponse.HttpServerResponse, HttpBodyError, never>
	>
) =>
	AstroAPIContext.pipe(
		Effect.flatMap((ctx) =>
			Effect.tryPromise({
				try: () => _try(ctx),
				catch: (error) =>
					new IntegrationsAPIError({
						error: `Failed to handle storage manager request: ${error instanceof Error ? error.message : String(error)}`,
					}),
			})
		),
		Effect.flatten,
		Effect.catchTag(
			'HttpBodyError',
			() =>
				new IntegrationsAPIError({
					error: 'Failed to parse request body',
				})
		)
	);

/**
 * Storage Manager API Handler.
 *
 * This handler manages the API routes for storage management, including database queries and storage operations.
 * It uses the APICore to handle storage-related requests and includes error handling for various failure scenarios.
 */
export const StorageManagerAPIHandler = HttpApiBuilder.group(
	StudioCMSIntegrationsApiSpec,
	'storageManager',
	(handlers) =>
		handlers
			.handleRaw('storageManager', () => makeStorageManagerHandler(getAPICore().getPOST('locals')))
			.handleRaw('storageManagerUpload', () =>
				makeStorageManagerHandler(getAPICore().getPUT('locals'))
			)
).pipe(Layer.provide(AstroLocalsAuthLive));
