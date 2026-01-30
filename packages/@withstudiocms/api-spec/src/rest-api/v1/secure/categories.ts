import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { StudioCMSPageDataCategories } from '@withstudiocms/sdk/tables';
import { Schema } from 'effect';
import { RestAPIError } from '../../errors.js';
import { RestAPIAuthorization } from '../../middleware.js';
import {
	DeletionSuccess,
	IdParamNumber,
	PartialCategories,
	PublicV1CategoryGetSearchParams,
	PublicV1CategorySelect,
} from '../../schemas.js';

/**
 * GET /categories
 * Retrieves a list of categories.
 */
export const CategoryIndexGet = HttpApiEndpoint.get('get-categories', '/categories')
	.annotate(Title, 'Get Categories')
	.annotate(Summary, 'Retrieve Categories')
	.annotate(
		Description,
		'Retrieves a list of categories, with optional filtering by name and parent ID.'
	)
	.setUrlParams(PublicV1CategoryGetSearchParams)
	.middleware(RestAPIAuthorization)
	.addSuccess(Schema.Array(PublicV1CategorySelect))
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * POST /categories
 * Creates a new category.
 */
export const CategoryIndexPost = HttpApiEndpoint.post('create-category', '/categories')
	.annotate(Title, 'Create Category')
	.annotate(Summary, 'Create Category')
	.annotate(Description, 'Creates a new category.')
	.setPayload(StudioCMSPageDataCategories.Insert.omit('id'))
	.middleware(RestAPIAuthorization)
	.addSuccess(PublicV1CategorySelect)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 500 });

/**
 * GET /categories/{id}
 * Retrieves a category by its ID.
 */
export const CategoryByIdGet = HttpApiEndpoint.get('get-category', '/categories/:id')
	.setPath(IdParamNumber)
	.annotate(Title, 'Get Category by ID')
	.annotate(Summary, 'Retrieve Category by ID')
	.annotate(Description, 'Retrieves a category by its ID.')
	.middleware(RestAPIAuthorization)
	.addSuccess(PublicV1CategorySelect)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * PATCH /categories/{id}
 * Updates a category by its ID.
 */
export const CategoryByIdPatch = HttpApiEndpoint.patch('update-category', '/categories/:id')
	.setPath(IdParamNumber)
	.annotate(Title, 'Update Category by ID')
	.annotate(Summary, 'Update Category by ID')
	.annotate(Description, 'Updates a category by its ID.')
	.setPayload(PartialCategories)
	.middleware(RestAPIAuthorization)
	.addSuccess(PublicV1CategorySelect)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * DELETE /categories/{id}
 * Deletes a category by its ID.
 */
export const CategoryByIdDelete = HttpApiEndpoint.del('delete-category', '/categories/:id')
	.setPath(IdParamNumber)
	.annotate(Title, 'Delete Category by ID')
	.annotate(Summary, 'Delete Category by ID')
	.annotate(Description, 'Deletes a category by its ID.')
	.middleware(RestAPIAuthorization)
	.addSuccess(DeletionSuccess)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });
