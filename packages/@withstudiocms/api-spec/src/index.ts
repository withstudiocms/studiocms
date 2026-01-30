import { HttpApi } from '@effect/platform';
import {
	Description,
	ExternalDocs,
	License,
	Title,
	Transform,
	Version,
} from '@effect/platform/OpenApi';
import pkg from '../package.json';
import { AuthApi } from './auth/index.js';
import { RestApiV1PublicSpec, RestApiV1SecureSpec } from './rest-api/v1/index.js';
import { SDKApi } from './sdk/index.js';

export * from './auth/index.js';
export * from './rest-api/index.js';
export * from './sdk/index.js';

/**
 * StudioCMS API Specification
 *
 * Main API specification class that defines the complete StudioCMS API structure.
 * This class extends HttpApi and provides comprehensive API documentation including
 * metadata, versioning, and endpoint definitions.
 *
 * @remarks
 * The API specification includes:
 * - OpenAPI metadata (title, description, license, version)
 * - External documentation links
 * - Contact information for the StudioCMS team
 * - All endpoints are prefixed with `/studiocms_api`
 *
 * @example
 * ```typescript
 * // The API spec is automatically generated and can be used for:
 * // - OpenAPI/Swagger documentation generation
 * // - API client generation
 * // - Type-safe API endpoint definitions
 * ```
 *
 * @see {@link https://studiocms.dev | StudioCMS Website}
 * @see {@link https://docs.studiocms.dev/en/ | StudioCMS Documentation}
 * @see {@link https://github.com/withstudiocms/studiocms | GitHub Repository}
 *
 * @public
 */
export class StudioCMSAPISpec extends HttpApi.make('StudioCMSAPISpec')
	.annotate(Title, 'StudioCMS API Specifications')
	.annotate(
		Description,
		'This documentation covers the full StudioCMS API available from any StudioCMS installation.\n\n## External Resources\n\n- [Main Website](https://studiocms.dev)\n- [StudioCMS GitHub Repository](https://github.com/withstudiocms/studiocms)\n- [Discord Community](https://chat.studiocms.dev)\n- [API Source definitions](https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/)\n\n> [!warning]\n> **This document is not yet complete, additional endpoints and details will be added over time.**\n\n---\n\n_This API specification is automatically generated and maintained by the StudioCMS team._'
	)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.annotate(ExternalDocs, {
		url: 'https://docs.studiocms.dev/en/',
		description: 'StudioCMS Documentation',
	})
	.annotate(Version, pkg.version)
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

	// Auth API
	.add(AuthApi)

	// Rest API v1
	.add(RestApiV1PublicSpec)
	.add(RestApiV1SecureSpec)

	// SDK API
	.add(SDKApi)

	// Prefix all paths with /studiocms_api
	.prefix('/studiocms_api') {}
