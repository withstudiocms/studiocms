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
} from '../../../../effect.js';

export const { POST, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/content/diff.POST')(function* () {
				const [notify, sdk] = yield* Effect.all([Notifications, SDKCore]);

				// Get user data
				const userData = ctx.locals.StudioCMS.security?.userSessionData;

				// Check if user is logged in
				if (!userData?.isLoggedIn) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				// Check if user has permission
				const isAuthorized = ctx.locals.StudioCMS.security?.userPermissionLevel.isEditor;
				if (!isAuthorized) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				const jsonData = yield* readAPIContextJson<{
					id: string;
					type: 'data' | 'content' | 'both';
				}>(ctx);

				const { id, type } = jsonData;

				if (!id || !type) {
					return apiResponseLogger(400, 'Invalid ID or Type');
				}

				if (!['data', 'content', 'both'].includes(type)) {
					return apiResponseLogger(400, 'Invalid Type');
				}

				const data = yield* sdk.diffTracking.revertToDiff(id, type);

				yield* Effect.all([
					sdk.CLEAR.pages(),
					notify.sendEditorNotification('page_updated', data.pageMetaData.end.title || ''),
				]);

				return apiResponseLogger(200, 'Page Reverted successfully');
			}).pipe(Notifications.Provide),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['POST'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['POST', 'OPTIONS'] },
		onError: (error) => {
			console.error('Error in diff API:', error);
			return createJsonResponse(
				{ error: 'Internal Server Error' },
				{
					status: 500,
				}
			);
		},
	}
);
