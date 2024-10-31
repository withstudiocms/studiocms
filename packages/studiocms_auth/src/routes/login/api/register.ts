import { db, eq } from 'astro:db';
import { verifyPasswordStrength } from 'studiocms:auth/lib/password';
import {
	createSession,
	generateSessionToken,
	makeExpirationDate,
	setSessionTokenCookie,
} from 'studiocms:auth/lib/session';
import { createLocalUser, verifyUsernameInput } from 'studiocms:auth/lib/user';
import { tsUsers } from '@studiocms/core/db/tsTables';
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
	if (!username || !password) {
		return badFormDataEntry('Username or password is missing');
	}

	// If the username is invalid, return an error
	if (verifyUsernameInput(username) !== true) {
		return badFormDataEntry(
			'Invalid Username: Username must be between 3 and 20 characters, only contain lowercase letters, numbers, -, and _ as well as not be a commonly used username (admin, root, etc.)'
		);
	}

	// If the password is invalid, return an error
	if ((await verifyPasswordStrength(password)) !== true) {
		return badFormDataEntry(
			'Invalid Password: Password must be between 6 and 255 characters, not be a known unsafe password, and not be in the pwned password database'
		);
	}

	// Get the email and display name from the form data
	const email = parseFormDataEntryToString(formData, 'email');
	const name = parseFormDataEntryToString(formData, 'displayname');

	// If the email or display name is missing, return an error
	if (!email || !name) {
		return badFormDataEntry('Email or display name is missing');
	}

	// If the email is invalid, return an error
	const checkemail = z.coerce
		.string()
		.email({ message: 'Email address is invalid' })
		.safeParse(email);

	if (!checkemail.success) {
		return badFormDataEntry(checkemail.error.message);
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
		return badFormDataEntry('Username or email is already in use');
	}

	// Create a new user
	const newUser = await createLocalUser(name, username, email, password);

	// Create a session
	const sessionToken = generateSessionToken();
	await createSession(sessionToken, newUser.id);
	setSessionTokenCookie(context, sessionToken, makeExpirationDate());

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
