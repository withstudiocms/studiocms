import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { AstroLocalsMiddleware } from '../../astro-context.js';
import { DashboardAPIError } from '../errors.js';
import {
	CreateResetLinkPayload,
	CreateUserInvitePayload,
	CreateUserPayload,
	successResponseSchema,
} from '../schemas.js';

/**
 * Create Password Reset Link Endpoint
 *
 * This endpoint allows creating a password reset link for a user.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const createResetLinkPost = HttpApiEndpoint.post(
	'createPasswordResetLink',
	'/create-reset-link'
)
	.annotate(Title, 'Create Password Reset Link')
	.annotate(Summary, 'Create a password reset link for a user')
	.annotate(
		Description,
		'Creates a password reset link for a user to reset their password.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in/contextlocals) and requires users to be logged into the current StudioCMS instance with appropriate permissions.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(CreateResetLinkPayload)
	.addSuccess(successResponseSchema)
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });

/**
 * Create User Invite Link Endpoint
 *
 * This endpoint allows creating a user invite link for inviting new users to the StudioCMS instance.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const createUserInvitePost = HttpApiEndpoint.post('createUserInvite', '/create-user-invite')
	.annotate(Title, 'Create User Invite Link')
	.annotate(Summary, 'Create a user invite link for inviting new users to the StudioCMS instance')
	.annotate(
		Description,
		'Creates a user invite link for inviting new users to the StudioCMS instance.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in/contextlocals) and requires users to be logged into the current StudioCMS instance with appropriate permissions.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(CreateUserInvitePayload)
	.addSuccess(successResponseSchema)
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });

/**
 * Create User Endpoint
 *
 * This endpoint allows creating a new user in the StudioCMS instance.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const createUserPost = HttpApiEndpoint.post('createUser', '/create-user')
	.annotate(Title, 'Create User')
	.annotate(Summary, 'Create a new user in the StudioCMS instance')
	.annotate(
		Description,
		'Creates a new user in the StudioCMS instance.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in/contextlocals) and requires users to be logged into the current StudioCMS instance with appropriate permissions.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(CreateUserPayload)
	.addSuccess(successResponseSchema)
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });
