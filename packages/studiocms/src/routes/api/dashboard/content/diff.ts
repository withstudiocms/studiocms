import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { APIRoute } from 'astro';
import {
	AllResponse,
	defineAPIRoute,
	Effect,
	genLogger,
	OptionsResponse,
} from '../../../../effect.js';

export const POST: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
		genLogger('studiocms/routes/api/dashboard/content/diff.POST')(function* () {
			const notify = yield* Notifications;
			const sdk = yield* SDKCore;

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

			const jsonData: { id: string; type: 'data' | 'content' | 'both' } = yield* Effect.tryPromise({
				try: () => ctx.request.json(),
				catch: () => new Error('Invalid JSON in request body'),
			});

			const { id, type } = jsonData;

			if (!id || !type) {
				return apiResponseLogger(400, 'Invalid ID or Type');
			}

			const data = yield* sdk.diffTracking.revertToDiff(id, type);

			yield* sdk.CLEAR.pages();

			yield* notify.sendEditorNotification('page_updated', data.pageMetaData.end.title || '');

			return apiResponseLogger(200, 'Page Reverted successfully');
		}).pipe(Notifications.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse({ allowedMethods: ['POST'] });

export const ALL: APIRoute = async () => AllResponse();
