import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { AstroLocalsMiddleware } from '../../astro-context.js';
import { IntegrationsAPIError } from '../errors.js';
import {
	DbStudioQueryError,
	DbStudioQueryRequestPayload,
	DbStudioQueryResponsePayload,
} from '../schemas.js';

/**
 * Endpoint to handle database queries for DB Studio integration.
 */
export const DbStudioQueryPost = HttpApiEndpoint.post('db-studio-query', '/db-studio/query')
	.annotate(Title, 'DB Studio Query Endpoint')
	.annotate(Summary, 'DB Studio Query Endpoint')
	.annotate(
		Description,
		'Endpoint to handle database queries for DB Studio integration.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in-contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(DbStudioQueryRequestPayload)
	.addSuccess(DbStudioQueryResponsePayload)
	.addError(DbStudioQueryError, { status: 500 })
	.addError(IntegrationsAPIError, { status: 500 });
