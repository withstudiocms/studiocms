import { HttpApi } from '@effect/platform';
import { Description, Title, Version } from '@effect/platform/OpenApi';
import {
	RestApiV1PublicCategoriesSpec,
	RestApiV1PublicFoldersSpec,
	RestApiV1PublicPagesSpec,
	RestApiV1PublicTagsSpec,
} from './public/index.js';
import {
	RestApiV1SecureCategoriesSpec,
	RestApiV1SecureFoldersSpec,
	RestApiV1SecurePagesSpec,
	RestApiV1SecureSettingsSpec,
	RestApiV1SecureTagsSpec,
	RestApiV1SecureUsersSpec,
} from './secure/index.js';

export * from './public/index.js';
export * from './secure/index.js';

/**
 * StudioCMS REST API v1 Specification
 */
export class StudioCMSRestApiV1Spec extends HttpApi.make('StudioCMSRestApiV1Spec')
	.annotate(Title, 'StudioCMS REST API v1 Specification')
	.annotate(Description, 'API specification for StudioCMS REST API version 1')
	.annotate(Version, '1.0.0')
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
	.prefix('/studiocms_api') {}
