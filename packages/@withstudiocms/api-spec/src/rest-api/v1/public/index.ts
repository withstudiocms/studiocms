import { HttpApiGroup } from '@effect/platform';
import { Description, ExternalDocs, License, Title, Version } from '@effect/platform/OpenApi';
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
 * REST API v1 - Public Specification
 */
export class RestApiV1PublicSpec extends HttpApiGroup.make('RestApiV1PublicSpec')
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
	.add(CategoryIndexOptions)
	.add(CategoryByIdGet)
	.add(CategoryByIdOptions)
	.add(FoldersIndexGet)
	.add(FoldersIndexOptions)
	.add(FolderByIdGet)
	.add(FolderByIdOptions)
	.add(PageIndexGet)
	.add(PageIndexOptions)
	.add(PageByIdGet)
	.add(PageByIdOptions)
	.add(TagIndexGet)
	.add(TagIndexOptions)
	.add(TagByIdGet)
	.add(TagByIdOptions)
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 })
	.prefix('/rest/v1/public') {}
