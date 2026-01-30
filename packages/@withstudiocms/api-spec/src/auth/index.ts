import { HttpApi, HttpApiGroup } from '@effect/platform';
import { Description, License, Title, Transform, Version } from '@effect/platform/OpenApi';
import pkg from '../../package.json';
import { AuthAPIError } from './errors.js';
import {
	forgotPasswordOptions,
	forgotPasswordPost,
	loginOptions,
	loginPost,
	logoutOptions,
	logoutPost,
	registerOptions,
	registerPost,
} from './routes/basePaths.js';
import {
	oAuthCallbackGet,
	oAuthCallbackOptions,
	oAuthIndexGet,
	oAuthIndexOptions,
} from './routes/oAuthPaths.js';

export * from './errors.js';
export * from './schemas.js';

/**
 * Authentication API specification group for StudioCMS.
 *
 * This class defines the API endpoints and utilities for handling authentication processes.
 * It extends the HttpApiGroup and is configured with metadata including title, description,
 * version, and license information.
 *
 * @remarks
 * - All endpoints in this group are prefixed with `/auth`
 * - Licensed under MIT License
 * - Version is derived from package.json
 *
 * @public
 */
export class AuthApi extends HttpApiGroup.make('AuthApi')
	.annotate(Title, 'Authentication API')
	.annotate(
		Description,
		'API endpoints for handling authentication processes including OAuth flows and session management.'
	)
	.annotate(Version, pkg.version)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.add(forgotPasswordPost)
	.add(forgotPasswordOptions)
	.add(loginPost)
	.add(loginOptions)
	.add(logoutPost)
	.add(logoutOptions)
	.add(registerPost)
	.add(registerOptions)
	.add(oAuthIndexGet)
	.add(oAuthIndexOptions)
	.add(oAuthCallbackGet)
	.add(oAuthCallbackOptions)
	.addError(AuthAPIError, { status: 500 })
	.prefix('/auth') {}

/**
 * StudioCMS Authentication API Specification
 *
 * Main API specification class for the StudioCMS Authentication that defines the HTTP API endpoints
 * and utilities for authentication interactions. This class extends HttpApi and provides comprehensive
 * metadata including licensing, versioning, and contact information.
 *
 * @remarks
 * This API specification is built using the Effect HTTP API framework and includes:
 * - MIT License with source repository reference
 * - Version tracking from package.json
 */
export class StudioCMSAuthApi extends HttpApi.make('StudioCMSAuthApi')
	.annotate(Title, 'StudioCMS Authentication HTTP API')
	.annotate(
		Description,
		'HTTP API specification for StudioCMS Authentication, providing endpoints for OAuth flows and session management.'
	)
	.annotate(Version, pkg.version)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
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
	.add(AuthApi)
	.prefix('/studiocms_api') {}
