import { db, eq } from 'astro:db';
import { tsUsers } from '@studiocms/core/db/tsTables';
import type { APIContext, APIRoute } from 'astro';
import { z } from 'astro/zod';
import { verifyPasswordStrength } from '../../../lib/password';
import {
	createSession,
	generateSessionToken,
	makeExpirationDate,
	setSessionTokenCookie,
} from '../../../lib/session';
import { createLocalUser, verifyUsernameInput } from '../../../lib/user';

function parseFormDataEntryToString(formData: FormData, key: string): string | null {
	const value = formData.get(key);
	if (typeof value !== 'string') {
		return null;
	}
	return value;
}

const badFormDataEntry = new Response(JSON.stringify({ error: 'Invalid form data' }), {
	status: 400,
	statusText: 'Bad Request',
});

export const POST: APIRoute = async (context: APIContext): Promise<Response> => {
	// Get the form data
	const formData = await context.request.formData();

	// Get the username and password from the form data
	const username = parseFormDataEntryToString(formData, 'username');
	const password = parseFormDataEntryToString(formData, 'password');

	// If the username or password is missing, return an error
	if (!username || !password) {
		return badFormDataEntry;
	}

	// If the username is invalid, return an error
	if (verifyUsernameInput(username) !== true) {
		return badFormDataEntry;
	}

	// If the password is invalid, return an error
	if ((await verifyPasswordStrength(password)) !== true) {
		return badFormDataEntry;
	}

	// Get the email and display name from the form data
	const email = parseFormDataEntryToString(formData, 'email');
	const name = parseFormDataEntryToString(formData, 'displayname');

	// If the email or display name is missing, return an error
	if (!email || !name) {
		return badFormDataEntry;
	}

	// If the email is invalid, return an error
	const checkemail = z.coerce
		.string()
		.email({ message: 'Email address is invalid' })
		.safeParse(email);

	if (!checkemail.success) {
		return badFormDataEntry;
	}

	// Check if the username/email is already used
	const existingUsername = await db
		.select()
		.from(tsUsers)
		.where(eq(tsUsers.username, username))
		.get();

	const existingEmail = await db
		.select()
		.from(tsUsers)
		.where(eq(tsUsers.email, checkemail.data))
		.get();

	if (existingUsername || existingEmail) {
		return badFormDataEntry;
	}

	// Create a new user
	const newUser = await createLocalUser(name, username, email, password);

	// Create a session
	const sessionToken = generateSessionToken();
	await createSession(sessionToken, newUser.id);
	setSessionTokenCookie(context, sessionToken, makeExpirationDate());

	return new Response();
};
