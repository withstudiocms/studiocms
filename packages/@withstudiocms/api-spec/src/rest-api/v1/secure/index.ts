import { HttpApiGroup } from '@effect/platform';
import { Description, ExternalDocs, License, Title, Version } from '@effect/platform/OpenApi';
import { RestAPIError } from '../../errors.js';
import { RestAPIAuthorization } from '../../middleware.js';
import {
	CategoryByIdDelete,
	CategoryByIdGet,
	CategoryByIdOptions,
	CategoryByIdPatch,
	CategoryIndexGet,
	CategoryIndexOptions,
	CategoryIndexPost,
} from './categories.js';
import {
	FolderByIdDelete,
	FolderByIdGet,
	FolderByIdOptions,
	FolderByIdPatch,
	FolderIndexGet,
	FolderIndexOptions,
	FolderIndexPost,
} from './folders.js';
import {
	PagesByIdDelete,
	PagesByIdGet,
	PagesByIdHistoryByDiffIdGet,
	PagesByIdHistoryByDiffIdOptions,
	PagesByIdHistoryGet,
	PagesByIdHistoryOptions,
	PagesByIdOptions,
	PagesByIdPatch,
	PagesIndexGet,
	PagesIndexOptions,
	PagesIndexPost,
} from './pages.js';
import { SettingsIndexGet, SettingsIndexOptions, SettingsIndexPatch } from './settings.js';
import {
	TagsByIdDelete,
	TagsByIdGet,
	TagsByIdOptions,
	TagsByIdPatch,
	TagsIndexGet,
	TagsIndexOptions,
	TagsIndexPost,
} from './tags.js';
import {
	UsersByIdDelete,
	UsersByIdGet,
	UsersByIdOptions,
	UsersByIdPatch,
	UsersIndexGet,
	UsersIndexOptions,
	UsersIndexPost,
} from './users.js';

/**
 * Secure REST API v1 specification for StudioCMS.
 *
 * This class defines a group of secure REST API endpoints that require Bearer Token Authentication.
 * It provides comprehensive CRUD operations for various StudioCMS resources including:
 * - Categories: Manage content categories
 * - Folders: Organize content in folders
 * - Pages: Create, read, update, and delete pages with history tracking
 * - Tags: Manage content tags
 * - Users: User management operations
 * - Settings: System settings configuration
 *
 * All endpoints in this group are prefixed with `/rest/v1` and require proper authentication
 * via the `RestAPIAuthorization` middleware.
 *
 * @see {@link https://docs.studiocms.dev/en/how-it-works/restapi/ | StudioCMS REST API Documentation}
 *
 * @version 1.0.0
 * @license MIT
 *
 * @remarks
 * This API group includes error handling for 404 (Not Found) and 500 (Internal Server Error) responses.
 * Each resource supports standard HTTP methods (GET, POST, PATCH, DELETE, OPTIONS) where applicable.
 */
export class RestApiV1SecureSpec extends HttpApiGroup.make('RestApiV1SecureSpec')
	.annotate(Title, 'REST API v1 - Secure')
	.annotate(
		Description,
		'Secure Rest API v1 endpoints for StudioCMS. These endpoints require Bearer Token Authentication to access.\n\n## Other Resources\n- [StudioCMS Rest API Documentation](https://docs.studiocms.dev/en/how-it-works/restapi/)'
	)
	.annotate(ExternalDocs, {
		url: 'https://docs.studiocms.dev/en/how-it-works/restapi/',
		description: 'StudioCMS REST API Documentation',
	})
	.annotate(Version, '1.0.0')
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.add(CategoryByIdDelete)
	.add(CategoryByIdGet)
	.add(CategoryByIdOptions)
	.add(CategoryByIdPatch)
	.add(CategoryIndexGet)
	.add(CategoryIndexOptions)
	.add(CategoryIndexPost)
	.add(FolderByIdDelete)
	.add(FolderByIdGet)
	.add(FolderByIdOptions)
	.add(FolderByIdPatch)
	.add(FolderIndexGet)
	.add(FolderIndexOptions)
	.add(FolderIndexPost)
	.add(PagesByIdDelete)
	.add(PagesByIdGet)
	.add(PagesByIdHistoryByDiffIdGet)
	.add(PagesByIdHistoryByDiffIdOptions)
	.add(PagesByIdHistoryGet)
	.add(PagesByIdHistoryOptions)
	.add(PagesByIdOptions)
	.add(PagesByIdPatch)
	.add(PagesIndexGet)
	.add(PagesIndexOptions)
	.add(PagesIndexPost)
	.add(TagsByIdDelete)
	.add(TagsByIdGet)
	.add(TagsByIdOptions)
	.add(TagsByIdPatch)
	.add(TagsIndexGet)
	.add(TagsIndexOptions)
	.add(TagsIndexPost)
	.add(UsersByIdDelete)
	.add(UsersByIdGet)
	.add(UsersByIdOptions)
	.add(UsersByIdPatch)
	.add(UsersIndexGet)
	.add(UsersIndexOptions)
	.add(UsersIndexPost)
	.add(SettingsIndexGet)
	.add(SettingsIndexOptions)
	.add(SettingsIndexPatch)
	.middleware(RestAPIAuthorization)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 })
	.prefix('/rest/v1') {}
