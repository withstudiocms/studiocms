import { apiResponseLogger } from 'studiocms:logger';
import { Mailer } from 'studiocms:mailer';
import type { APIRoute } from 'astro';
import {
	AllResponse,
	defineAPIRoute,
	Effect,
	genLogger,
	OptionsResponse,
	Schema,
} from '../../../effect.js';

export class SmtpConfigSchema extends Schema.Class<SmtpConfigSchema>('SmtpConfigSchema')({
	port: Schema.Number,
	host: Schema.String,
	secure: Schema.Boolean,
	proxy: Schema.Union(Schema.String, Schema.Null),
	auth_user: Schema.Union(Schema.String, Schema.Null),
	auth_pass: Schema.Union(Schema.String, Schema.Null),
	tls_rejectUnauthorized: Schema.Union(Schema.Boolean, Schema.Null),
	tls_servername: Schema.Union(Schema.String, Schema.Null),
	default_sender: Schema.String,
}) {}

export const POST: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
		genLogger('routes/mailer/config/POST')(function* () {
			const mailer = yield* Mailer;

			// Check if user is logged in
			if (!ctx.locals.StudioCMS.security?.userSessionData.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Check if user has permission
			if (!ctx.locals.StudioCMS.security?.userPermissionLevel.isOwner) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Get Json Data
			const smtpConfig = yield* Effect.tryPromise(() => ctx.request.json()).pipe(
				Effect.flatMap(Schema.decodeUnknown(SmtpConfigSchema))
			);

			// Validate form data
			if (!smtpConfig.port) {
				return apiResponseLogger(400, 'Invalid form data, port is required');
			}

			if (!smtpConfig.host) {
				return apiResponseLogger(400, 'Invalid form data, host is required');
			}

			if (typeof smtpConfig.secure !== 'boolean') {
				return apiResponseLogger(400, 'Invalid form data, secure must be a boolean');
			}

			if (!smtpConfig.default_sender) {
				return apiResponseLogger(400, 'Invalid form data, default_sender is required');
			}

			// Update Database
			const config = yield* mailer.createMailerConfigTable(smtpConfig);

			if (!config) {
				return apiResponseLogger(500, 'Error creating mailer config table');
			}
			return apiResponseLogger(200, 'Mailer config updated');
		}).pipe(Mailer.Provide)
	).catch((error) => {
		return apiResponseLogger(500, `Error updating mailer config: ${error.message}`);
	});

export const UPDATE: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
		genLogger('routes/mailer/config/UPDATE')(function* () {
			const mailer = yield* Mailer;

			// Check if user is logged in
			if (!ctx.locals.StudioCMS.security?.userSessionData.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}
			// Check if user has permission
			if (!ctx.locals.StudioCMS.security?.userPermissionLevel.isOwner) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Get Json Data
			const smtpConfig = yield* Effect.tryPromise(() => ctx.request.json()).pipe(
				Effect.flatMap(Schema.decodeUnknown(SmtpConfigSchema))
			);

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
			const config = yield* mailer.updateMailerConfigTable(smtpConfig);
			if (!config) {
				return apiResponseLogger(500, 'Error updating mailer config table');
			}
			return apiResponseLogger(200, 'Mailer config updated');
		}).pipe(Mailer.Provide)
	).catch((error) => {
		return apiResponseLogger(500, `Error updating mailer config: ${error.message}`);
	});

export const OPTIONS: APIRoute = async () =>
	OptionsResponse({ allowedMethods: ['POST', 'UPDATE'] });

export const ALL: APIRoute = async () => AllResponse();
