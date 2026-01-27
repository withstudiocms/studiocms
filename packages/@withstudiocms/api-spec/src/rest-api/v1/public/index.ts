import { HttpApiGroup } from '@effect/platform';
import { Description, Title, Version } from '@effect/platform/OpenApi';
import { RestAPIError } from '../../errors.js';
import {
	CategoryByIdGet,
	CategoryByIdOptions,
	CategoryIndexGet,
	CategoryIndexOptions,
} from './categories.js';
import {
	FolderByIdGet,
	FolderByIdOptions,
	FoldersIndexGet,
	FoldersIndexOptions,
} from './folders.js';
import { PageByIdGet, PageByIdOptions, PageIndexGet, PageIndexOptions } from './pages.js';
import { TagByIdGet, TagByIdOptions, TagIndexGet, TagIndexOptions } from './tags.js';

/**
 * StudioCMS REST API v1 Public Categories Specification
 */
export class RestApiV1PublicCategoriesSpec extends HttpApiGroup.make(
	'RestApiV1PublicCategoriesSpec'
)
	.annotate(Title, 'StudioCMS REST API v1 Public Categories Specification')
	.annotate(Description, 'Public Categories endpoints for StudioCMS REST API version 1')
	.annotate(Version, '1.0.0')
	.add(CategoryIndexGet)
	.add(CategoryIndexOptions)
	.add(CategoryByIdGet)
	.add(CategoryByIdOptions)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 })
	.prefix('/rest/v1/public') {}

/**
 * StudioCMS REST API v1 Public Folders Specification
 */
export class RestApiV1PublicFoldersSpec extends HttpApiGroup.make('RestApiV1PublicFoldersSpec')
	.annotate(Title, 'StudioCMS REST API v1 Public Folders Specification')
	.annotate(Description, 'Public Folders endpoints for StudioCMS REST API version 1')
	.annotate(Version, '1.0.0')
	.add(FoldersIndexGet)
	.add(FoldersIndexOptions)
	.add(FolderByIdGet)
	.add(FolderByIdOptions)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 })
	.prefix('/rest/v1/public') {}

/**
 * StudioCMS REST API v1 Public Pages Specification
 */
export class RestApiV1PublicPagesSpec extends HttpApiGroup.make('RestApiV1PublicPagesSpec')
	.annotate(Title, 'StudioCMS REST API v1 Public Pages Specification')
	.annotate(Description, 'Public Pages endpoints for StudioCMS REST API version 1')
	.annotate(Version, '1.0.0')
	.add(PageIndexGet)
	.add(PageIndexOptions)
	.add(PageByIdGet)
	.add(PageByIdOptions)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 })
	.prefix('/rest/v1/public') {}

/**
 * StudioCMS REST API v1 Public Tags Specification
 */
export class RestApiV1PublicTagsSpec extends HttpApiGroup.make('RestApiV1PublicTagsSpec')
	.annotate(Title, 'StudioCMS REST API v1 Public Tags Specification')
	.annotate(Description, 'Public Tags endpoints for StudioCMS REST API version 1')
	.annotate(Version, '1.0.0')
	.add(TagIndexGet)
	.add(TagIndexOptions)
	.add(TagByIdGet)
	.add(TagByIdOptions)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 })
	.prefix('/rest/v1/public') {}
