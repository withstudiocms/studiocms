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
import { TagByIdGet, TagByIdOptions, TagIndexGet, TagIndexOptions } from './tags.js';

/**
 * Public API specification for StudioCMS REST API version 1.
 *
 * @remarks
 * This class defines the public endpoints for the StudioCMS REST API v1.
 * All endpoints are prefixed with `/v1/public` and are accessible without authentication.
 *
 * @version 1.0.0
 * @public
 */
export class RestApiV1PublicSpec extends HttpApiGroup.make('RestApiV1PublicSpec')
	.annotate(Title, 'StudioCMS REST API v1 Public Specification')
	.annotate(Description, 'Public API specification for StudioCMS REST API version 1')
	.annotate(Version, '1.0.0')
	.prefix('/v1/public')

	// Categories Endpoints
	.add(CategoryIndexGet)
	.add(CategoryIndexOptions)
	.add(CategoryByIdGet)
	.add(CategoryByIdOptions)

	// Folders Endpoints
	.add(FoldersIndexGet)
	.add(FoldersIndexOptions)
	.add(FolderByIdGet)
	.add(FolderByIdOptions)

	// Pages Endpoints
	// .add(PageIndexGet)
	// .add(PageIndexOptions)
	// .add(PageByIdGet)
	// .add(PageByIdOptions)

	// Tags Endpoints
	.add(TagIndexGet)
	.add(TagIndexOptions)
	.add(TagByIdGet)
	.add(TagByIdOptions)

	// Error Handling
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 }) {}
