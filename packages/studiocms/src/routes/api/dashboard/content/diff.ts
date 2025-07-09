import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { Effect } from 'effect';
import { convertToVanilla, genLogger } from '../../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../../lib/endpointResponses.js';

export const POST: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/dashboard/content/diff.POST')(function* () {
			const notify = yield* Notifications;
			const sdk = yield* SDKCore;

			// Get user data
			const userData = context.locals.userSessionData;

			// Check if user is logged in
			if (!userData.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Check if user has permission
			const isAuthorized = context.locals.userPermissionLevel.isEditor;
			if (!isAuthorized) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			const jsonData: { id: string; type: 'data' | 'content' | 'both' } = yield* Effect.tryPromise({
				try: () => context.request.json(),
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
		}).pipe(Notifications.Provide, SDKCore.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['POST']);

export const ALL: APIRoute = async () => AllResponse();
