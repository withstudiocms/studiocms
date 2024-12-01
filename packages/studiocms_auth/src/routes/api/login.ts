import { db, eq } from 'astro:db';
import { verifyPasswordHash } from 'studiocms:auth/lib/password';
import { createUserSession } from 'studiocms:auth/lib/session';
import { tsUsers } from '@studiocms/core/db/tsTables';
import type { APIContext, APIRoute } from 'astro';
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

	// Get the user from the database
	const existingUser = await db.select().from(tsUsers).where(eq(tsUsers.username, username)).get();

	// If the user does not exist, return an ambiguous error
	if (!existingUser) return badFormDataEntry('Invalid credentials', 'Invalid username or password');

	// Check if the user has a password or is using a oAuth login
	if (!existingUser.password) return badFormDataEntry('Incorrect method', 'User is using OAuth login');

	// Verify the password
	const validPassword = await verifyPasswordHash(existingUser.password, password);

	// If the password is invalid, return an error
	if (!validPassword) return badFormDataEntry('Invalid credentials', 'Invalid username or password');

	await createUserSession(existingUser.id, context);

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
