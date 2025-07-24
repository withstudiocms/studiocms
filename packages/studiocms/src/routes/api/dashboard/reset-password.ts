import { Password } from 'studiocms:auth/lib';
import { developerConfig } from 'studiocms:config';
import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { Effect } from 'effect';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../lib/endpointResponses.js';

export const POST: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/dashboard/reset-password.POST')(function* () {
			const notify = yield* Notifications;
			const sdk = yield* SDKCore;
			const pass = yield* Password;

			// Check if demo mode is enabled
			if (developerConfig.demoMode !== false) {
				return apiResponseLogger(403, 'Demo mode is enabled, this action is not allowed.');
			}

			const jsonData = yield* Effect.tryPromise(() => context.request.json());

			const { token, id, userid, password, confirm_password } = jsonData;

			if (!token) {
				return apiResponseLogger(400, 'Invalid form data, token is required');
			}

			if (!id) {
				return apiResponseLogger(400, 'Invalid form data, id is required');
			}

			if (!userid) {
				return apiResponseLogger(400, 'Invalid form data, userid is required');
			}

			if (!password) {
				return apiResponseLogger(400, 'Invalid form data, password is required');
			}

			if (!confirm_password) {
				return apiResponseLogger(400, 'Invalid form data, confirm_password is required');
			}

			if (password !== confirm_password) {
				return apiResponseLogger(400, 'Passwords do not match');
			}

			// If the password is invalid, return an error
			const verifyPasswordResponse = yield* pass.verifyPasswordStrength(password);
			if (verifyPasswordResponse !== true) {
				return apiResponseLogger(400, verifyPasswordResponse);
			}

			const hashedPassword = yield* pass.hashPassword(password);

			const userUpdate = {
				password: hashedPassword,
			};

			const userData = yield* sdk.GET.users.byId(userid);

			if (!userData) {
				return apiResponseLogger(404, 'User not found');
			}

			// @ts-expect-error drizzle broke the variable...
			yield* sdk.AUTH.user.update(userid, userUpdate);

			yield* sdk.resetTokenBucket.delete(userid);

			yield* notify.sendUserNotification('account_updated', userid);
			yield* notify.sendAdminNotification('user_updated', userData.username);

			return apiResponseLogger(200, 'User password updated successfully');
		}).pipe(Notifications.Provide, Password.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['POST']);

export const ALL: APIRoute = async () => AllResponse();
