import { HttpApiGroup } from '@effect/platform';
import { Description, Title, Version } from '@effect/platform/OpenApi';
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
 * StudioCMS REST API v1 Secure Categories Specification
 */
export class RestApiV1SecureCategoriesSpec extends HttpApiGroup.make(
	'RestApiV1SecureCategoriesSpec'
)
	.annotate(Title, 'StudioCMS REST API v1 Secure Categories Specification')
	.annotate(Description, 'Secure Categories endpoints for StudioCMS REST API version 1')
	.annotate(Version, '1.0.0')
	.add(CategoryByIdDelete)
	.add(CategoryByIdGet)
	.add(CategoryByIdOptions)
	.add(CategoryByIdPatch)
	.add(CategoryIndexGet)
	.add(CategoryIndexOptions)
	.add(CategoryIndexPost)
	.middleware(RestAPIAuthorization)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 })
	.prefix('/rest/v1') {}

/**
 * StudioCMS REST API v1 Secure Folders Specification
 */
export class RestApiV1SecureFoldersSpec extends HttpApiGroup.make('RestApiV1SecureFoldersSpec')
	.annotate(Title, 'StudioCMS REST API v1 Secure Folders Specification')
	.annotate(Description, 'Secure Folders endpoints for StudioCMS REST API version 1')
	.annotate(Version, '1.0.0')
	.add(FolderByIdDelete)
	.add(FolderByIdGet)
	.add(FolderByIdOptions)
	.add(FolderByIdPatch)
	.add(FolderIndexGet)
	.add(FolderIndexOptions)
	.add(FolderIndexPost)
	.middleware(RestAPIAuthorization)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 })
	.prefix('/rest/v1') {}

/**
 * StudioCMS REST API v1 Secure Pages Specification
 */
export class RestApiV1SecurePagesSpec extends HttpApiGroup.make('RestApiV1SecurePagesSpec')
	.annotate(Title, 'StudioCMS REST API v1 Secure Pages Specification')
	.annotate(Description, 'Secure Pages endpoints for StudioCMS REST API version 1')
	.annotate(Version, '1.0.0')
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
	.middleware(RestAPIAuthorization)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 })
	.prefix('/rest/v1') {}

/**
 * StudioCMS REST API v1 Secure Tags Specification
 */
export class RestApiV1SecureTagsSpec extends HttpApiGroup.make('RestApiV1SecureTagsSpec')
	.annotate(Title, 'StudioCMS REST API v1 Secure Tags Specification')
	.annotate(Description, 'Secure Tags endpoints for StudioCMS REST API version 1')
	.annotate(Version, '1.0.0')
	.add(TagsByIdDelete)
	.add(TagsByIdGet)
	.add(TagsByIdOptions)
	.add(TagsByIdPatch)
	.add(TagsIndexGet)
	.add(TagsIndexOptions)
	.add(TagsIndexPost)
	.middleware(RestAPIAuthorization)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 })
	.prefix('/rest/v1') {}

/**
 * StudioCMS REST API v1 Secure Users Specification
 */
export class RestApiV1SecureUsersSpec extends HttpApiGroup.make('RestApiV1SecureUsersSpec')
	.annotate(Title, 'StudioCMS REST API v1 Secure Users Specification')
	.annotate(Description, 'Secure Users endpoints for StudioCMS REST API version 1')
	.annotate(Version, '1.0.0')
	.add(UsersByIdDelete)
	.add(UsersByIdGet)
	.add(UsersByIdOptions)
	.add(UsersByIdPatch)
	.add(UsersIndexGet)
	.add(UsersIndexOptions)
	.add(UsersIndexPost)
	.middleware(RestAPIAuthorization)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 })
	.prefix('/rest/v1') {}

/**
 * StudioCMS REST API v1 Secure Settings Specification
 */
export class RestApiV1SecureSettingsSpec extends HttpApiGroup.make('RestApiV1SecureSettingsSpec')
	.annotate(Title, 'StudioCMS REST API v1 Secure Settings Specification')
	.annotate(Description, 'Secure Settings endpoints for StudioCMS REST API version 1')
	.annotate(Version, '1.0.0')
	.add(SettingsIndexGet)
	.add(SettingsIndexOptions)
	.add(SettingsIndexPatch)
	.middleware(RestAPIAuthorization)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 500 })
	.prefix('/rest/v1') {}
