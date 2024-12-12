import { db, eq } from 'astro:db';
import { verifyPasswordStrength } from 'studiocms:auth/lib/password';
import { createUserSession } from 'studiocms:auth/lib/session';
import { createLocalUser, verifyUsernameInput } from 'studiocms:auth/lib/user';
import { tsUsers } from '@studiocms/core/sdk-utils/tables';
import type { APIContext, APIRoute } from 'astro';
import { z } from 'astro/zod';
import { badFormDataEntry, parseFormDataEntryToString } from './shared';

export const POST: APIRoute = async (context: APIContext): Promise<Response> => {
	// Get the form data
	const formData = await context.request.formData();

	// Get the username and password from the form data
	const username = parseFormDataEntryToString(formData, 'username');
	const password = parseFormDataEntryToString(formData, 'password');

	// If the username or password is missing, return an error
	if (!username) return badFormDataEntry('Missing field', 'Username is required');
	if (!password) return badFormDataEntry('Missing field', 'Password is required');

	// If the username is invalid, return an error
	if (verifyUsernameInput(username) !== true) {
		return badFormDataEntry(
			'Invalid username',
			'Username must be between 3 and 20 characters, only contain lowercase letters, numbers, -, and _ as well as not be a commonly used username (admin, root, etc.)'
		);
	}

	// If the password is invalid, return an error
	if ((await verifyPasswordStrength(password)) !== true) {
		return badFormDataEntry(
			'Invalid password',
			'Password must be between 6 and 255 characters, and not be in the <a href="https://haveibeenpwned.com/Passwords" target="_blank">pwned password database</a>.'
		);
	}

	// Get the email and display name from the form data
	const email = parseFormDataEntryToString(formData, 'email');
	const name = parseFormDataEntryToString(formData, 'displayname');

	// If the email or display name is missing, return an error
	if (!email) return badFormDataEntry('Missing entry', 'Email is required');
	if (!name) return badFormDataEntry('Missing entry', 'Display name is required');

	// If the email is invalid, return an error
	const checkemail = z.coerce
		.string()
		.email({ message: 'Email address is invalid' })
		.safeParse(email);

	if (!checkemail.success) return badFormDataEntry('Invalid email', checkemail.error.message);

	// Check if the username or email is already used by another user
	const [usernameSearch, emailSearch] = await db.batch([
		db.select().from(tsUsers).where(eq(tsUsers.username, username)),
		db.select().from(tsUsers).where(eq(tsUsers.email, checkemail.data)),
	]);

	if (usernameSearch.length > 0)
		return badFormDataEntry('Invalid username', 'Username is already in use');
	if (emailSearch.length > 0) return badFormDataEntry('Invalid email', 'Email is already in use');

	// Create a new user
	const newUser = await createLocalUser(name, username, email, password);

	await createUserSession(newUser.id, context);

	return new Response();
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, POST',
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
