import { verifyPasswordStrength } from 'studiocms:auth/lib/password';
import { createUserSession } from 'studiocms:auth/lib/session';
import { createLocalUser, verifyUsernameInput } from 'studiocms:auth/lib/user';
import { sendVerificationEmail } from 'studiocms:auth/lib/verify-email';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { z } from 'astro/zod';
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

	// If the username is invalid, return an error
	const verifyUsernameResponse = verifyUsernameInput(username);
	if (verifyUsernameResponse !== true) {
		return badFormDataEntry('Invalid username', verifyUsernameResponse);
	}

	// If the password is invalid, return an error
	const verifyPasswordResponse = await verifyPasswordStrength(password);
	if (verifyPasswordResponse !== true) {
		return badFormDataEntry('Invalid password', verifyPasswordResponse);
	}

	// Get the email and display name from the form data
	const email = parseFormDataEntryToString(formData, 'email');
	const name = parseFormDataEntryToString(formData, 'displayname');

	// If the email or display name is missing, return an error
	if (!email) return badFormDataEntry('Missing entry', 'Email is required');
	if (!name) return badFormDataEntry('Missing entry', 'Display name is required');

	// If the email is invalid, return an error
	const checkEmail = z.coerce
		.string()
		.email({ message: 'Email address is invalid' })
		.safeParse(email);

	if (!checkEmail.success) return badFormDataEntry('Invalid email', checkEmail.error.message);

	const invalidEmailDomains: string[] = ['example.com', 'text.com', 'testing.com'];

	if (invalidEmailDomains.includes(checkEmail.data.split('@')[1])) {
		return badFormDataEntry('Invalid Email', 'Must be from a valid domain');
	}

	const { usernameSearch, emailSearch } =
		await studioCMS_SDK.AUTH.user.searchUsersForUsernameOrEmail(username, checkEmail.data);

	if (usernameSearch.length > 0)
		return badFormDataEntry('Invalid username', 'Username is already in use');
	if (emailSearch.length > 0) return badFormDataEntry('Invalid email', 'Email is already in use');

	// Create a new user
	const newUser = await createLocalUser(name, username, email, password);

	await sendVerificationEmail(newUser.id);

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
