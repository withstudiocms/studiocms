import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { AstroLocalsMiddleware } from '../../astro-context.js';
import { IntegrationsAPIError } from '../errors.js';
import {
	StorageManagerPostRequestPayloads,
	StorageManagerPostResponses,
	StorageManagerPutHeaders,
	StorageManagerPutPayload,
	StorageManagerPutSuccessResponse,
} from '../schemas.js';

/**
 * HTTP API endpoint for the Storage Manager POST operation.
 *
 * @remarks
 * This endpoint allows clients to perform POST requests to manage storage.
 *
 * @endpoint POST /storage/manager
 * @title Storage Manager POST Endpoint
 * @summary Endpoint to manage storage via POST requests.
 *
 * @returns A response object defined by the StorageManagerPostResponses schema.
 *
 * @throws {IntegrationsAPIError} Returns a 500 status code on server error
 */
export const storageManagerPost = HttpApiEndpoint.post('storage-manager', '/storage/manager')
	.annotate(Title, 'Storage Manager POST Endpoint')
	.annotate(Summary, 'Storage Manager POST Endpoint')
	.annotate(
		Description,
		'Endpoint to manage storage via POST requests.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in-contextlocals) and may require users to be logged into the current StudioCMS instance.\n\n## For more information\n- [Storage Manager API Documentation](https://docs.studiocms.dev/en/storage-api/api-endpoint/)'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(StorageManagerPostRequestPayloads)
	.addSuccess(StorageManagerPostResponses)
	.addError(IntegrationsAPIError, { status: 500 });

/**
 * HTTP API endpoint for the Storage Manager PUT operation.
 *
 * @remarks
 * This endpoint allows clients to perform PUT requests to manage storage.
 *
 * @endpoint PUT /storage/manager
 * @title Storage Manager PUT Endpoint
 * @summary Endpoint to manage storage via PUT requests.
 *
 * @returns A response object defined by the StorageManagerPutSuccessResponse schema.
 *
 * @throws {IntegrationsAPIError} Returns a 500 status code on server error
 */
export const storageManagerPut = HttpApiEndpoint.put('storage-manager-upload', '/storage/manager')
	.annotate(Title, 'Storage Manager PUT Endpoint')
	.annotate(Summary, 'Storage Manager PUT Endpoint')
	.annotate(
		Description,
		'Endpoint to Upload files via PUT requests.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in-contextlocals) and requires users to be logged into the current StudioCMS instance.\n\n## For more information\n- [Storage Manager API Documentation](https://docs.studiocms.dev/en/storage-api/api-endpoint/)'
	)
	.middleware(AstroLocalsMiddleware)
	.setHeaders(StorageManagerPutHeaders)
	.setPayload(StorageManagerPutPayload)
	.addSuccess(StorageManagerPutSuccessResponse)
	.addError(IntegrationsAPIError, { status: 500 });
