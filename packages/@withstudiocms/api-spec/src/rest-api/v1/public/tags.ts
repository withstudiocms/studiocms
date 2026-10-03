import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import * as Schema from 'effect/Schema';
import { RestAPIError } from '../../errors.js';
import { IdParamNumber, PublicV1TagsGetSearchParams, PublicV1TagsSelect } from '../../schemas.js';

/**
 * GET /tags
 * Retrieves a list of tags.
 */
export const TagIndexGet = HttpApiEndpoint.get('getTags', '/tags')
	.annotate(Title, 'Get Tags')
	.annotate(Summary, 'Retrieve Tags')
	.annotate(Description, 'Retrieves a list of tags, with optional filtering by name and parent ID.')
	.setUrlParams(PublicV1TagsGetSearchParams)
	.addSuccess(Schema.Array(PublicV1TagsSelect))
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * GET /tags/{id}
 * Retrieves a tag by its ID.
 */
export const TagByIdGet = HttpApiEndpoint.get('getTag', '/tags/:id')
	.setPath(IdParamNumber)
	.annotate(Title, 'Get Tag by ID')
	.annotate(Summary, 'Retrieve Tag by ID')
	.annotate(Description, 'Retrieves a tag by its ID.')
	.addSuccess(PublicV1TagsSelect)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });
