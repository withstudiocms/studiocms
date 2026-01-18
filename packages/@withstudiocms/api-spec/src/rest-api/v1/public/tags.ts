import { HttpApiEndpoint } from '@effect/platform';
import { Description, Title } from '@effect/platform/OpenApi';
import { Schema } from 'effect';
import { RestAPIError } from '../../errors.js';
import {
	PublicV1TagsGetSearchParams,
	PublicV1TagsIdParam,
	PublicV1TagsSelect,
} from '../../schemas.js';

/**
 * GET /tags
 * Retrieves a list of tags.
 */
export const TagIndexGet = HttpApiEndpoint.get('tags', '/tags')
	.annotate(Title, 'Get Tags')
	.annotate(Description, 'Retrieves a list of tags, with optional filtering by name and parent ID.')
	.setUrlParams(PublicV1TagsGetSearchParams)
	.addSuccess(Schema.Array(PublicV1TagsSelect))
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * OPTIONS /tags
 * Provides information about the /tags endpoint.
 */
export const TagIndexOptions = HttpApiEndpoint.options('tags', '/tags')
	.annotate(Title, 'Options for Tags')
	.annotate(
		Description,
		'Provides information about the /tags endpoint, including allowed methods.'
	)
	.addSuccess(Schema.Void)
	.addError(RestAPIError, { status: 500 });

/**
 * GET /tags/{id}
 * Retrieves a tag by its ID.
 */
export const TagByIdGet = HttpApiEndpoint.get('tagsById', `/tags/${PublicV1TagsIdParam}`)
	.annotate(Title, 'Get Tag by ID')
	.annotate(Description, 'Retrieves a tag by its ID.')
	.addSuccess(PublicV1TagsSelect)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * OPTIONS /tags/{id}
 * Provides information about the /tags/{id} endpoint.
 */
export const TagByIdOptions = HttpApiEndpoint.options('tagsById', `/tags/${PublicV1TagsIdParam}`)
	.annotate(Title, 'Options for Tag by ID')
	.annotate(Description, 'Provides information about the /tags/{id} endpoint.')
	.addSuccess(Schema.Void)
	.addError(RestAPIError, { status: 500 });
