import { developerConfig } from 'studiocms:config';
import APIServiceModule from 'studiocms:storage-manager/module';
import { HttpApiBuilder, type HttpServerResponse } from '@effect/platform';
import { Unauthorized } from '@effect/platform/HttpApiError';
import type { HttpBodyError } from '@effect/platform/HttpBody';
import { StudioCMSIntegrationsApiSpec } from '@withstudiocms/api-spec';
import { CurrentUser } from '@withstudiocms/api-spec/astro-context';
import { DbStudioQueryError, IntegrationsAPIError } from '@withstudiocms/api-spec/integrations';
// import { CMSLogger } from '@withstudiocms/effect';
import type { APIContext } from 'astro';
import { Effect, Layer } from 'effect';
import { AstroAPIContext } from 'effectify/astro/context';
import type { StorageAPIEndpointFn } from '#storage-api';
import APICore from '#storage-manager/core/api-core';
import UrlMappingDatabase from '#storage-manager/core/database';
import EffectifyAstroContextDriver from '#storage-manager/core/effectify-astro-context';
import UrlMappingService from '#storage-manager/core/url-mapping';
import { AstroLocalsAuthLive } from '../_middleware/astroLocals.js';
import { getDriverInstance } from './_utils/db-studio-driver.js';

// import { parseLogLevel } from './_utils/parseLogLevel.js';

/**
 * Custom error class used for quick escaping from deep error handling in the Effect chain.
 */
class QuickEscapeError {
	readonly _tag = 'QuickEscapeError';
	constructor(public data: typeof DbStudioQueryError.Type) {}
}

/**
 * DB Studio API Handler.
 *
 * This handler manages the API routes for the DB Studio, including database queries and storage management.
 */
export const DbStudioAPIHandler = HttpApiBuilder.group(
	StudioCMSIntegrationsApiSpec,
	'dbStudio',
	(handlers) =>
		handlers.handle(
			'dbStudioQuery',
			Effect.fn(function* ({ payload }) {
				const isDev = import.meta.env.DEV;

				// const logLevel = parseLogLevel(config.logLevel);

				// const log = new CMSLogger({ level: logLevel }, 'studiocms:database/studio');

				// Check if demo mode is enabled
				if (developerConfig.demoMode !== false) {
					return yield* new Unauthorized();
				}

				const currentUser = yield* CurrentUser;

				// Security check: only allow access in the following cases
				// 1. In development mode
				// 2. In production, only if the user is an owner
				if (!isDev && currentUser.permissionLevel !== 'owner') {
					return yield* new Unauthorized();
				}

				// Get the database driver instance
				const driver = yield* getDriverInstance().pipe(
					Effect.catchTag(
						'DriverError',
						(error) =>
							new IntegrationsAPIError({
								error: `Failed to get database driver: ${error.message}`,
							})
					)
				);

				// log.debug(`Received ${payload.type} request`);

				return yield* Effect.tryPromise({
					try: async () => {
						if (payload.type === 'query') {
							const r = await driver.query(payload.statement);
							return {
								type: payload.type,
								id: payload.id,
								data: r,
							};
						}
						const r = await driver.batch(payload.statements as string[]);
						// log.debug(`${payload.type} executed with ${r.length} results`);
						return {
							type: payload.type,
							id: payload.id,
							data: r,
						};
					},
					catch: (cause) =>
						new QuickEscapeError(
							DbStudioQueryError.make({
								id: payload.id,
								type: payload.type,
								error: cause instanceof Error ? cause.message : String(cause),
							})
						),
				}).pipe(Effect.catchTag('QuickEscapeError', ({ data }) => Effect.succeed(data)));
			})
		)
).pipe(Layer.provide(AstroLocalsAuthLive));

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
