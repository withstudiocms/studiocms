import { Password, User } from 'studiocms:auth/lib';
import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { z } from 'astro/zod';
import { Effect } from 'effect';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../lib/endpointResponses.js';

type JSONData = {
	username: string | undefined;
	password: string | undefined;
	email: string | undefined;
	displayname: string | undefined;
	rank: 'owner' | 'admin' | 'editor' | 'visitor' | undefined;
};

export const POST: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/dashboard/create-user.POST')(function* () {
			const pass = yield* Password;
			const userHelper = yield* User;
			const notify = yield* Notifications;
			const sdk = yield* SDKCore;

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

			const jsonData: JSONData = yield* Effect.tryPromise(() => context.request.json());

			let { username, password, email, displayname, rank } = jsonData;

			// If the username, password, email, or display name is missing, return an error
			if (!username) {
				return apiResponseLogger(400, 'Missing field: Username is required');
			}

			if (!password) {
				password = yield* sdk.generateRandomPassword(12);
			}

			if (!email) {
				return apiResponseLogger(400, 'Missing field: Email is required');
			}

			if (!displayname) {
				return apiResponseLogger(400, 'Missing field: Display name is required');
			}

			if (!rank) {
				return apiResponseLogger(400, 'Missing field: Rank is required');
			}

			// If the username is invalid, return an error
			const verifyUsernameResponse = yield* userHelper.verifyUsernameInput(username);
			if (verifyUsernameResponse !== true) {
				return apiResponseLogger(400, verifyUsernameResponse);
			}

			// If the password is invalid, return an error
			const verifyPasswordResponse = yield* pass.verifyPasswordStrength(password);
			if (verifyPasswordResponse !== true) {
				return apiResponseLogger(400, verifyPasswordResponse);
			}

			// If the email is invalid, return an error
			const checkEmail = z.coerce
				.string()
				.email({ message: 'Email address is invalid' })
				.safeParse(email);

			if (!checkEmail.success) {
				return apiResponseLogger(400, `Invalid email: ${checkEmail.error.message}`);
			}

			const { usernameSearch, emailSearch } = yield* sdk.AUTH.user.searchUsersForUsernameOrEmail(
				username,
				checkEmail.data
			);

			if (usernameSearch.length > 0) {
				return apiResponseLogger(400, 'Invalid username: Username is already in use');
			}

			if (emailSearch.length > 0) {
				return apiResponseLogger(400, 'Invalid email: Email is already in use');
			}

			// Create a new user
			const newUser = yield* userHelper.createLocalUser(displayname, username, email, password);

			const updateRank = yield* sdk.UPDATE.permissions({
				user: newUser.id,
				rank: rank,
			});

			yield* notify.sendAdminNotification('new_user', newUser.username);

			return apiResponseLogger(
				200,
				JSON.stringify({ username, email, displayname, rank: updateRank.rank, password })
			);
		}).pipe(Password.Provide, User.Provide, Notifications.Provide, SDKCore.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['POST']);

export const ALL: APIRoute = async () => AllResponse();
