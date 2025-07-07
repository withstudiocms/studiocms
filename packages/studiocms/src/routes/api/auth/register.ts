import { Password, Session, User, VerifyEmail } from 'studiocms:auth/lib';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { z } from 'astro/zod';
import { Effect, Layer } from 'effect';
import { convertToVanilla, genLogger, pipeLogger } from '../../../lib/effects/index.js';
import { AuthAPIUtils } from './shared.js';

const deps = Layer.mergeAll(
	SDKCore.Default,
	AuthAPIUtils.Default,
	User.Default,
	VerifyEmail.Default,
	Password.Default,
	Session.Default
);

export const POST: APIRoute = async (context: APIContext): Promise<Response> =>
	await convertToVanilla(
		genLogger('studiocms/routes/auth/api/register/POST')(function* () {
			const sdk = yield* SDKCore;
			const formData = yield* pipeLogger('studiocms/routes/auth/api/register/POST.formData')(
				Effect.tryPromise(() => context.request.formData())
			);

			const [username, password, email, name] = yield* pipeLogger(
				'studiocms/routes/auth/api/register/POST.parseFormData'
			)(
				Effect.all([
					AuthAPIUtils.parseFormDataEntryToString(formData, 'username'),
					AuthAPIUtils.parseFormDataEntryToString(formData, 'password'),
					AuthAPIUtils.parseFormDataEntryToString(formData, 'email'),
					AuthAPIUtils.parseFormDataEntryToString(formData, 'displayname'),
				])
			);

			if (!username)
				return yield* AuthAPIUtils.badFormDataEntry('Missing field', 'Username is required');
			if (!password)
				return yield* AuthAPIUtils.badFormDataEntry('Missing field', 'Password is required');
			if (!email) return yield* AuthAPIUtils.badFormDataEntry('Missing entry', 'Email is required');
			if (!name)
				return yield* AuthAPIUtils.badFormDataEntry('Missing entry', 'Display name is required');

			const verifyUsernameResponse = yield* User.verifyUsernameInput(username);
			if (verifyUsernameResponse !== true)
				return yield* AuthAPIUtils.badFormDataEntry('Invalid username', verifyUsernameResponse);

			// If the password is invalid, return an error
			const verifyPasswordResponse = yield* Password.verifyPasswordStrength(password);
			if (verifyPasswordResponse !== true) {
				return yield* AuthAPIUtils.badFormDataEntry('Invalid password', verifyPasswordResponse);
			}

			const checkEmailSchema = z.coerce.string().email({ message: 'Email address is invalid' });

			const checkEmail = yield* pipeLogger('studiocms/routes/auth/api/register/POST.checkEmail')(
				Effect.try(() => checkEmailSchema.safeParse(email))
			);

			if (!checkEmail.success)
				return yield* AuthAPIUtils.badFormDataEntry('Invalid email', checkEmail.error.message);

			const invalidEmailDomains: string[] = ['example.com', 'text.com', 'testing.com'];

			if (invalidEmailDomains.includes(checkEmail.data.split('@')[1])) {
				return yield* AuthAPIUtils.badFormDataEntry('Invalid Email', 'Must be from a valid domain');
			}

			const { usernameSearch, emailSearch } = yield* sdk.AUTH.user.searchUsersForUsernameOrEmail(
				username,
				checkEmail.data
			);

			if (usernameSearch.length > 0)
				return yield* AuthAPIUtils.badFormDataEntry(
					'Invalid username',
					'Username is already in use'
				);
			if (emailSearch.length > 0)
				return yield* AuthAPIUtils.badFormDataEntry('Invalid email', 'Email is already in use');

			const newUser = yield* User.createLocalUser(name, username, email, password);

			yield* VerifyEmail.sendVerificationEmail(newUser.id);

			yield* Session.createUserSession(newUser.id, context);

			return new Response();
		}).pipe(Effect.provide(deps))
	);

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, POST',
			'Access-Control-Allow-Origin': '*',
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
