import { Password } from 'studiocms:auth/lib';
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
			genLogger('studiocms/routes/api/dashboard/reset-password.POST')(function* () {
				const [notify, sdk, pass] = yield* Effect.all([Notifications, SDKCore, Password]);

				// Check if demo mode is enabled
				if (developerConfig.demoMode !== false) {
					return apiResponseLogger(403, 'Demo mode is enabled, this action is not allowed.');
				}

				const { token, id, userid, password, confirm_password } = yield* readAPIContextJson<{
					token: string;
					id: string;
					userid: string;
					password: string;
					confirm_password: string;
				}>(ctx);

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

				yield* Effect.all([
					sdk.AUTH.user.update(userid, userUpdate),
					sdk.resetTokenBucket.delete(userid),
					notify.sendUserNotification('account_updated', userid),
					notify.sendAdminNotification('user_updated', userData.username),
				]);

				return apiResponseLogger(200, 'User password updated successfully');
			}).pipe(Notifications.Provide, Password.Provide),
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
