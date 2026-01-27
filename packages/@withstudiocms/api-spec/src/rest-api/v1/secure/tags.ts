import { HttpApiEndpoint } from '@effect/platform';
import { Description, Title } from '@effect/platform/OpenApi';
import { StudioCMSPageDataTags } from '@withstudiocms/sdk/tables';
import { Schema } from 'effect';
import { RestAPIError } from '../../errors.js';
import { RestAPIAuthorization } from '../../middleware.js';
import {
	DeletionSuccess,
	PartialTags,
	PublicV1TagsGetSearchParams,
	PublicV1TagsIdParam,
	PublicV1TagsSelect,
} from '../../schemas.js';

/**
 * GET /tags
 * Retrieves a list of tags.
 */
export const TagsIndexGet = HttpApiEndpoint.get('TagsIndexGet', '/tags')
	.annotate(Title, 'Get Tags')
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
export const TagsIndexPost = HttpApiEndpoint.post('TagsIndexPost', '/tags')
	.annotate(Title, 'Create Tag')
	.annotate(Description, 'Creates a new tag.')
	.setPayload(StudioCMSPageDataTags.Insert.omit('id'))
	.middleware(RestAPIAuthorization)
	.addSuccess(PublicV1TagsSelect)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 500 });

/**
 * OPTIONS /tags
 * Provides information about the /tags endpoint.
 */
export const TagsIndexOptions = HttpApiEndpoint.options('TagsIndexOptions', '/tags')
	.annotate(Title, 'Options for Tags')
	.annotate(
		Description,
		'Provides information about the /tags endpoint, including allowed methods.'
	)
	.middleware(RestAPIAuthorization)
	.addSuccess(Schema.Void)
	.addError(RestAPIError, { status: 500 });

/**
 * GET /tags/{id}
 * Retrieves a tag by its ID.
 */
export const TagsByIdGet = HttpApiEndpoint.get('TagsByIdGet', `/tags/${PublicV1TagsIdParam}`)
	.annotate(Title, 'Get Tag by ID')
	.annotate(Description, 'Retrieves a tag by its ID.')
	.middleware(RestAPIAuthorization)
	.addSuccess(PublicV1TagsSelect)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * PATCH /tags/{id}
 * Updates a tag by its ID.
 */
export const TagsByIdPatch = HttpApiEndpoint.patch('TagsByIdPatch', `/tags/${PublicV1TagsIdParam}`)
	.annotate(Title, 'Update Tag by ID')
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
export const TagsByIdDelete = HttpApiEndpoint.del('TagsByIdDelete', `/tags/${PublicV1TagsIdParam}`)
	.annotate(Title, 'Delete Tag by ID')
	.annotate(Description, 'Deletes a tag by its ID.')
	.middleware(RestAPIAuthorization)
	.addSuccess(DeletionSuccess)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * OPTIONS /tags/{id}
 * Provides information about the /tags/{id} endpoint.
 */
export const TagsByIdOptions = HttpApiEndpoint.options(
	'TagsByIdOptions',
	`/tags/${PublicV1TagsIdParam}`
)
	.annotate(Title, 'Options for Tag by ID')
	.annotate(Description, 'Provides information about the /tags/{id} endpoint.')
	.middleware(RestAPIAuthorization)
	.addSuccess(Schema.Void)
	.addError(RestAPIError, { status: 500 });
