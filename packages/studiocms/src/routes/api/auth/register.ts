import { Password, Session, User, VerifyEmail } from 'studiocms:auth/lib';
import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	Layer,
	OptionsResponse,
	pipeLogger,
} from '../../../effect.js';
import { AuthAPIUtils } from './shared.js';

const deps = Layer.mergeAll(
	AuthAPIUtils.Default,
	User.Default,
	VerifyEmail.Default,
	Password.Default,
	Session.Default
);

export const { POST, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('studiocms/routes/api/auth/register/POST')(function* () {
				const [
					sdk,
					{ badFormDataEntry, parseFormDataEntryToString, readFormData, validateEmail },
					{ verifyUsernameInput, createLocalUser },
					{ sendVerificationEmail },
					{ verifyPasswordStrength },
					{ createUserSession },
				] = yield* Effect.all([SDKCore, AuthAPIUtils, User, VerifyEmail, Password, Session]);

				const formData = yield* readFormData(ctx);

				const [username, password, email, name] = yield* pipeLogger(
					'studiocms/routes/api/auth/register/POST.parseFormData'
				)(
					Effect.all([
						parseFormDataEntryToString(formData, 'username'),
						parseFormDataEntryToString(formData, 'password'),
						parseFormDataEntryToString(formData, 'email'),
						parseFormDataEntryToString(formData, 'displayname'),
					])
				);

				if (!username) return yield* badFormDataEntry('MISSING_USERNAME', 'Username is required');
				if (!password) return yield* badFormDataEntry('MISSING_PASSWORD', 'Password is required');
				if (!email) return yield* badFormDataEntry('MISSING_EMAIL', 'Email is required');
				if (!name)
					return yield* badFormDataEntry('MISSING_DISPLAY_NAME', 'Display name is required');

				const verifyUsernameResponse = yield* verifyUsernameInput(username);
				if (verifyUsernameResponse !== true)
					return yield* badFormDataEntry('Invalid username', verifyUsernameResponse);

				// If the password is invalid, return an error
				const verifyPasswordResponse = yield* verifyPasswordStrength(password);
				if (verifyPasswordResponse !== true) {
					return yield* badFormDataEntry('Invalid password', verifyPasswordResponse);
				}

				const checkEmail = yield* validateEmail(email);

				if (!checkEmail.success)
					return yield* badFormDataEntry('Invalid email', checkEmail.error.message);

				const invalidEmailDomains: string[] = ['example.com', 'test.com', 'testing.com'];

				if (invalidEmailDomains.includes(checkEmail.data.split('@')[1])) {
					return yield* badFormDataEntry('Invalid Email', 'Must be from a valid domain');
				}

				const { usernameSearch, emailSearch } = yield* sdk.AUTH.user.searchUsersForUsernameOrEmail(
					username,
					checkEmail.data
				);

				if (usernameSearch.length > 0)
					return yield* badFormDataEntry('Invalid username', 'Username is already in use');
				if (emailSearch.length > 0)
					return yield* badFormDataEntry('Invalid email', 'Email is already in use');

				const newUser = yield* createLocalUser(name, username, email, password);

				yield* sendVerificationEmail(newUser.id);

				yield* createUserSession(newUser.id, ctx);

				return new Response();
			}).pipe(Effect.provide(deps)),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['POST'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['POST', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse({ error: 'Internal Server Error' }, { status: 500 });
		},
	}
);
