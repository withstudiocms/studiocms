import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { Schema } from 'effect';
import { RestAPIError } from '../../errors';
import { RestAPIAuthorization } from '../../middleware.js';
import {
	DiffTrackingReturn,
	IdAndDiffIdParam,
	IdParamString,
	PublicV1GetPagesSelect,
	RestPageJsonData,
	SecureV1GetPagesSearchParams,
	SuccessResponse,
} from '../../schemas.js';

/**
 * GET /pages
 * Retrieves a list of pages.
 */
export const PagesIndexGet = HttpApiEndpoint.get('PagesIndexGet', '/pages')
	.annotate(Title, 'Get Pages')
	.annotate(Summary, 'Retrieve Pages')
	.annotate(
		Description,
		'Retrieves a list of pages, with optional filtering by title, slug, category ID, folder ID, draft status, and published status.'
	)
	.setUrlParams(SecureV1GetPagesSearchParams)
	.middleware(RestAPIAuthorization)
	.addSuccess(Schema.Array(PublicV1GetPagesSelect))
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * POST /pages
 * Creates a new page.
 */
export const PagesIndexPost = HttpApiEndpoint.post('PagesIndexPost', '/pages')
	.annotate(Title, 'Create Page')
	.annotate(Summary, 'Create Page')
	.annotate(Description, 'Creates a new page.')
	.setPayload(RestPageJsonData)
	.middleware(RestAPIAuthorization)
	.addSuccess(SuccessResponse)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 500 });

/**
 * OPTIONS /pages
 * Provides information about the /pages endpoint.
 */
export const PagesIndexOptions = HttpApiEndpoint.options('PagesIndexOptions', '/pages')
	.annotate(Title, 'Options for Pages')
	.annotate(Summary, 'Retrieve Pages')
	.annotate(
		Description,
		'Provides information about the /pages endpoint, including allowed methods.'
	)
	.middleware(RestAPIAuthorization)
	.addSuccess(Schema.Void)
	.addError(RestAPIError, { status: 500 });

/**
 * GET /pages/{id}
 * Retrieves a page by its ID.
 */
export const PagesByIdGet = HttpApiEndpoint.get('PagesByIdGet', '/pages/:id')
	.setPath(IdParamString)
	.annotate(Title, 'Get Page by ID')
	.annotate(Summary, 'Retrieve Page by ID')
	.annotate(Description, 'Retrieves a page by its ID.')
	.middleware(RestAPIAuthorization)
	.addSuccess(PublicV1GetPagesSelect)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * PATCH /pages/{id}
 * Updates a page by its ID.
 */
export const PagesByIdPatch = HttpApiEndpoint.patch('PagesByIdPatch', '/pages/:id')
	.setPath(IdParamString)
	.annotate(Title, 'Update Page by ID')
	.annotate(Summary, 'Update Page by ID')
	.annotate(Description, 'Updates a page by its ID.')
	.setPayload(RestPageJsonData)
	.middleware(RestAPIAuthorization)
	.addSuccess(SuccessResponse)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * DELETE /pages/{id}
 * Deletes a page by its ID.
 */
export const PagesByIdDelete = HttpApiEndpoint.del('PagesByIdDelete', '/pages/:id')
	.setPath(IdParamString)
	.annotate(Title, 'Delete Page by ID')
	.annotate(Summary, 'Delete Page by ID')
	.annotate(Description, 'Deletes a page by its ID.')
	.middleware(RestAPIAuthorization)
	.addSuccess(SuccessResponse)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * OPTIONS /pages/{id}
 * Provides information about the /pages/{id} endpoint.
 */
export const PagesByIdOptions = HttpApiEndpoint.options('PagesByIdOptions', '/pages/:id')
	.setPath(IdParamString)
	.annotate(Title, 'Options for Page by ID')
	.annotate(Summary, 'Retrieve Page by ID')
	.annotate(Description, 'Provides information about the /pages/{id} endpoint.')
	.middleware(RestAPIAuthorization)
	.addSuccess(Schema.Void)
	.addError(RestAPIError, { status: 500 });

/**
 * GET /pages/{id}/history
 * Retrieves the history of a page by its ID.
 */
export const PagesByIdHistoryGet = HttpApiEndpoint.get('PagesByIdHistoryGet', '/pages/:id/history')
	.setPath(IdParamString)
	.annotate(Title, 'Get Page History by ID')
	.annotate(Summary, 'Retrieve Page History by ID')
	.annotate(Description, 'Retrieves the history of a page by its ID.')
	.setUrlParams(
		Schema.Struct({
			limit: Schema.optional(Schema.NumberFromString),
		})
	)
	.middleware(RestAPIAuthorization)
	.addSuccess(Schema.Array(DiffTrackingReturn))
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * OPTIONS /pages/{id}/history
 * Provides information about the /pages/{id}/history endpoint.
 */
export const PagesByIdHistoryOptions = HttpApiEndpoint.options(
	'PagesByIdHistoryOptions',
	'/pages/:id/history'
)
	.setPath(IdParamString)
	.annotate(Title, 'Options for Page History by ID')
	.annotate(Summary, 'Retrieve Page History by ID')
	.annotate(Description, 'Provides information about the /pages/{id}/history endpoint.')
	.middleware(RestAPIAuthorization)
	.addSuccess(Schema.Void)
	.addError(RestAPIError, { status: 500 });

/**
 * GET /pages/{id}/history/{diffId}
 * Retrieves a specific history entry of a page by its Diff ID.
 */
export const PagesByIdHistoryByDiffIdGet = HttpApiEndpoint.get(
	'PagesByIdHistoryByDiffIdGet',
	'/pages/:id/history/:diffId'
)
	.setPath(IdAndDiffIdParam)
	.annotate(Title, 'Get Page History Entry by Diff ID')
	.annotate(Summary, 'Retrieve Page History Entry by Diff ID')
	.annotate(Description, 'Retrieves a specific history entry of a page by its Diff ID.')
	.middleware(RestAPIAuthorization)
	.addSuccess(DiffTrackingReturn)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * OPTIONS /pages/{id}/history/{diffId}
 * Provides information about the /pages/{id}/history/{diffId} endpoint.
 */
export const PagesByIdHistoryByDiffIdOptions = HttpApiEndpoint.options(
	'PagesByIdHistoryByDiffIdOptions',
	'/pages/:id/history/:diffId'
)
	.setPath(IdAndDiffIdParam)
	.annotate(Title, 'Options for Page History Entry by Diff ID')
	.annotate(Summary, 'Retrieve Page History Entry by Diff ID')
	.annotate(Description, 'Provides information about the /pages/{id}/history/{diffId} endpoint.')
	.middleware(RestAPIAuthorization)
	.addSuccess(Schema.Void)
	.addError(RestAPIError, { status: 500 });
