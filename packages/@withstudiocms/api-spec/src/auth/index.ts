import { HttpApi, HttpApiGroup } from '@effect/platform';
import { Description, License, Title, Transform, Version } from '@effect/platform/OpenApi';
import pkg from '../../package.json';
import { StudioCMSLicenseAnnotation, StudioCMSTransformAnnotation } from '../consts.js';
import { AuthAPIError } from './errors.js';
import { forgotPasswordPost, loginPost, logoutPost, registerPost } from './routes/basePaths.js';
import { oAuthCallbackGet, oAuthIndexGet } from './routes/oAuthPaths.js';

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
export class AuthApi extends HttpApiGroup.make('auth')
	.annotate(Title, 'Primary Auth API Group')
	.annotate(
		Description,
		'API endpoints for handling authentication processes including OAuth flows and session management.'
	)
	.annotate(Version, pkg.version)
	.annotate(License, StudioCMSLicenseAnnotation)
	.add(forgotPasswordPost)
	.add(loginPost)
	.add(logoutPost)
	.add(registerPost)
	.addError(AuthAPIError, { status: 500 })
	.prefix('/auth') {}

/**
 * OAuth API group for handling OAuth authentication flows.
 *
 * This group includes endpoints for initiating OAuth flows and handling OAuth callbacks.
 * It is nested within the main AuthApi group and shares the same metadata and error handling.
 */
export class OAuthAPI extends HttpApiGroup.make('oauth')
	.annotate(Title, 'OAuth API Group')
	.annotate(Description, 'API endpoints for handling OAuth authentication flows.')
	.annotate(Version, pkg.version)
	.annotate(License, StudioCMSLicenseAnnotation)
	.add(oAuthIndexGet)
	.add(oAuthCallbackGet)
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
		'HTTP API specification for StudioCMS Authentication, providing endpoints for OAuth flows and session management.\n\n## External Resources\n\n- [Main Website](https://studiocms.dev)\n- [StudioCMS GitHub Repository](https://github.com/withstudiocms/studiocms)\n- [Discord Community](https://chat.studiocms.dev)\n- [API Source definitions](https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/)\n\n---\n\n_This API specification is automatically generated and maintained by the StudioCMS team._'
	)
	.annotate(Version, pkg.version)
	.annotate(License, StudioCMSLicenseAnnotation)
	.annotate(Transform, StudioCMSTransformAnnotation)
	.add(AuthApi)
	.add(OAuthAPI)
	.prefix('/studiocms_api') {}
