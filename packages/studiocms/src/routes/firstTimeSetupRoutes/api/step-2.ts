import { Password, User } from 'studiocms:auth/lib';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { z } from 'astro/zod';
import { Effect } from 'effect';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../lib/endpointResponses.js';

export const POST: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms:first-time-setup:step-2:POST')(function* () {
			const sdk = yield* SDKCore;
			const userUtils = yield* User;
			const passwordUtils = yield* Password;

			const reqData = yield* Effect.tryPromise(() => context.request.json());

			const { username, displayname, email, password, confirmPassword } = reqData;

			const requiredFields = [
				{ field: username, name: 'Username' },
				{ field: displayname, name: 'Display name' },
				{ field: email, name: 'Email' },
				{ field: password, name: 'Password' },
				{ field: confirmPassword, name: 'Confirm password' },
			];

			for (const { field, name } of requiredFields) {
				if (!field) {
					return new Response(JSON.stringify({ error: `${name} is required` }), { status: 400 });
				}
			}

			if (password !== confirmPassword) {
				return new Response(
					JSON.stringify({
						error: 'Passwords do not match',
					}),
					{
						status: 400,
					}
				);
			}

			// If the username is invalid, return an error
			const usernameTest = yield* userUtils.verifyUsernameInput(username);
			if (usernameTest !== true) {
				return new Response(
					JSON.stringify({
						error: usernameTest,
					}),
					{
						status: 400,
					}
				);
			}

			// If the password is invalid, return an error
			const passwordTest = yield* passwordUtils.verifyPasswordStrength(password);
			if (passwordTest !== true) {
				return new Response(
					JSON.stringify({
						error: passwordTest,
					}),
					{
						status: 400,
					}
				);
			}

			// If the email is invalid, return an error
			const checkEmail = z.string().email({ message: 'Email address is invalid' }).safeParse(email);

			if (!checkEmail.success) {
				return new Response(
					JSON.stringify({
						error: checkEmail.error.message,
					}),
					{
						status: 400,
					}
				);
			}

			const newUser = yield* userUtils.createLocalUser(displayname, username, email, password);

			yield* sdk.UPDATE.permissions({
				user: newUser.id,
				rank: 'owner',
			});

			return new Response(JSON.stringify({ message: 'Success' }), {
				status: 200,
			});
		}).pipe(SDKCore.Provide, User.Provide, Password.Provide)
	).catch((error) => {
		if (error instanceof Error) {
			console.error('Error in first time setup step 1:', error);
			return new Response(JSON.stringify({ error: error.message }), {
				status: 500,
				statusText: 'Internal Server Error',
			});
		}
		// Fallback for non-Error exceptions
		console.error('Non-Error exception:', error);
		// Return a generic error response
		// This could happen if the error is not an instance of Error
		// or if the error handling is not as expected.
		return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
			status: 500,
			statusText: 'Internal Server Error',
		});
	});

export const OPTIONS: APIRoute = async () => OptionsResponse(['POST']);

export const ALL: APIRoute = async () => AllResponse();
