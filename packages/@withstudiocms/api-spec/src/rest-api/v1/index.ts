import * as HttpApi from '@effect/platform/HttpApi';
import {
	Description,
	ExternalDocs,
	License,
	Title,
	Transform,
	Version,
} from '@effect/platform/OpenApi';
import { RestApiV1PublicSpec } from './public/index.js';
import { RestApiV1SecureSpec } from './secure/index.js';

export * from './public/index.js';
export * from './secure/index.js';

/**
 * StudioCMS REST API v1 Specification
 *
 * Defines the complete REST API v1 specification for StudioCMS, including both public and secure endpoints.
 * This API specification is built using the `@effect/platform` HTTP API builder and includes comprehensive
 * metadata and documentation.
 *
 * @remarks
 * The API specification includes:
 * - Public endpoints for general access
 * - Secure endpoints requiring authentication
 * - Comprehensive OpenAPI/Swagger documentation
 * - Contact information and external documentation links
 * - MIT license information
 *
 * All endpoints are prefixed with `/studiocms_api`.
 *
 * @see {@link https://docs.studiocms.dev/en/how-it-works/restapi/ | StudioCMS REST API Documentation}
 * @see {@link https://docs.studiocms.dev/en/ | StudioCMS Documentation}
 *
 * @version 1.0.0
 * @license MIT
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
	.annotate(Transform, (data) => ({
		...data,
		info: {
			...data.info,
			contact: {
				name: 'StudioCMS Team',
				url: 'https://chat.studiocms.dev',
				email: 'support@studiocms.dev',
			},
		},
		externalDocs: {
			url: 'https://docs.studiocms.dev/en/',
			description: 'StudioCMS Documentation',
		},
	}))
	.add(RestApiV1PublicSpec)
	.add(RestApiV1SecureSpec)
	.prefix('/studiocms_api') {}
