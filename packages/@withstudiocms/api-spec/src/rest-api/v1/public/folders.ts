import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { Schema } from 'effect';
import { RestAPIError } from '../../errors.js';
import {
	PublicV1FolderGetSearchParams,
	PublicV1FolderIdParam,
	PublicV1FolderSelect,
} from '../../schemas.js';

/**
 * GET /folders
 * Search parameters for filtering folders.
 */
export const FoldersIndexGet = HttpApiEndpoint.get('FoldersIndexGet', '/folders')
	.annotate(Title, 'Get Folders')
	.annotate(Summary, 'Retrieve Folders')
	.annotate(
		Description,
		'Retrieves a list of folders, with optional filtering by name and parent ID.'
	)
	.setUrlParams(PublicV1FolderGetSearchParams)
	.addSuccess(Schema.Array(PublicV1FolderSelect))
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * OPTIONS /folders
 * Provides information about the /folders endpoint.
 */
export const FoldersIndexOptions = HttpApiEndpoint.options('FoldersIndexOptions', '/folders')
	.annotate(Title, 'Options for Folders')
	.annotate(Summary, 'Retrieve Folders')
	.annotate(
		Description,
		'Provides information about the /folders endpoint, including allowed methods.'
	)
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
	.addSuccess(PublicV1FolderSelect)
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
	.annotate(
		Description,
		'Provides information about the /folders/{id} endpoint, including allowed methods.'
	)
	.addSuccess(Schema.Void)
	.addError(RestAPIError, { status: 500 });
