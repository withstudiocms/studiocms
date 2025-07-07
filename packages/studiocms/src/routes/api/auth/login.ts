import { Password, Session, VerifyEmail } from 'studiocms:auth/lib';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { Effect, Layer } from 'effect';
import { convertToVanilla, genLogger, pipeLogger } from '../../../lib/effects/index.js';
import { AuthAPIUtils } from './shared.js';

const deps = Layer.mergeAll(
	SDKCore.Default,
	Password.Default,
	AuthAPIUtils.Default,
	VerifyEmail.Default,
	Session.Default
);

export const POST: APIRoute = async (context: APIContext): Promise<Response> =>
	await convertToVanilla(
		genLogger('studiocms/routes/auth/api/login/POST')(function* () {
			const sdk = yield* SDKCore;

			const formData = yield* pipeLogger('studiocms/routes/auth/api/login/POST.formData')(
				Effect.tryPromise(() => context.request.formData())
			);

			const [username, password] = yield* pipeLogger(
				'studiocms/routes/auth/api/login/POST.parseFormData'
			)(
				Effect.all([
					AuthAPIUtils.parseFormDataEntryToString(formData, 'username'),
					AuthAPIUtils.parseFormDataEntryToString(formData, 'password'),
				])
			);

			if (!username)
				return yield* AuthAPIUtils.badFormDataEntry('Missing field', 'Username is required');
			if (!password)
				return yield* AuthAPIUtils.badFormDataEntry('Missing field', 'Password is required');

			const existingUser = yield* sdk.GET.users.byUsername(username);

			// If the user does not exist, return an ambiguous error
			if (!existingUser)
				return yield* AuthAPIUtils.badFormDataEntry('Invalid credentials', 'Username is invalid');

			// Check if the user has a password or is using a oAuth login
			if (!existingUser.password)
				return yield* AuthAPIUtils.badFormDataEntry(
					'Incorrect method',
					'User is using OAuth login'
				);

			const validPassword = yield* Password.verifyPasswordHash(existingUser.password, password);

			if (!validPassword)
				return yield* AuthAPIUtils.badFormDataEntry('Invalid credentials', 'Password is invalid');

			const isEmailAccountVerified = yield* VerifyEmail.isEmailVerified(existingUser);

			// If the email is not verified, return an error
			if (!isEmailAccountVerified)
				return yield* AuthAPIUtils.badFormDataEntry(
					'Email not verified',
					'Please verify your email before logging in'
				);

			yield* Session.createUserSession(existingUser.id, context);

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
