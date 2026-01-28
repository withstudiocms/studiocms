import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { StudioCMSPageFolderStructure } from '@withstudiocms/sdk/tables';
import { Schema } from 'effect';
import { RestAPIError } from '../../errors.js';
import { RestAPIAuthorization } from '../../middleware.js';
import {
	DeletionSuccess,
	FolderBase,
	PublicV1FolderGetSearchParams,
	PublicV1FolderIdParam,
	PublicV1FolderSelect,
} from '../../schemas.js';

/**
 * GET /folders
 * Retrieves a list of folders.
 */
export const FolderIndexGet = HttpApiEndpoint.get('FolderIndexGet', '/folders')
	.annotate(Title, 'Get Folders')
	.annotate(Summary, 'Retrieve Folders')
	.annotate(
		Description,
		'Retrieves a list of folders, with optional filtering by name and parent ID.'
	)
	.setUrlParams(PublicV1FolderGetSearchParams)
	.middleware(RestAPIAuthorization)
	.addSuccess(Schema.Array(PublicV1FolderSelect))
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * POST /folders
 * Creates a new folder.
 */
export const FolderIndexPost = HttpApiEndpoint.post('FolderIndexPost', '/folders')
	.annotate(Title, 'Create Folder')
	.annotate(Summary, 'Create Folder')
	.annotate(Description, 'Creates a new folder.')
	.setPayload(StudioCMSPageFolderStructure.Insert.omit('id'))
	.middleware(RestAPIAuthorization)
	.addSuccess(PublicV1FolderSelect)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 500 });

/**
 * OPTIONS /folders
 * Provides information about the /folders endpoint.
 */
export const FolderIndexOptions = HttpApiEndpoint.options('FolderIndexOptions', '/folders')
	.annotate(Title, 'Options for Folders')
	.annotate(Summary, 'Retrieve Folders')
	.annotate(
		Description,
		'Provides information about the /folders endpoint, including allowed methods.'
	)
	.middleware(RestAPIAuthorization)
	.addSuccess(Schema.Void)
	.addError(RestAPIError, { status: 500 });

/**
 * GET /folders/{id}
 * Retrieves a folder by its ID.
 */
export const FolderByIdGet = HttpApiEndpoint.get(
	'FolderByIdGet',
	`/folders/${PublicV1FolderIdParam}`
)
	.annotate(Title, 'Get Folder by ID')
	.annotate(Summary, 'Retrieve Folder by ID')
	.annotate(Description, 'Retrieves a folder by its ID.')
	.middleware(RestAPIAuthorization)
	.addSuccess(PublicV1FolderSelect)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * PATCH /folders/{id}
 * Updates a folder by its ID.
 */
export const FolderByIdPatch = HttpApiEndpoint.patch(
	'FolderByIdPatch',
	`/folders/${PublicV1FolderIdParam}`
)
	.annotate(Title, 'Update Folder by ID')
	.annotate(Summary, 'Update Folder by ID')
	.annotate(Description, 'Updates a folder by its ID.')
	.setPayload(FolderBase)
	.middleware(RestAPIAuthorization)
	.addSuccess(PublicV1FolderSelect)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * DELETE /folders/{id}
 * Deletes a folder by its ID.
 */
export const FolderByIdDelete = HttpApiEndpoint.del(
	'FolderByIdDelete',
	`/folders/${PublicV1FolderIdParam}`
)
	.annotate(Title, 'Delete Folder by ID')
	.annotate(Summary, 'Delete Folder by ID')
	.annotate(Description, 'Deletes a folder by its ID.')
	.middleware(RestAPIAuthorization)
	.addSuccess(DeletionSuccess)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * OPTIONS /folders/{id}
 * Provides information about the /folders/{id} endpoint.
 */
export const FolderByIdOptions = HttpApiEndpoint.options(
	'FolderByIdOptions',
	`/folders/${PublicV1FolderIdParam}`
)
	.annotate(Title, 'Options for Folder by ID')
	.annotate(Summary, 'Retrieve Folder by ID')
	.annotate(Description, 'Provides information about the /folders/{id} endpoint.')
	.middleware(RestAPIAuthorization)
	.addSuccess(Schema.Void)
	.addError(RestAPIError, { status: 500 });
