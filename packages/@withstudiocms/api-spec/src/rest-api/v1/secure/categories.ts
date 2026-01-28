import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { StudioCMSPageDataCategories } from '@withstudiocms/sdk/tables';
import { Schema } from 'effect';
import { RestAPIError } from '../../errors.js';
import { RestAPIAuthorization } from '../../middleware.js';
import {
	DeletionSuccess,
	PartialCategories,
	PublicV1CategoryGetSearchParams,
	PublicV1CategoryIdParam,
	PublicV1CategorySelect,
} from '../../schemas.js';

/**
 * GET /categories
 * Retrieves a list of categories.
 */
export const CategoryIndexGet = HttpApiEndpoint.get('CategoryIndexGet', '/categories')
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
export const CategoryIndexPost = HttpApiEndpoint.post('CategoryIndexPost', '/categories')
	.annotate(Title, 'Create Category')
	.annotate(Summary, 'Create Category')
	.annotate(Description, 'Creates a new category.')
	.setPayload(StudioCMSPageDataCategories.Insert.omit('id'))
	.middleware(RestAPIAuthorization)
	.addSuccess(PublicV1CategorySelect)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 500 });

/**
 * OPTIONS /categories
 * Provides information about the /categories endpoint.
 */
export const CategoryIndexOptions = HttpApiEndpoint.options('CategoryIndexOptions', '/categories')
	.annotate(Title, 'Options for Categories')
	.annotate(Summary, 'Retrieve Categories')
	.annotate(
		Description,
		'Provides information about the /categories endpoint, including allowed methods.'
	)
	.middleware(RestAPIAuthorization)
	.addSuccess(Schema.Void)
	.addError(RestAPIError, { status: 500 });

/**
 * GET /categories/{id}
 * Retrieves a category by its ID.
 */
export const CategoryByIdGet = HttpApiEndpoint.get(
	'CategoryByIdGet',
	`/categories/${PublicV1CategoryIdParam}`
)
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
export const CategoryByIdPatch = HttpApiEndpoint.patch(
	'CategoryByIdPatch',
	`/categories/${PublicV1CategoryIdParam}`
)
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
export const CategoryByIdDelete = HttpApiEndpoint.del(
	'CategoryByIdDelete',
	`/categories/${PublicV1CategoryIdParam}`
)
	.annotate(Title, 'Delete Category by ID')
	.annotate(Summary, 'Delete Category by ID')
	.annotate(Description, 'Deletes a category by its ID.')
	.middleware(RestAPIAuthorization)
	.addSuccess(DeletionSuccess)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * OPTIONS /categories/{id}
 * Provides information about the /categories/{id} endpoint.
 */
export const CategoryByIdOptions = HttpApiEndpoint.options(
	'CategoryByIdOptions',
	`/categories/${PublicV1CategoryIdParam}`
)
	.annotate(Title, 'Options for Category by ID')
	.annotate(Summary, 'Retrieve Category by ID')
	.annotate(Description, 'Provides information about the /categories/{id} endpoint.')
	.middleware(RestAPIAuthorization)
	.addSuccess(Schema.Void)
	.addError(RestAPIError, { status: 500 });
