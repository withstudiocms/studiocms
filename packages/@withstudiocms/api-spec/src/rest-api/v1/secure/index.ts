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

/**
 * REST API v1 Secure Specification for StudioCMS
 *
 * @remarks
 * This class defines the secure API specification for StudioCMS REST API version 1.
 * It extends the HttpApiGroup and provides a secure endpoint group with versioned routing.
 *
 * The specification includes:
 * - Title: "StudioCMS REST API v1 Secure Specification"
 * - Description: "Secure API specification for StudioCMS REST API version 1"
 * - Version: "1.0.0"
 * - URL Prefix: "/v1"
 *
 * @public
 */
export class RestApiV1SecureSpec extends HttpApiGroup.make('RestApiV1SecureSpec')
	.annotate(Title, 'StudioCMS REST API v1 Secure Specification')
	.annotate(Description, 'Secure API specification for StudioCMS REST API version 1')
	.annotate(Version, '1.0.0')
	.prefix('/v1')

	// Categories Endpoints
	.add(CategoryByIdDelete)
	.add(CategoryByIdGet)
	.add(CategoryByIdOptions)
	.add(CategoryByIdPatch)
	.add(CategoryIndexGet)
	.add(CategoryIndexOptions)
	.add(CategoryIndexPost)

	// Folders Endpoints
	.add(FolderByIdDelete)
	.add(FolderByIdGet)
	.add(FolderByIdOptions)
	.add(FolderByIdPatch)
	.add(FolderIndexGet)
	.add(FolderIndexOptions)
	.add(FolderIndexPost)

	// Pages Endpoints

	// Settings Endpoints

	// Tags Endpoints

	// Users Endpoints

	.middleware(RestAPIAuthorization)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 }) {}
