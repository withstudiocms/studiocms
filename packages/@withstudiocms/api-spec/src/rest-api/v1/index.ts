import { HttpApi } from '@effect/platform';
import { Description, ExternalDocs, License, Title, Version } from '@effect/platform/OpenApi';
import { RestApiV1PublicSpec } from './public/index.js';
import { RestApiV1SecureSpec } from './secure/index.js';

export * from './public/index.js';
export * from './secure/index.js';

/**
 * StudioCMS REST API v1 Specification
 */
export class StudioCMSRestApiV1Spec extends HttpApi.make('StudioCMSRestApiV1Spec')
	.annotate(Title, 'StudioCMS REST API v1 Specification')
	.annotate(
		Description,
		'Rest API v1 endpoints for StudioCMS.\n\n## Other Resources\n- [StudioCMS Rest API Documentation](https://docs.studiocms.dev/en/how-it-works/restapi/)'
	)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.annotate(ExternalDocs, {
		url: 'https://docs.studiocms.dev/en/how-it-works/restapi/',
		description: 'StudioCMS REST API Documentation',
	})
	.annotate(Version, '1.0.0')
	.add(RestApiV1PublicSpec)
	.add(RestApiV1SecureSpec)
	.prefix('/studiocms_api') {}
