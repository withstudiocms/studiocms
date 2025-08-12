import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIRoute } from 'astro';
import {
	AllResponse,
	defineAPIRoute,
	Effect,
	genLogger,
	OptionsResponse,
} from '../../../effect.js';

export const POST: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
		genLogger('studiocms/routes/api/dashboard/update-user-notifications.POST')(function* () {
			const sdk = yield* SDKCore;

			// Get user data
			const userData = ctx.locals.StudioCMS.security?.userSessionData;

			// Check if user is logged in
			if (!userData?.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Check if user has permission
			const isAuthorized = ctx.locals.userPermissionLevel.isAdmin;
			if (!isAuthorized) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			const jsonData = yield* Effect.tryPromise({
				try: () => ctx.request.json(),
				catch: () => new Error('Invalid JSON in request body'),
			});

			const userId = jsonData.id;
			const notifications = jsonData.notifications;

			if (!userId) {
				return apiResponseLogger(400, 'Invalid request');
			}

			const user = yield* sdk.GET.users.byId(userId);

			if (!user) {
				return apiResponseLogger(404, 'User not found');
			}

			const updatedData = yield* sdk.AUTH.user.update(userId, {
				notifications,
			});

			if (!updatedData) {
				return apiResponseLogger(400, 'Failed to update user notifications');
			}

			return apiResponseLogger(200, 'User notifications updated successfully');
		})
	);

export const OPTIONS: APIRoute = async () => OptionsResponse({ allowedMethods: ['POST'] });

export const ALL: APIRoute = async () => AllResponse();
