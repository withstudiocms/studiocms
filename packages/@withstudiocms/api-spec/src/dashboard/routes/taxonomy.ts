import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { AstroLocalsMiddleware } from '../../astro-context.js';
import { DashboardAPIError } from '../errors.js';
import {
	successResponseSchema,
	TaxonomyDeletePayload,
	TaxonomyPostPayload,
	TaxonomySearchResponse,
} from '../schemas.js';

/**
 * Taxonomy Management Endpoint
 *
 * This endpoint allows for the management of taxonomy (tags and categories) within the StudioCMS dashboard.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const taxonomyPost = HttpApiEndpoint.post('taxonomy', '/taxonomy')
	.annotate(Title, 'Taxonomy Endpoint')
	.annotate(Summary, 'Endpoint for managing taxonomy in StudioCMS')
	.annotate(
		Description,
		'This endpoint allows for the management of taxonomy within the StudioCMS dashboard.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in/contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(TaxonomyPostPayload)
	.addSuccess(successResponseSchema)
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });

/**
 * Delete Taxonomy Entry Endpoint
 *
 * This endpoint allows for the deletion of a taxonomy entry (tag or category) within the StudioCMS dashboard.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const taxonomyDelete = HttpApiEndpoint.del('taxonomyDelete', '/taxonomy')
	.annotate(Title, 'Delete Taxonomy Entry')
	.annotate(Summary, 'Delete a taxonomy entry (tag or category) in StudioCMS')
	.annotate(
		Description,
		'This endpoint allows for the deletion of a taxonomy entry (tag or category) within the StudioCMS dashboard.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in/contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(TaxonomyDeletePayload)
	.addSuccess(successResponseSchema)
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });

/**
 * Taxonomy Search Endpoint
 *
 * This endpoint allows for searching taxonomy entries (tags or categories) within the StudioCMS dashboard.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const taxonomySearchGet = HttpApiEndpoint.get('taxonomySearch', '/taxonomy-search')
	.annotate(Title, 'Search Taxonomy Entries')
	.annotate(Summary, 'Search for taxonomy entries (tags or categories) in StudioCMS')
	.annotate(
		Description,
		'This endpoint allows for searching taxonomy entries (tags or categories) within the StudioCMS dashboard.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in/contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.addSuccess(TaxonomySearchResponse)
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });
