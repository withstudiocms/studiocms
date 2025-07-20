import { Password, Session, User, VerifyEmail } from 'studiocms:auth/lib';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { z } from 'astro/zod';
import { Effect, Layer } from 'effect';
import { convertToVanilla, genLogger, pipeLogger } from '../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../lib/endpointResponses.js';
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
		genLogger('studiocms/routes/api/auth/register/POST')(function* () {
			const sdk = yield* SDKCore;
			const authAPIUtils = yield* AuthAPIUtils;
			const userUtils = yield* User;
			const verifier = yield* VerifyEmail;
			const passwordUtils = yield* Password;
			const sessionUtils = yield* Session;

			const formData = yield* pipeLogger('studiocms/routes/api/auth/register/POST.formData')(
				Effect.tryPromise(() => context.request.formData())
			);

			const [username, password, email, name] = yield* pipeLogger(
				'studiocms/routes/api/auth/register/POST.parseFormData'
			)(
				Effect.all([
					authAPIUtils.parseFormDataEntryToString(formData, 'username'),
					authAPIUtils.parseFormDataEntryToString(formData, 'password'),
					authAPIUtils.parseFormDataEntryToString(formData, 'email'),
					authAPIUtils.parseFormDataEntryToString(formData, 'displayname'),
				])
			);

			if (!username)
				return yield* authAPIUtils.badFormDataEntry('Missing field', 'Username is required');
			if (!password)
				return yield* authAPIUtils.badFormDataEntry('Missing field', 'Password is required');
			if (!email) return yield* authAPIUtils.badFormDataEntry('Missing entry', 'Email is required');
			if (!name)
				return yield* authAPIUtils.badFormDataEntry('Missing entry', 'Display name is required');

			const verifyUsernameResponse = yield* userUtils.verifyUsernameInput(username);
			if (verifyUsernameResponse !== true)
				return yield* authAPIUtils.badFormDataEntry('Invalid username', verifyUsernameResponse);

			// If the password is invalid, return an error
			const verifyPasswordResponse = yield* passwordUtils.verifyPasswordStrength(password);
			if (verifyPasswordResponse !== true) {
				return yield* authAPIUtils.badFormDataEntry('Invalid password', verifyPasswordResponse);
			}

			const checkEmailSchema = z.coerce.string().email({ message: 'Email address is invalid' });

			const checkEmail = yield* pipeLogger('studiocms/routes/api/auth/register/POST.checkEmail')(
				Effect.try(() => checkEmailSchema.safeParse(email))
			);

			if (!checkEmail.success)
				return yield* authAPIUtils.badFormDataEntry('Invalid email', checkEmail.error.message);

			const invalidEmailDomains: string[] = ['example.com', 'text.com', 'testing.com'];

			if (invalidEmailDomains.includes(checkEmail.data.split('@')[1])) {
				return yield* authAPIUtils.badFormDataEntry('Invalid Email', 'Must be from a valid domain');
			}

			const { usernameSearch, emailSearch } = yield* sdk.AUTH.user.searchUsersForUsernameOrEmail(
				username,
				checkEmail.data
			);

			if (usernameSearch.length > 0)
				return yield* authAPIUtils.badFormDataEntry(
					'Invalid username',
					'Username is already in use'
				);
			if (emailSearch.length > 0)
				return yield* authAPIUtils.badFormDataEntry('Invalid email', 'Email is already in use');

			const newUser = yield* userUtils.createLocalUser(name, username, email, password);

			yield* verifier.sendVerificationEmail(newUser.id);

			yield* sessionUtils.createUserSession(newUser.id, context);

			return new Response();
		}).pipe(Effect.provide(deps))
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['POST']);

export const ALL: APIRoute = async () => AllResponse();
