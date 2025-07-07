import { Password, User } from 'studiocms:auth/lib';
import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { z } from 'astro/zod';
import { Effect, Schema } from 'effect';
import { convertToVanilla, genLogger } from '../../../../../lib/effects/index.js';
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

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:users:GET')(function* () {
			const sdk = yield* SDKCore;

			const user = yield* verifyAuthTokenFromHeader(context);

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

			const searchParams = context.url.searchParams;

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

			return new Response(JSON.stringify(filteredData), {
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}).pipe(SDKCore.Provide, Notifications.Provide)
	).catch((error) => {
		return apiResponseLogger(500, 'Failed to fetch users', error);
	});

export const POST: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:users:POST')(function* () {
			const sdk = yield* SDKCore;
			const user = yield* verifyAuthTokenFromHeader(context);

			if (user instanceof Response) {
				return user;
			}

			const { rank } = user;

			if (rank !== 'owner' && rank !== 'admin') {
				return apiResponseLogger(401, 'Unauthorized');
			}

			const jsonData = yield* Effect.tryPromise(() => context.request.json());
			let {
				username,
				password,
				email,
				displayname,
				rank: newUserRank,
			} = yield* Schema.decodeUnknown(JSONData)(jsonData);

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

			// If the username is invalid, return an error
			const verifyUsernameResponse = yield* User.verifyUsernameInput(username);
			if (verifyUsernameResponse !== true) {
				return apiResponseLogger(400, verifyUsernameResponse);
			}

			// If the password is invalid, return an error
			const verifyPasswordResponse = yield* Password.verifyPasswordStrength(password);
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
			const newUser = yield* User.createLocalUser(displayname, username, checkEmail.data, password);
			const updateRank = yield* sdk.UPDATE.permissions({
				user: newUser.id,
				rank: newUserRank,
			});
			yield* Notifications.sendAdminNotification('new_user', newUser.username);
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
		}).pipe(SDKCore.Provide, Notifications.Provide, User.Provide, Password.Provide)
	).catch((error) => {
		return apiResponseLogger(500, 'Failed to create user', error);
	});

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET, POST',
			'ALLOW-ACCESS-CONTROL-ORIGIN': '*',
			'Cache-Control': 'public, max-age=604800, immutable',
			Date: new Date().toUTCString(),
		},
	});
};

export const ALL: APIRoute = async () => {
	return new Response(null, {
		status: 405,
		statusText: 'Method Not Allowed',
		headers: {
			'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
		},
	});
};
