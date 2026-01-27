import { HttpApi } from '@effect/platform';
import { Description, Title, Version } from '@effect/platform/OpenApi';
import pkg from '../package.json';
import {
	RestApiV1PublicCategoriesSpec,
	RestApiV1PublicFoldersSpec,
	RestApiV1PublicPagesSpec,
	RestApiV1PublicTagsSpec,
	RestApiV1SecureCategoriesSpec,
	RestApiV1SecureFoldersSpec,
	RestApiV1SecurePagesSpec,
	RestApiV1SecureSettingsSpec,
	RestApiV1SecureTagsSpec,
	RestApiV1SecureUsersSpec,
} from './rest-api/v1/index.js';

export * from './rest-api/index.js';

export class StudioCMSAPISpec extends HttpApi.make('StudioCMSAPISpec')
	.annotate(Title, 'StudioCMS API Specifications')
	.annotate(
		Description,
		'The complete API specification for the StudioCMS API running within StudioCMS projects.'
	)
	.annotate(Version, pkg.version)

	// Rest API v1
	.add(RestApiV1PublicCategoriesSpec)
	.add(RestApiV1PublicFoldersSpec)
	.add(RestApiV1PublicPagesSpec)
	.add(RestApiV1PublicTagsSpec)
	.add(RestApiV1SecureCategoriesSpec)
	.add(RestApiV1SecureFoldersSpec)
	.add(RestApiV1SecurePagesSpec)
	.add(RestApiV1SecureSettingsSpec)
	.add(RestApiV1SecureTagsSpec)
	.add(RestApiV1SecureUsersSpec)

	// Prefix all paths with /studiocms_api
	.prefix('/studiocms_api') {}
