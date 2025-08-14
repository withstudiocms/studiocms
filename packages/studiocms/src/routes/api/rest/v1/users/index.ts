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
	parseAPIContextJson,
	Schema,
} from '../../../../../effect.js';
import { verifyAuthTokenFromHeader } from '../../utils/auth-token.js';

export class JSONData extends Schema.Class<JSONData>('JSONData')({
	username: Schema.Union(Schema.String, Schema.Undefined),
	password: Schema.Union(Schema.String, Schema.Undefined),
	email: Schema.Union(Schema.String, Schema.Undefined),
	displayname: Schema.Union(Schema.String, Schema.Undefined),
	rank: Schema.Union(
		Schema.Literal('owner'),
		Schema.Literal('admin'),
		Schema.Literal('editor'),
		Schema.Literal('visitor'),
		Schema.Undefined
	),
}) {}

export const { ALL, GET, POST, OPTIONS } = createEffectAPIRoutes(
	{
		GET: (ctx) =>
			genLogger('studioCMS:rest:v1:users:GET')(function* () {
				const [sdk, user] = yield* Effect.all([SDKCore, verifyAuthTokenFromHeader(ctx)]);

				if (user instanceof Response) {
					return user;
				}

				const { rank } = user;

				if (rank !== 'owner' && rank !== 'admin') {
					return apiResponseLogger(401, 'Unauthorized');
				}

				const users = yield* sdk.GET.users.all();

				let data = users.map(
					({ avatar, createdAt, email, id, name, permissionsData, updatedAt, url, username }) => ({
						avatar,
						createdAt,
						email,
						id,
						name,
						rank: permissionsData?.rank ?? 'unknown',
						updatedAt,
						url,
						username,
					})
				);

				if (rank !== 'owner') {
					data = data.filter((user) => user.rank !== 'owner');
				}

				const searchParams = ctx.url.searchParams;

				const rankFilter = searchParams.get('rank');
				const usernameFilter = searchParams.get('username');
				const nameFilter = searchParams.get('name');

				let filteredData = data;

				if (rankFilter) {
					filteredData = filteredData.filter((user) => user.rank === rankFilter);
				}

				if (usernameFilter) {
					filteredData = filteredData.filter((user) => user.username.includes(usernameFilter));
				}

				if (nameFilter) {
					filteredData = filteredData.filter((user) => user.name.includes(nameFilter));
				}

				return createJsonResponse(filteredData);
			}),
		POST: (ctx) =>
			genLogger('studioCMS:rest:v1:users:POST')(function* () {
				const [sdk, user, userUtils, passwordUtils, notifier] = yield* Effect.all([
					SDKCore,
					verifyAuthTokenFromHeader(ctx),
					User,
					Password,
					Notifications,
				]);

				if (user instanceof Response) {
					return user;
				}

				const { rank } = user;

				if (rank !== 'owner' && rank !== 'admin') {
					return apiResponseLogger(401, 'Unauthorized');
				}

				let {
					username,
					password,
					email,
					displayname,
					rank: newUserRank,
				} = yield* parseAPIContextJson(ctx, JSONData);

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

				if (!newUserRank) {
					return apiResponseLogger(400, 'Missing field: Rank is required');
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
						userUtils.verifyUsernameInput(username),
						passwordUtils.verifyPasswordStrength(password),
						sdk.AUTH.user.searchUsersForUsernameOrEmail(username, checkEmail.data),
					]);

				// If the username is invalid, return an error
				if (verifyUsernameResponse !== true) {
					return apiResponseLogger(400, verifyUsernameResponse);
				}

				// If the password is invalid, return an error(password);
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
				const newUser = yield* userUtils.createLocalUser(
					displayname,
					username,
					checkEmail.data,
					password
				);
				const updateRank = yield* sdk.UPDATE.permissions({
					user: newUser.id,
					rank: newUserRank,
				});
				yield* notifier.sendAdminNotification('new_user', newUser.username);
				return apiResponseLogger(
					200,
					JSON.stringify({
						username,
						email: checkEmail.data,
						displayname,
						rank: updateRank.rank,
						password,
					})
				);
			}).pipe(Notifications.Provide, User.Provide, Password.Provide),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET', 'POST'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['GET', 'POST', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse({ error: 'Something went wrong' }, { status: 500 });
		},
	}
);
