import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { tsNotificationSettingsSelect } from 'studiocms:sdk/types';
import type { APIRoute } from 'astro';
import { Effect } from 'effect';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../lib/endpointResponses.js';

export const POST: APIRoute = async (context) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/dashboard/email-notification-settings-site.POST')(function* () {
			const sdk = yield* SDKCore;

			// Get user data
			const userData = context.locals.userSessionData;

			// Check if user is logged in
			if (!userData.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Check if user has permission
			const isAuthorized = context.locals.userPermissionLevel.isOwner;
			if (!isAuthorized) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			const jsonData: Omit<tsNotificationSettingsSelect, 'id'> = yield* Effect.tryPromise(() =>
				context.request.json()
			);

			yield* sdk.notificationSettings.site.update(jsonData);

			return apiResponseLogger(200, 'Notification settings updated');
		}).pipe(SDKCore.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['POST']);

export const ALL: APIRoute = async () => AllResponse();
