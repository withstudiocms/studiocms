import { apiResponseLogger } from 'studiocms:logger';
import { Mailer } from 'studiocms:mailer';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
	parseAPIContextJson,
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

export const { POST, PATCH, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('routes/mailer/config/POST')(function* () {
				const mailer = yield* Mailer;

				// Check if user is logged in
				if (!ctx.locals.StudioCMS.security?.userSessionData.isLoggedIn) {
					return apiResponseLogger(401, 'Authentication required');
				}

				// Check if user has permission
				if (!ctx.locals.StudioCMS.security?.userPermissionLevel.isOwner) {
					return apiResponseLogger(403, 'Forbidden');
				}

				// Get Json Data
				const smtpConfig = yield* parseAPIContextJson(ctx, SmtpConfigSchema);

				// Validate form data
				if (!Number.isInteger(smtpConfig.port) || smtpConfig.port < 1 || smtpConfig.port > 65535) {
					return apiResponseLogger(
						400,
						'Invalid form data, port must be an integer between 1 and 65535'
					);
				}

				if (typeof smtpConfig.host !== 'string' || smtpConfig.host.trim() === '') {
					return apiResponseLogger(400, 'Invalid form data, host is required');
				}

				if (typeof smtpConfig.secure !== 'boolean') {
					return apiResponseLogger(400, 'Invalid form data, secure must be a boolean');
				}

				if (
					typeof smtpConfig.default_sender !== 'string' ||
					smtpConfig.default_sender.trim() === ''
				) {
					return apiResponseLogger(400, 'Invalid form data, default_sender is required');
				}

				// Update Database
				const config = yield* mailer.createMailerConfigTable(smtpConfig);

				if (!config) {
					return apiResponseLogger(500, 'Error creating mailer config table');
				}
				return apiResponseLogger(200, 'Mailer config updated');
			}).pipe(Mailer.Provide),
		PATCH: (ctx) =>
			genLogger('routes/mailer/config/PATCH')(function* () {
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
				const smtpConfig = yield* parseAPIContextJson(ctx, SmtpConfigSchema);

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
			}).pipe(Mailer.Provide),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['POST', 'PATCH'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['POST', 'PATCH', 'OPTIONS'] },
		// biome-ignore lint/suspicious/noExplicitAny: allows for better error handling
		onError: (error: any) => {
			console.error('API Error:', error);
			const isClientError =
				error?.status === 400 ||
				error?.name === 'SyntaxError' ||
				error?._tag === 'ParseError' ||
				error?._tag === 'JSONParseError' ||
				(typeof error?.name === 'string' && error.name.includes('Schema'));
			return createJsonResponse(
				{ error: isClientError ? 'Invalid request body' : 'Internal Server Error' },
				{ status: isClientError ? 400 : 500 }
			);
		},
	}
);
