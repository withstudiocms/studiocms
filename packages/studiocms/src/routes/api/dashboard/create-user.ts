import { Password, User } from 'studiocms:auth/lib';
import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import { z } from 'astro/zod';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
	readAPIContextJson,
} from '../../../effect.js';

type JSONData = {
	username: string | undefined;
	password: string | undefined;
	email: string | undefined;
	displayname: string | undefined;
	rank: 'owner' | 'admin' | 'editor' | 'visitor' | undefined;
};

export enum UserPermissionLevel {
	visitor = 1,
	editor = 2,
	admin = 3,
	owner = 4,
	unknown = 0,
}

export const { POST, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/create-user.POST')(function* () {
				const [pass, userHelper, notify, sdk] = yield* Effect.all([
					Password,
					User,
					Notifications,
					SDKCore,
				]);

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

				let { username, password, email, displayname, rank } =
					yield* readAPIContextJson<JSONData>(ctx);

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

				// Validate target rank and ensure caller has sufficient privilege
				const allowedRanks = new Set(['owner', 'admin', 'editor', 'visitor'] as const);
				if (!allowedRanks.has(rank)) {
					return apiResponseLogger(400, 'Invalid rank');
				}
				const callerPerm = yield* userHelper.getUserPermissionLevel(userData);
				const rankToPerm = (r: typeof rank) => {
					switch (r) {
						case 'owner':
							return User.UserPermissionLevel.owner;
						case 'admin':
							return User.UserPermissionLevel.admin;
						case 'editor':
							return User.UserPermissionLevel.editor;
						case 'visitor':
							return User.UserPermissionLevel.visitor;
						default:
							return User.UserPermissionLevel.unknown;
					}
				};
				const targetPerm = rankToPerm(rank);
				// Use explicit weights to avoid relying on enum ordinal
				const permWeight = (lvl: UserPermissionLevel) => {
					switch (lvl) {
						case User.UserPermissionLevel.owner:
							return 4;
						case User.UserPermissionLevel.admin:
							return 3;
						case User.UserPermissionLevel.editor:
							return 2;
						case User.UserPermissionLevel.visitor:
							return 1;
						default:
							return 0;
					}
				};
				// Caller must strictly outrank the target rank they want to assign
				if (permWeight(callerPerm) <= permWeight(targetPerm)) {
					return createJsonResponse({ error: 'Forbidden' }, { status: 403 });
				}

				// If the email is invalid, return an error
				const checkEmail = z.coerce
					.string()
					.email({ message: 'Email address is invalid' })
					.safeParse(email);

				if (!checkEmail.success) {
					return apiResponseLogger(400, `Invalid email: ${checkEmail.error.message}`);
				}

				const [verifyUsernameResponse, verifyPasswordResponse, { usernameSearch, emailSearch }] =
					yield* Effect.all([
						userHelper.verifyUsernameInput(username),
						pass.verifyPasswordStrength(password),
						sdk.AUTH.user.searchUsersForUsernameOrEmail(username, checkEmail.data),
					]);

				// If the username is invalid, return an error
				if (verifyUsernameResponse !== true) {
					return apiResponseLogger(400, verifyUsernameResponse);
				}

				// If the password is invalid, return an error
				if (verifyPasswordResponse !== true) {
					return apiResponseLogger(400, verifyPasswordResponse);
				}

				if (usernameSearch.length > 0) {
					return apiResponseLogger(400, 'Invalid username: Username is already in use');
				}

				if (emailSearch.length > 0) {
					return apiResponseLogger(400, 'Invalid email: Email is already in use');
				}

				// Create a new user
				yield* userHelper.createLocalUser(displayname, username, email, password).pipe(
					Effect.flatMap((newUser) =>
						sdk.UPDATE.permissions({
							user: newUser.id,
							rank: rank,
						})
					),
					Effect.tap(() => notify.sendAdminNotification('new_user', username))
				);

				return apiResponseLogger(
					200,
					JSON.stringify({ username, email, displayname, rank: rank, password })
				);
			}).pipe(Password.Provide, User.Provide, Notifications.Provide),
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
