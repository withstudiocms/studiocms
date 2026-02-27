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
 * API Tokens subgroup for managing API tokens within the StudioCMS Dashboard.
 */
export class DashboardApiTokensGroup extends HttpApiGroup.make('apiTokens')
	.annotate(Title, 'API Tokens Endpoints')
	.annotate(Description, 'Endpoints for managing API tokens in the StudioCMS Dashboard.')
	.annotate(Version, pkg.version)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.add(apiTokensPost)
	.add(apiTokensDelete)
	.addError(DashboardAPIError, { status: 500 })
	.prefix('/dashboard') {}

/**
 * Dashboard Config API group for managing configuration settings within the StudioCMS Dashboard.
 */
export class DashboardConfigApi extends HttpApiGroup.make('dashboardConfig')
	.annotate(Title, 'Dashboard Config API')
	.annotate(Description, 'Endpoints for managing StudioCMS Dashboard configuration settings.')
	.annotate(Version, pkg.version)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.add(configPost)
	.addError(DashboardAPIError, { status: 500 })
	.prefix('/dashboard') {}

/**
 * Dashboard Content API group for managing content within the StudioCMS Dashboard, including pages and folders.
 */
export class DashboardContentApi extends HttpApiGroup.make('dashboardContent')
	.annotate(Title, 'Dashboard Content API')
	.annotate(
		Description,
		'Endpoints for managing content within the StudioCMS Dashboard, including pages and folders.'
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
	.addError(DashboardAPIError, { status: 500 })
	.prefix('/dashboard') {}

/**
 * Dashboard Mailer API group for managing mailer configuration and email checks within the StudioCMS Dashboard.
 */
export class DashboardMailerApi extends HttpApiGroup.make('dashboardMailer')
	.annotate(Title, 'Dashboard Mailer API')
	.annotate(
		Description,
		'Endpoints for managing mailer configuration and email checks within the StudioCMS Dashboard.'
	)
	.annotate(Version, pkg.version)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.add(mailerCheckEmailPost)
	.add(mailerConfigPost)
	.add(mailerConfigPatch)
	.addError(DashboardAPIError, { status: 500 })
	.prefix('/dashboard') {}

/**
 * Dashboard Create API group for managing creation-related endpoints within the StudioCMS Dashboard, including user creation, invite creation, and reset link creation.
 */
export class DashboardCreateApi extends HttpApiGroup.make('dashboardCreate')
	.annotate(Title, 'Dashboard Create API')
	.annotate(
		Description,
		'Endpoints for creating users, invites, and reset links within the StudioCMS Dashboard.'
	)
	.annotate(Version, pkg.version)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.add(createResetLinkPost)
	.add(createUserInvitePost)
	.add(createUserPost)
	.addError(DashboardAPIError, { status: 500 })
	.prefix('/dashboard') {}

/**
 * Dashboard Email Notifications API group for managing email notification settings within the StudioCMS Dashboard.
 */
export class DashboardEmailNotificationsApi extends HttpApiGroup.make('dashboardEmailNotifications')
	.annotate(Title, 'Dashboard Email Notifications API')
	.annotate(
		Description,
		'Endpoints for managing email notification settings within the StudioCMS Dashboard.'
	)
	.annotate(Version, pkg.version)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.add(emailNotificationsSettingsPost)
	.addError(DashboardAPIError, { status: 500 })
	.prefix('/dashboard') {}

/**
 * Dashboard Plugins API group for managing plugin-related endpoints within the StudioCMS Dashboard, including updating plugin settings.
 */
export class DashboardPluginsApi extends HttpApiGroup.make('dashboardPlugins')
	.annotate(Title, 'Dashboard Plugins API')
	.annotate(Description, 'Endpoints for managing plugin settings within the StudioCMS Dashboard.')
	.annotate(Version, pkg.version)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.add(pluginsSettingsPost)
	.addError(DashboardAPIError, { status: 500 })
	.prefix('/dashboard') {}

/**
 * Dashboard Profile API group for managing user profile-related endpoints within the StudioCMS Dashboard, including updating user profile information.
 */
export class DashboardProfileApi extends HttpApiGroup.make('dashboardProfile')
	.annotate(Title, 'Dashboard Profile API')
	.annotate(Description, 'Endpoints for managing user profiles within the StudioCMS Dashboard.')
	.annotate(Version, pkg.version)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.add(profilePost)
	.addError(DashboardAPIError, { status: 500 })
	.prefix('/dashboard') {}

/**
 * Dashboard Reset Password API group for managing password reset-related endpoints within the StudioCMS Dashboard, including creating reset links and handling password resets.
 */
export class DashboardResetPasswordApi extends HttpApiGroup.make('dashboardResetPassword')
	.annotate(Title, 'Dashboard Reset Password API')
	.annotate(Description, 'Endpoints for managing password resets within the StudioCMS Dashboard.')
	.annotate(Version, pkg.version)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.add(resetPasswordPost)
	.addError(DashboardAPIError, { status: 500 })
	.prefix('/dashboard') {}

/**
 * Dashboard Search API group for managing search-related endpoints within the StudioCMS Dashboard, including searching for content and taxonomy terms.
 */
export class DashboardSearchApi extends HttpApiGroup.make('dashboardSearch')
	.annotate(Title, 'Dashboard Search API')
	.annotate(
		Description,
		'Endpoints for searching content and taxonomy within the StudioCMS Dashboard.'
	)
	.annotate(Version, pkg.version)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.add(searchListGet)
	.addError(DashboardAPIError, { status: 500 })
	.prefix('/dashboard') {}

/**
 * Dashboard Taxonomy API group for managing taxonomy-related endpoints within the StudioCMS Dashboard, including creating, deleting, and searching taxonomy terms.
 */
export class DashboardTaxonomyApi extends HttpApiGroup.make('dashboardTaxonomy')
	.annotate(Title, 'Dashboard Taxonomy API')
	.annotate(Description, 'Endpoints for managing taxonomy within the StudioCMS Dashboard.')
	.annotate(Version, pkg.version)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.add(taxonomyPost)
	.add(taxonomyDelete)
	.add(taxonomySearchGet)
	.addError(DashboardAPIError, { status: 500 })
	.prefix('/dashboard') {}

/**
 * Dashboard Templates API group for managing template-related endpoints within the StudioCMS Dashboard, including creating and updating templates.
 */
export class DashboardTemplatesApi extends HttpApiGroup.make('dashboardTemplates')
	.annotate(Title, 'Dashboard Templates API')
	.annotate(Description, 'Endpoints for managing templates within the StudioCMS Dashboard.')
	.annotate(Version, pkg.version)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.add(templatesPost)
	.addError(DashboardAPIError, { status: 500 })
	.prefix('/dashboard') {}

/**
 * Dashboard Users API group for managing user-related endpoints within the StudioCMS Dashboard, including user creation, deletion, and notification settings.
 */
export class DashboardUsersApi extends HttpApiGroup.make('dashboardUsers')
	.annotate(Title, 'Dashboard Users API')
	.annotate(Description, 'Endpoints for managing users within the StudioCMS Dashboard.')
	.annotate(Version, pkg.version)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.add(updateUserNotificationsPost)
	.add(usersPost)
	.add(usersDelete)
	.addError(DashboardAPIError, { status: 500 })
	.prefix('/dashboard') {}

/**
 * Dashboard Verify Endpoints API group for managing verification-related endpoints within the StudioCMS Dashboard, including email verification and session verification.
 */
export class DashboardVerifyEndpointsApi extends HttpApiGroup.make('dashboardVerifyEndpoints')
	.annotate(Title, 'Dashboard Verify Endpoints API')
	.annotate(
		Description,
		'Endpoints for verifying email and session within the StudioCMS Dashboard.'
	)
	.annotate(Version, pkg.version)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.add(verifyEmailGet)
	.add(resendVerifyEmailPost)
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
		'Main API specification for the StudioCMS Dashboard, providing endpoints for managing and interacting with the StudioCMS Dashboard. This specification includes comprehensive metadata such as licensing, versioning, and contact information.\n\n## External Resources\n\n- [Main Website](https://studiocms.dev)\n- [StudioCMS GitHub Repository](https://github.com/withstudiocms/studiocms)\n- [Discord Community](https://chat.studiocms.dev)\n- [API Source definitions](https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/)\n\n---\n\n_This API specification is automatically generated and maintained by the StudioCMS team._'
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
	.add(DashboardApiTokensGroup)
	.add(DashboardConfigApi)
	.add(DashboardContentApi)
	.add(DashboardMailerApi)
	.add(DashboardCreateApi)
	.add(DashboardEmailNotificationsApi)
	.add(DashboardPluginsApi)
	.add(DashboardProfileApi)
	.add(DashboardResetPasswordApi)
	.add(DashboardSearchApi)
	.add(DashboardTaxonomyApi)
	.add(DashboardTemplatesApi)
	.add(DashboardUsersApi)
	.add(DashboardVerifyEndpointsApi)
	.prefix('/studiocms_api') {}
