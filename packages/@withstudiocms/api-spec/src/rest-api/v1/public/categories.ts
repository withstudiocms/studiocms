import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { Schema } from 'effect';
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
export const CategoryIndexGet = HttpApiEndpoint.get('CategoryIndexGet', '/categories')
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
	.addSuccess(Schema.Void)
	.addError(RestAPIError, { status: 500 });

/**
 * GET /categories/{id}
 * Retrieves a category by its ID.
 */
export const CategoryByIdGet = HttpApiEndpoint.get('CategoryByIdGet', '/categories/:id')
	.setPath(IdParamNumber)
	.annotate(Title, 'Get Category by ID')
	.annotate(Summary, 'Retrieve Category by ID')
	.annotate(Description, 'Retrieves a category by its ID.')
	.addSuccess(PublicV1CategorySelect)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * OPTIONS /categories/{id}
 * Provides information about the /categories/{id} endpoint.
 */
export const CategoryByIdOptions = HttpApiEndpoint.options('CategoryByIdOptions', '/categories/:id')
	.setPath(IdParamNumber)
	.annotate(Title, 'Options for Category by ID')
	.annotate(Summary, 'Retrieve Category by ID')
	.annotate(Description, 'Provides information about the /categories/{id} endpoint.')
	.addSuccess(Schema.Void)
	.addError(RestAPIError, { status: 500 });
