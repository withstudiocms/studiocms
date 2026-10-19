import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import * as Schema from 'effect/Schema';
import { RestAPIError } from '../../errors.js';
import {
	IdParamString,
	PublicV1FolderGetSearchParams,
	PublicV1FolderSelect,
} from '../../schemas.js';

/**
 * GET /folders
 * Search parameters for filtering folders.
 */
export const FoldersIndexGet = HttpApiEndpoint.get('getFolders', '/folders')
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
 * GET /folders/{id}
 * Retrieves a folder by its ID.
 */
export const FolderByIdGet = HttpApiEndpoint.get('getFolder', '/folders/:id')
	.setPath(IdParamString)
	.annotate(Title, 'Get Folder by ID')
	.annotate(Summary, 'Retrieve Folder by ID')
	.annotate(Description, 'Retrieves a folder by its ID.')
	.addSuccess(PublicV1FolderSelect)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });
