import { db, eq } from 'astro:db';
import { tsUsers } from '@studiocms/core/db/tsTables';
import type { APIContext, APIRoute } from 'astro';
import { verifyPasswordHash, verifyPasswordStrength } from '../../../lib/password';
import {
	createSession,
	generateSessionToken,
	makeExpirationDate,
	setSessionTokenCookie,
} from '../../../lib/session';
import { verifyUsernameInput } from '../../../lib/user';

function parseFormDataEntryToString(formData: FormData, key: string): string | null {
	const value = formData.get(key);
	if (typeof value !== 'string') {
		return null;
	}
	return value;
}

const badPasswordorUsername = new Response(
	JSON.stringify({ error: 'Incorrect username or password' }),
	{
		status: 400,
		statusText: 'Bad Request',
	}
);

export const POST: APIRoute = async (context: APIContext): Promise<Response> => {
	// Get the form data
	const formData = await context.request.formData();

	// Get the username and password from the form data
	const username = parseFormDataEntryToString(formData, 'username');
	const password = parseFormDataEntryToString(formData, 'password');

	// If the username or password is missing, return an error
	if (!username || !password) {
		return badPasswordorUsername;
	}

	// If the username is invalid, return an error
	if (verifyUsernameInput(username) !== true) {
		return badPasswordorUsername;
	}

	// If the password is invalid, return an error
	if ((await verifyPasswordStrength(password)) !== true) {
		return badPasswordorUsername;
	}

	// Get the user from the database
	const existingUser = await db.select().from(tsUsers).where(eq(tsUsers.username, username)).get();

	// If the user does not exist, return an error
	if (!existingUser) {
		return badPasswordorUsername;
	}

	// Check if the user has a password or is using a oAuth login
	if (!existingUser.password) {
		return new Response(
			JSON.stringify({
				error: 'User is using a oAuth login',
			}),
			{
				status: 400,
			}
		);
	}

	// Verify the password
	const validPassword = await verifyPasswordHash(existingUser.password, password);

	// If the password is invalid, return an error
	if (!validPassword) {
		return badPasswordorUsername;
	}

	// Create a session
	const sessionToken = generateSessionToken();
	await createSession(sessionToken, existingUser.id);
	setSessionTokenCookie(context, sessionToken, makeExpirationDate());

	return new Response();
};
