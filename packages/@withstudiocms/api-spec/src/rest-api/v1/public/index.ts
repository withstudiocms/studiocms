import { HttpApiGroup } from '@effect/platform';
import { Description, ExternalDocs, License, Title, Version } from '@effect/platform/OpenApi';
import { RestAPIError } from '../../errors.js';
import { CategoryByIdGet, CategoryIndexGet } from './categories.js';
import { FolderByIdGet, FoldersIndexGet } from './folders.js';
import { PageByIdGet, PageIndexGet } from './pages.js';
import { TagByIdGet, TagIndexGet } from './tags.js';

/**
 * REST API v1 Public Specification
 *
 * Defines the public REST API v1 endpoints for StudioCMS that do not require authentication.
 * This API group provides access to categories, folders, pages, and tags through standard
 * HTTP methods (GET, OPTIONS).
 *
 * @remarks
 * All endpoints are prefixed with `/rest/v1/public` and follow RESTful conventions.
 * The API includes both index endpoints (listing resources) and individual resource
 * endpoints (accessed by ID).
 *
 * Available endpoints:
 * - Categories: GET/OPTIONS for index and by ID
 * - Folders: GET/OPTIONS for index and by ID
 * - Pages: GET/OPTIONS for index and by ID
 * - Tags: GET/OPTIONS for index and by ID
 *
 * @see {@link https://docs.studiocms.dev/en/how-it-works/restapi/ | StudioCMS REST API Documentation}
 *
 * @version 1.0.0
 * @license MIT
 *
 * @throws {RestAPIError} 404 - Resource not found
 * @throws {RestAPIError} 500 - Internal server error
 */
export class RestApiV1PublicSpec extends HttpApiGroup.make('restV1Public')
	.annotate(Title, 'REST API v1 - Public')
	.annotate(
		Description,
		'Public Rest API v1 endpoints for StudioCMS. These endpoints do not require authentication to access.\n\n## Other Resources\n- [StudioCMS Rest API Documentation](https://docs.studiocms.dev/en/how-it-works/restapi/)'
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
	.add(CategoryIndexGet)
	.add(CategoryByIdGet)
	.add(FoldersIndexGet)
	.add(FolderByIdGet)
	.add(PageIndexGet)
	.add(PageByIdGet)
	.add(TagIndexGet)
	.add(TagByIdGet)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 })
	.prefix('/rest/v1/public') {}
