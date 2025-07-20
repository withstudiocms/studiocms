import { Password, Session, VerifyEmail } from 'studiocms:auth/lib';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { AstroError } from 'astro/errors';
import { Effect, Layer } from 'effect';
import { convertToVanilla, genLogger, pipeLogger } from '../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../lib/endpointResponses.js';
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
		genLogger('studiocms/routes/api/auth/login/POST')(function* () {
			const sdk = yield* SDKCore;
			const authUtils = yield* AuthAPIUtils;
			const passUtils = yield* Password;
			const sessionUtils = yield* Session;
			const emailUtils = yield* VerifyEmail;

			const formData = yield* pipeLogger('studiocms/routes/api/auth/login/POST.formData')(
				Effect.tryPromise({
					try: () => context.request.formData(),
					catch: () => new AstroError('failed to parse formData'),
				})
			);

			const [username, password] = yield* pipeLogger(
				'studiocms/routes/api/auth/login/POST.parseFormData'
			)(
				Effect.all([
					authUtils.parseFormDataEntryToString(formData, 'username'),
					authUtils.parseFormDataEntryToString(formData, 'password'),
				])
			);

			if (!username)
				return yield* authUtils.badFormDataEntry('Missing field', 'Username is required');
			if (!password)
				return yield* authUtils.badFormDataEntry('Missing field', 'Password is required');

			const existingUser = yield* sdk.GET.users.byUsername(username);

			// If the user does not exist, return an ambiguous error
			if (!existingUser)
				return yield* authUtils.badFormDataEntry('Invalid credentials', 'Username is invalid');

			// Check if the user has a password or is using a oAuth login
			if (!existingUser.password)
				return yield* authUtils.badFormDataEntry('Incorrect method', 'User is using OAuth login');

			const validPassword = yield* passUtils.verifyPasswordHash(existingUser.password, password);

			if (!validPassword)
				return yield* authUtils.badFormDataEntry('Invalid credentials', 'Password is invalid');

			const isEmailAccountVerified = yield* emailUtils.isEmailVerified(existingUser);

			// If the email is not verified, return an error
			if (!isEmailAccountVerified)
				return yield* authUtils.badFormDataEntry(
					'Email not verified',
					'Please verify your email before logging in'
				);

			yield* sessionUtils.createUserSession(existingUser.id, context);

			return new Response();
		}).pipe(Effect.provide(deps))
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['POST']);

export const ALL: APIRoute = async () => AllResponse();
