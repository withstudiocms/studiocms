import { verifyPasswordStrength } from 'studiocms:auth/lib/password';
import { createLocalUser, verifyUsernameInput } from 'studiocms:auth/lib/user';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { z } from 'astro/zod';

export const POST: APIRoute = async (context: APIContext) => {
	const reqData = await context.request.json();

	const { username, displayname, email, password, confirmPassword } = reqData;

	if (!username) {
		return new Response(
			JSON.stringify({
				error: 'Username is required',
			}),
			{
				status: 400,
			}
		);
	}

	if (!displayname) {
		return new Response(
			JSON.stringify({
				error: 'Display name is required',
			}),
			{
				status: 400,
			}
		);
	}

	if (!email) {
		return new Response(
			JSON.stringify({
				error: 'Email is required',
			}),
			{
				status: 400,
			}
		);
	}

	if (!password) {
		return new Response(
			JSON.stringify({
				error: 'Password is required',
			}),
			{
				status: 400,
			}
		);
	}

	if (!confirmPassword) {
		return new Response(
			JSON.stringify({
				error: 'Confirm password is required',
			}),
			{
				status: 400,
			}
		);
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
	if (verifyUsernameInput(username) !== true) {
		return new Response(
			JSON.stringify({
				error:
					'Invalid username: Username must be between 3 and 20 characters, only contain lowercase letters, numbers, -, and _ as well as not be a commonly used username (admin, root, etc.)',
			}),
			{
				status: 400,
			}
		);
	}

	// If the password is invalid, return an error
	if ((await verifyPasswordStrength(password)) !== true) {
		return new Response(
			JSON.stringify({
				error:
					'Invalid password: Password must be between 6 and 255 characters, and not be in the <a href="https://haveibeenpwned.com/Passwords" target="_blank">pwned password database</a>.',
			}),
			{
				status: 400,
			}
		);
	}

	// If the email is invalid, return an error
	const checkEmail = z.coerce
		.string()
		.email({ message: 'Email address is invalid' })
		.safeParse(email);

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

	const newUser = await createLocalUser(displayname, username, email, password);

	await studioCMS_SDK.POST.databaseEntry.permissions(newUser.id, 'owner');

	return new Response(JSON.stringify({ message: 'Success' }), {
		status: 200,
	});
};
