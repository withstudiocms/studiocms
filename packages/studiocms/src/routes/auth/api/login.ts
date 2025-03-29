import { verifyPasswordHash } from 'studiocms:auth/lib/password';
import { createUserSession } from 'studiocms:auth/lib/session';
import { isEmailVerified } from 'studiocms:auth/lib/verify-email';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { badFormDataEntry, parseFormDataEntryToString } from './shared.js';

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
	const existingUser = await studioCMS_SDK.GET.databaseEntry.users.byUsername(username);

	// If the user does not exist, return an ambiguous error
	if (!existingUser) return badFormDataEntry('Invalid credentials', 'Invalid username');

	// Check if the user has a password or is using a oAuth login
	if (!existingUser.password)
		return badFormDataEntry('Incorrect method', 'User is using OAuth login');

	// Verify the password
	const validPassword = await verifyPasswordHash(existingUser.password, password);

	// If the password is invalid, return an error
	if (!validPassword) return badFormDataEntry('Invalid credentials', 'Invalid password');

	// Check if the user's email is verified (if the mailer is enabled)
	const isEmailAccountVerified = await isEmailVerified(existingUser);

	// If the email is not verified, return an error
	if (!isEmailAccountVerified) {
		return badFormDataEntry('Email not verified', 'Please verify your email before logging in');
	}

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
