import { HttpApi, HttpApiGroup } from '@effect/platform';
import { Description, License, Title, Transform, Version } from '@effect/platform/OpenApi';
import pkg from '../../package.json';
import { DashboardAPIError } from './errors.js';
import { apiTokensDelete, apiTokensPost } from './routes/api-tokens.js';
import { configPost } from './routes/config.js';
import {
	contentDiffPost,
	contentFolderDelete,
	contentFolderPatch,
	contentFolderPost,
	contentPageDelete,
	contentPagePatch,
	contentPagePost,
} from './routes/content.js';
import {
	createResetLinkPost,
	createUserInvitePost,
	createUserPost,
} from './routes/create-endpoints.js';
import { emailNotificationsSettingsPost } from './routes/email-notifications-settings.js';
import { mailerCheckEmailPost, mailerConfigPatch, mailerConfigPost } from './routes/mailer.js';
import { pluginsSettingsPost } from './routes/plugins.js';
import { profilePost } from './routes/profile.js';
import { resetPasswordPost } from './routes/reset-password.js';
import { searchListGet } from './routes/search-list.js';
import { taxonomyDelete, taxonomyPost, taxonomySearchGet } from './routes/taxonomy.js';
import { templatesPost } from './routes/templates.js';
import { updateUserNotificationsPost, usersDelete, usersPost } from './routes/users.js';
import { resendVerifyEmailPost, verifyEmailGet } from './routes/verify-email-endpoints.js';
import { verifySessionPost } from './routes/verify-session.js';

export * from './errors.js';
export * from './schemas.js';

/**
 * Dashboard API specification group for StudioCMS.
 *
 * This class defines the API endpoints and utilities for interacting with the StudioCMS Dashboard.
 * It extends the HttpApiGroup and is configured with metadata including title, description,
 * version, and license information.
 *
 * @remarks
 * - All endpoints in this group are prefixed with `/dashboard`
 * - Licensed under MIT License
 * - Version is derived from the package.json
 *
 * @public
 */
export class DashboardApi extends HttpApiGroup.make('dashboard')
	.annotate(Title, 'Dashboard API')
	.annotate(
		Description,
		'APIs for managing and interacting with the StudioCMS Dashboard. These endpoints require authentication and are intended for use by authorized users to manage their StudioCMS instances.'
	)
	.annotate(Version, pkg.version)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.add(contentPagePost)
	.add(contentPagePatch)
	.add(contentPageDelete)
	.add(contentFolderPost)
	.add(contentFolderPatch)
	.add(contentFolderDelete)
	.add(contentDiffPost)
	.add(mailerCheckEmailPost)
	.add(mailerConfigPost)
	.add(mailerConfigPatch)
	.add(pluginsSettingsPost)
	.add(apiTokensPost)
	.add(apiTokensDelete)
	.add(configPost)
	.add(createResetLinkPost)
	.add(createUserInvitePost)
	.add(createUserPost)
	.add(emailNotificationsSettingsPost)
	.add(profilePost)
	.add(resendVerifyEmailPost)
	.add(resetPasswordPost)
	.add(searchListGet)
	.add(taxonomyPost)
	.add(taxonomyDelete)
	.add(taxonomySearchGet)
	.add(templatesPost)
	.add(updateUserNotificationsPost)
	.add(usersPost)
	.add(usersDelete)
	.add(verifyEmailGet)
	.add(verifySessionPost)
	.addError(DashboardAPIError, { status: 500 })
	.prefix('/dashboard') {}

/**
 * StudioCMS Dashboard API Specification
 *
 * Main API specification class for the StudioCMS Dashboard that defines the HTTP API endpoints
 * and utilities for dashboard interactions. This class extends HttpApi and provides comprehensive
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
export class StudioCMSDashboardApiSpec extends HttpApi.make('StudioCMSDashboardApiSpec')
	.annotate(Title, 'StudioCMS Dashboard API Specification')
	.annotate(
		Description,
		'Main API specification for the StudioCMS Dashboard, providing endpoints for managing and interacting with the StudioCMS Dashboard. This specification includes comprehensive metadata such as licensing, versioning, and contact information.'
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
		},
		externalDocs: {
			url: 'https://docs.studiocms.dev/en/',
			description: 'StudioCMS Documentation',
		},
	}))
	.add(DashboardApi)
	.prefix('/studiocms_api') {}
