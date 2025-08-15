import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
	readAPIContextJson,
} from '../../../effect.js';

export const { POST, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/update-user-notifications.POST')(function* () {
				const sdk = yield* SDKCore;

				// Get user data
				const userData = ctx.locals.StudioCMS.security?.userSessionData;

				// Check if user is logged in
				if (!userData?.isLoggedIn) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				// Check if user has permission
				const isAuthorized = ctx.locals.StudioCMS.security?.userPermissionLevel.isAdmin;
				if (!isAuthorized) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				const jsonData = yield* readAPIContextJson<{
					id: string;
					notifications: string;
				}>(ctx);

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
			}),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['POST'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['POST', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse({ error: 'Internal Server Error' }, { status: 500 });
		},
	}
);
