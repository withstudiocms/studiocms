import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { AstroLocalsMiddleware } from '../../astro-context.js';
import { DashboardAPIError } from '../errors.js';
import {
	successResponseSchema,
	UpdateUserNotificationsPayload,
	UsersDeletePayload,
	UsersPostPayload,
} from '../schemas.js';

/**
 * Update User Notifications Endpoint
 *
 * This endpoint allows updating the notification settings for the logged-in user in the StudioCMS dashboard.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const updateUserNotificationsPost = HttpApiEndpoint.post(
	'updateUserNotifications',
	'/update-user-notifications'
)
	.annotate(Title, 'Update User Notifications')
	.annotate(Summary, 'Update the notification settings for the logged-in user')
	.annotate(
		Description,
		'Updates the notification settings for the logged-in user in the StudioCMS dashboard.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in/contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(UpdateUserNotificationsPayload)
	.addSuccess(successResponseSchema)
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 404 })
	.addError(DashboardAPIError, { status: 500 });

/**
 * Update User Endpoint
 *
 * This endpoint allows updating the user information for a specific user in the StudioCMS dashboard.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const usersPost = HttpApiEndpoint.post('updateUser', '/users')
	.annotate(Title, 'Update User')
	.annotate(Summary, 'Update the user information for a specific user')
	.annotate(
		Description,
		'Updates the user information for a specific user in the StudioCMS dashboard.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in/contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(UsersPostPayload)
	.addSuccess(successResponseSchema)
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 404 })
	.addError(DashboardAPIError, { status: 500 });

/**
 * Delete User Endpoint
 *
 * This endpoint allows deleting a specific user from the StudioCMS dashboard.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const usersDelete = HttpApiEndpoint.del('deleteUser', '/users')
	.annotate(Title, 'Delete User')
	.annotate(Summary, 'Delete a specific user from the StudioCMS dashboard')
	.annotate(
		Description,
		'Deletes a specific user from the StudioCMS dashboard.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in/contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(UsersDeletePayload)
	.addSuccess(successResponseSchema)
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 404 })
	.addError(DashboardAPIError, { status: 500 });
