import { HttpApi, HttpApiGroup } from '@effect/platform';
import { Description, License, Title, Transform, Version } from '@effect/platform/OpenApi';
import pkg from '../../package.json';
import { SDKAPIError } from './errors.js';
import {
	fullChangelogOptions,
	fullChangelogPost,
	listPagesGet,
	listPagesOptions,
	updateLatestVersionCacheGet,
	updateLatestVersionCacheOptions,
} from './routes.js';

/**
 * SDK API specification group for StudioCMS.
 *
 * This class defines the API endpoints and utilities for interacting with the StudioCMS SDK.
 * It extends the HttpApiGroup and is configured with metadata including title, description,
 * version, and license information.
 *
 * @remarks
 * - All endpoints in this group are prefixed with `/sdk`
 * - Licensed under MIT License
 * - Version is derived from the package.json
 *
 * @public
 */
export class SDKApi extends HttpApiGroup.make('SDKApi')
	.annotate(Title, 'SDK API')
	.annotate(
		Description,
		'Utilities and tools for interacting with the StudioCMS SDK. These endpoints are publicly accessible as they do not expose any sensitive data.\n\nThese endpoints allow users to retrieve SDK-related information such as the full changelog, list of public non-draft pages, and update the latest version cache.'
	)
	.annotate(Version, pkg.version)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.add(fullChangelogPost)
	.add(fullChangelogOptions)
	.add(listPagesGet)
	.add(listPagesOptions)
	.add(updateLatestVersionCacheGet)
	.add(updateLatestVersionCacheOptions)
	.addError(SDKAPIError, { status: 500 })
	.prefix('/sdk') {}

/**
 * StudioCMS SDK API Specification
 *
 * Main API specification class for the StudioCMS SDK that defines the HTTP API endpoints
 * and utilities for SDK interactions. This class extends HttpApi and provides comprehensive
 * metadata including licensing, versioning, and contact information.
 *
 * @remarks
 * This API specification is built using the Effect HTTP API framework and includes:
 * - MIT License with source repository reference
 * - Version tracking from package.json
 * - Contact information for the StudioCMS team
 * - External documentation links
 * - Custom transformation for additional OpenAPI metadata
 *
 * All endpoints are prefixed with `/studiocms_api` and documented according to
 * OpenAPI/Swagger specifications.
 *
 * @see {@link https://docs.studiocms.dev/en/ | StudioCMS Documentation}
 * @see {@link https://chat.studiocms.dev | StudioCMS Support}
 *
 * @public
 */
export class StudioCMSSDKApiSpec extends HttpApi.make('StudioCMSSDKApiSpec')
	.annotate(Title, 'StudioCMS SDK API Specification')
	.annotate(
		Description,
		'API specification for the StudioCMS SDK, providing endpoints and utilities for SDK interactions.'
	)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
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
			externalDocs: {
				url: 'https://docs.studiocms.dev/en/',
				description: 'StudioCMS Documentation',
			},
		},
	}))
	.add(SDKApi)
	.prefix('/studiocms_api') {}
