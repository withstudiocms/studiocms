import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { StudioCMSPageDataTags } from '@withstudiocms/sdk/tables';
import * as Schema from 'effect/Schema';
import { RestAPIError } from '../../errors.js';
import { RestAPIAuthorization } from '../../middleware.js';
import {
	DeletionSuccess,
	IdParamNumber,
	PartialTags,
	PublicV1TagsGetSearchParams,
	PublicV1TagsSelect,
} from '../../schemas.js';

/**
 * GET /tags
 * Retrieves a list of tags.
 */
export const TagsIndexGet = HttpApiEndpoint.get('get-tags', '/tags')
	.annotate(Title, 'Get Tags')
	.annotate(Summary, 'Retrieve Tags')
	.annotate(Description, 'Retrieves a list of tags, with optional filtering by name and parent ID.')
	.setUrlParams(PublicV1TagsGetSearchParams)
	.middleware(RestAPIAuthorization)
	.addSuccess(Schema.Array(PublicV1TagsSelect))
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * POST /tags
 * Creates a new tag.
 */
export const TagsIndexPost = HttpApiEndpoint.post('create-tag', '/tags')
	.annotate(Title, 'Create Tag')
	.annotate(Summary, 'Create Tag')
	.annotate(Description, 'Creates a new tag.')
	.setPayload(StudioCMSPageDataTags.Insert.omit('id'))
	.middleware(RestAPIAuthorization)
	.addSuccess(PublicV1TagsSelect)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 500 });

/**
 * GET /tags/{id}
 * Retrieves a tag by its ID.
 */
export const TagsByIdGet = HttpApiEndpoint.get('get-tag', '/tags/:id')
	.setPath(IdParamNumber)
	.annotate(Title, 'Get Tag by ID')
	.annotate(Summary, 'Retrieve Tag by ID')
	.annotate(Description, 'Retrieves a tag by its ID.')
	.middleware(RestAPIAuthorization)
	.addSuccess(PublicV1TagsSelect)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * PATCH /tags/{id}
 * Updates a tag by its ID.
 */
export const TagsByIdPatch = HttpApiEndpoint.patch('update-tag', '/tags/:id')
	.setPath(IdParamNumber)
	.annotate(Title, 'Update Tag by ID')
	.annotate(Summary, 'Update Tag by ID')
	.annotate(Description, 'Updates a tag by its ID.')
	.setPayload(PartialTags)
	.middleware(RestAPIAuthorization)
	.addSuccess(PublicV1TagsSelect)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * DELETE /tags/{id}
 * Deletes a tag by its ID.
 */
export const TagsByIdDelete = HttpApiEndpoint.del('delete-tag', '/tags/:id')
	.setPath(IdParamNumber)
	.annotate(Title, 'Delete Tag by ID')
	.annotate(Summary, 'Delete Tag by ID')
	.annotate(Description, 'Deletes a tag by its ID.')
	.middleware(RestAPIAuthorization)
	.addSuccess(DeletionSuccess)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });
