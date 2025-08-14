import { developerConfig } from 'studiocms:config';
import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
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
			genLogger('studiocms/routes/api/dashboard/create-reset-link.POST')(function* () {
				const [notify, sdk] = yield* Effect.all([Notifications, SDKCore]);

				// Check if demo mode is enabled
				if (developerConfig.demoMode !== false) {
					return apiResponseLogger(403, 'Demo mode is enabled, this action is not allowed.');
				}

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

				const { userId } = yield* readAPIContextJson<{ userId: string }>(ctx);

				if (!userId) {
					return apiResponseLogger(400, 'Invalid form data, userId is required');
				}

				const token = yield* sdk.resetTokenBucket.new(userId);

				if (!token) {
					return apiResponseLogger(500, 'Failed to create reset link');
				}

				const user = yield* sdk.GET.users.byId(userId);

				if (!user) {
					return apiResponseLogger(404, 'User not found');
				}

				yield* notify.sendAdminNotification('user_updated', user.username);

				return createJsonResponse(token);
			}).pipe(Notifications.Provide),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['POST'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['POST', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse(
				{ error: 'Internal Server Error' },
				{
					status: 500,
				}
			);
		},
	}
);
