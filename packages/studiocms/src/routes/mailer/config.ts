import { getUserData, verifyUserPermissionLevel } from 'studiocms:auth/lib/user';
import { apiResponseLogger } from 'studiocms:logger';
import { createMailerConfigTable, updateMailerConfigTable } from 'studiocms:mailer';
import type { APIContext, APIRoute } from 'astro';

export const POST: APIRoute = async (context: APIContext) => {
	// Get user data
	const userData = await getUserData(context);

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	// Check if user has permission
	const isAuthorized = await verifyUserPermissionLevel(userData, 'owner');
	if (!isAuthorized) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	// Get Json Data
	const smtpConfig: {
		port: number;
		host: string;
		secure: boolean;
		proxy: string | null;
		auth_user: string | null;
		auth_pass: string | null;
		tls_rejectUnauthorized: boolean | null;
		tls_servername: string | null;
		default_sender: string;
	} = await context.request.json();

	// Validate form data
	if (!smtpConfig.port) {
		return apiResponseLogger(400, 'Invalid form data, port is required');
	}

	if (!smtpConfig.host) {
		return apiResponseLogger(400, 'Invalid form data, host is required');
	}

	if (!smtpConfig.secure) {
		return apiResponseLogger(400, 'Invalid form data, secure is required');
	}

	if (!smtpConfig.default_sender) {
		return apiResponseLogger(400, 'Invalid form data, default_sender is required');
	}

	// Update Database
	try {
		await createMailerConfigTable(smtpConfig);

		return apiResponseLogger(200, 'Mailer config updated');
	} catch (error) {
		// Return Error Response
		return apiResponseLogger(500, 'Error updating mailer config', error);
	}
};

export const UPDATE: APIRoute = async (context: APIContext) => {
	// Get user data
	const userData = await getUserData(context);

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	// Check if user has permission
	const isAuthorized = await verifyUserPermissionLevel(userData, 'owner');
	if (!isAuthorized) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	// Get Json Data
	const smtpConfig: {
		port: number;
		host: string;
		secure: boolean;
		proxy: string | null;
		auth_user: string | null;
		auth_pass: string | null;
		tls_rejectUnauthorized: boolean | null;
		tls_servername: string | null;
		default_sender: string;
	} = await context.request.json();

	// Validate form data
	if (!smtpConfig.port) {
		return apiResponseLogger(400, 'Invalid form data, port is required');
	}

	if (!smtpConfig.host) {
		return apiResponseLogger(400, 'Invalid form data, host is required');
	}

	if (!smtpConfig.secure) {
		return apiResponseLogger(400, 'Invalid form data, secure is required');
	}

	if (!smtpConfig.default_sender) {
		return apiResponseLogger(400, 'Invalid form data, default_sender is required');
	}

	// Update Database
	try {
		await updateMailerConfigTable(smtpConfig);

		return apiResponseLogger(200, 'Mailer config updated');
	} catch (error) {
		// Return Error Response
		return apiResponseLogger(500, 'Error updating mailer config', error);
	}
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, POST, UPDATE',
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
