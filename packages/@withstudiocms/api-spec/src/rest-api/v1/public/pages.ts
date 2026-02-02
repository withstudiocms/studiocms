import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import * as Schema from 'effect/Schema';
import { RestAPIError } from '../../errors.js';
import {
	IdParamString,
	PublicV1GetPagesSearchParams,
	PublicV1GetPagesSelect,
} from '../../schemas.js';

/**
 * GET /pages
 * Retrieves a list of pages.
 */
export const PageIndexGet = HttpApiEndpoint.get('get-pages', '/pages')
	.annotate(Title, 'Get Pages')
	.annotate(Summary, 'Retrieve Pages')
	.annotate(
		Description,
		'Retrieves a list of pages, with optional filtering by title, slug, author, and parent folder.'
	)
	.setUrlParams(PublicV1GetPagesSearchParams)
	.addSuccess(Schema.Array(PublicV1GetPagesSelect))
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * GET /pages/{id}
 * Retrieves a page by its ID.
 */
export const PageByIdGet = HttpApiEndpoint.get('get-page', '/pages/:id')
	.setPath(IdParamString)
	.annotate(Title, 'Get Page by ID')
	.annotate(Summary, 'Retrieve Page by ID')
	.annotate(Description, 'Retrieves a page by its ID.')
	.addSuccess(PublicV1GetPagesSelect)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });
