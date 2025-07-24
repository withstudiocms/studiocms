import { developerConfig } from 'studiocms:config';
import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { Effect } from 'effect';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../lib/endpointResponses.js';

export const POST: APIRoute = async (context: APIContext): Promise<Response> =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/dashboard/create-reset-link.POST')(function* () {
			const notify = yield* Notifications;
			const sdk = yield* SDKCore;

			// Check if demo mode is enabled
			if (developerConfig.demoMode !== false) {
				return apiResponseLogger(403, 'Demo mode is enabled, this action is not allowed.');
			}

			// Get user data
			const userData = context.locals.userSessionData;

			// Check if user is logged in
			if (!userData.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Check if user has permission
			const isAuthorized = context.locals.userPermissionLevel.isAdmin;
			if (!isAuthorized) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			const jsonData = yield* Effect.tryPromise(() => context.request.json());

			const { userId } = jsonData;

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

			return new Response(JSON.stringify(token), {
				headers: {
					'content-type': 'application/json',
				},
				status: 200,
			});
		}).pipe(Notifications.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['POST']);

export const ALL: APIRoute = async () => AllResponse();
