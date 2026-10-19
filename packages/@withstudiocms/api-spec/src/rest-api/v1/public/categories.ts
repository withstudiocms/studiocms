import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import * as Schema from 'effect/Schema';
import { RestAPIError } from '../../errors.js';
import {
	IdParamNumber,
	PublicV1CategoryGetSearchParams,
	PublicV1CategorySelect,
} from '../../schemas.js';

/**
 * GET /categories
 * Retrieves a list of categories.
 */
export const CategoryIndexGet = HttpApiEndpoint.get('getCategories', '/categories')
	.annotate(Title, 'Get Categories')
	.annotate(Summary, 'Retrieve Categories')
	.annotate(
		Description,
		'Retrieves a list of categories, with optional filtering by name and parent ID.'
	)
	.setUrlParams(PublicV1CategoryGetSearchParams)
	.addSuccess(Schema.Array(PublicV1CategorySelect))
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * GET /categories/{id}
 * Retrieves a category by its ID.
 */
export const CategoryByIdGet = HttpApiEndpoint.get('getCategory', '/categories/:id')
	.setPath(IdParamNumber)
	.annotate(Title, 'Get Category by ID')
	.annotate(Summary, 'Retrieve Category by ID')
	.annotate(Description, 'Retrieves a category by its ID.')
	.addSuccess(PublicV1CategorySelect)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });
