import { db, eq } from 'astro:db';
import { asDrizzleTable } from '@astrojs/db/utils';
import { SMTPService, SMTPTransportConfig, TransportConfig } from '@withstudiocms/effect/smtp';
import type Mail from 'nodemailer/lib/mailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import { CMSMailerConfigId } from '../../consts.js';
import { StudioCMSMailerConfig } from '../../db/tables.js';
import { Data, Effect, genLogger, Layer, pipeLogger } from '../../effect.js';

export type { Mail };

/**
 * Converts a null value to undefined.
 *
 * @param value - The value to convert.
 * @returns The value if it is not null, otherwise undefined.
 */
function nullToUndefined<T>(value: T | null): T | undefined {
	return value === null ? undefined : value;
}

/**
 * TypeSafe Table definition for use in StudioCMS Integrations
 */
export const tsMailerConfig = asDrizzleTable('StudioCMSMailerConfig', StudioCMSMailerConfig);

/**
 * TypeSafe Table definition for use in StudioCMS Integrations
 */
export type tsMailer = typeof tsMailerConfig.$inferSelect;

/**
 * TypeSafe Table definition for use in StudioCMS Integrations
 */
export type tsMailerInsert = Omit<typeof tsMailerConfig.$inferInsert, 'id'>;

/**
 * Represents an error specific to SMTP operations.
 *
 * This class extends `Data.TaggedError` to provide a tagged error type
 * with additional context about the error. The context includes an
 * `error` property, which can be an instance of `Error` or any other
 * unknown value.
 *
 * @extends {Data.TaggedError}
 * @template {Error | unknown} T - The type of the error context.
 */
export class SMTPError extends Data.TaggedError('SMTPError')<{ error: Error | unknown }> {}

const convertTransporterConfig = (config: tsMailer) =>
	pipeLogger('studiocms/lib/effects/smtp/convertTransporterConfig')(
		Effect.try(() => {
			// Extract the required fields from the configuration object
			const {
				host,
				port,
				secure,
				proxy,
				auth_user,
				auth_pass,
				tls_rejectUnauthorized,
				tls_servername,
				default_sender,
			} = config;

			// Return the transporter configuration object
			return TransportConfig({
				transport: {
					host,
					port,
					secure,
					auth: {
						user: nullToUndefined(auth_user),
						pass: nullToUndefined(auth_pass),
					},
					proxy: nullToUndefined(proxy),
					tls:
						tls_rejectUnauthorized || tls_servername
							? {
									rejectUnauthorized: nullToUndefined(tls_rejectUnauthorized),
									servername: nullToUndefined(tls_servername),
								}
							: undefined,
				},
				defaults: {
					from: default_sender,
				},
			});
		})
	);

const buildTransporterConfig = genLogger('studiocms/lib/effects/smtp/buildTransporterConfig')(
	function* () {
		const configTable = yield* Effect.tryPromise(() =>
			db.select().from(tsMailerConfig).where(eq(tsMailerConfig.id, CMSMailerConfigId)).get()
		);

		// If the mailer configuration is not found, return an Empty config
		if (!configTable) {
			return TransportConfig({
				transport: {},
				defaults: {},
			});
		}

		return yield* convertTransporterConfig(configTable);
	}
);

export type SMTPMailerReturn = {
	getVersionString: () => Effect.Effect<string, Error, never>;
	isIdle: () => Effect.Effect<boolean, Error, never>;
	sendMail: (
		mailOptions: Mail.Options
	) => Effect.Effect<SMTPTransport.SentMessageInfo, Error, never>;
	verifyTransport: () => Effect.Effect<true, Error, never>;
};

/**
 * SMTPMailer service for sending emails.
 *
 * This service provides methods to send emails using the SMTP protocol.
 * It uses the configuration provided by the SMTPTransportConfig context.
 *
 * @extends Effect.Service
 * @template {SMTPMailer} - The type of the service.
 */
export class SMTPMailer extends Effect.Service<SMTPMailer>()(
	'studiocms/lib/effects/smtp/SMTPMailer',
	{
		effect: genLogger('studiocms/lib/effects/smtp/SMTPMailer.effect')(function* () {
			const config = yield* buildTransporterConfig;

			const { getVersionString, isIdle, sendMail, verifyTransport }: SMTPMailerReturn =
				yield* SMTPService.pipe(
					Effect.provide(Layer.provide(SMTPService.Default, SMTPTransportConfig.makeLive(config)))
				);

			return { verifyTransport, sendMail, isIdle, getVersionString };
		}),
	}
) {}
