import { HttpApiEndpoint } from '@effect/platform';
import { Description, Title } from '@effect/platform/OpenApi';
import { Schema } from 'effect';
import { RestAPIError } from '../../errors.js';
import {
	PublicV1GetPagesIdParam,
	PublicV1GetPagesSearchParams,
	PublicV1GetPagesSelect,
} from '../../schemas.js';

/**
 * GET /pages
 * Retrieves a list of pages.
 */
export const PageIndexGet = HttpApiEndpoint.get('PageIndexGet', '/pages')
	.annotate(Title, 'Get Pages')
	.annotate(
		Description,
		'Retrieves a list of pages, with optional filtering by title, slug, author, and parent folder.'
	)
	.setUrlParams(PublicV1GetPagesSearchParams)
	.addSuccess(Schema.Array(PublicV1GetPagesSelect))
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * OPTIONS /pages
 * Provides information about the /pages endpoint.
 */
export const PageIndexOptions = HttpApiEndpoint.options('PageIndexOptions', '/pages')
	.annotate(Title, 'Options for Pages')
	.annotate(
		Description,
		'Provides information about the /pages endpoint, including allowed methods.'
	)
	.addSuccess(Schema.Void)
	.addError(RestAPIError, { status: 500 });

/**
 * GET /pages/{id}
 * Retrieves a page by its ID.
 */
export const PageByIdGet = HttpApiEndpoint.get('PageByIdGet', `/pages/${PublicV1GetPagesIdParam}`)
	.annotate(Title, 'Get Page by ID')
	.annotate(Description, 'Retrieves a page by its ID.')
	.addSuccess(PublicV1GetPagesSelect)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * OPTIONS /pages/{id}
 * Provides information about the /pages/{id} endpoint.
 */
export const PageByIdOptions = HttpApiEndpoint.options(
	'PageByIdOptions',
	`/pages/${PublicV1GetPagesIdParam}`
)
	.annotate(Title, 'Options for Page by ID')
	.annotate(Description, 'Provides information about the /pages/{id} endpoint.')
	.addSuccess(Schema.Void)
	.addError(RestAPIError, { status: 500 });
