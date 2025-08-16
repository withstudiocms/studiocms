import { eq } from 'astro:db';
import { logger as _logger, isVerbose } from 'studiocms:logger';
import { SDKCoreJs as sdk } from 'studiocms:sdk';
import { CMSMailerConfigId } from '../../consts.js';
import { tsMailerConfig } from '../../db/config.js';
import { Effect, genLogger, Layer, pipeLogger } from '../../effect.js';
import { type Mail, SMTPMailer } from '../effects/smtp.js';

/**
 * TypeSafe Table definition for use in StudioCMS Integrations
 */
export type tsMailer = typeof tsMailerConfig.$inferSelect;

/**
 * TypeSafe Table definition for use in StudioCMS Integrations
 */
export type tsMailerInsert = Omit<typeof tsMailerConfig.$inferInsert, 'id'>;

/**
 * Interface representing the options for sending an email.
 */
export interface MailOptions {
	/**
	 * The recipient(s) of the email. Can be a single email address or an array of email addresses.
	 */
	to: string | string[];

	/**
	 * The subject of the email.
	 */
	subject: string;

	/**
	 * The plain text content of the email. Optional.
	 */
	text?: string | undefined;

	/**
	 * The HTML content of the email. Optional.
	 */
	html?: string | undefined;
}

/**
 * Interface representing an error response from the mailer.
 */
export interface MailerErrorResponse {
	error: string;
}

/**
 * Interface representing a success response from the mailer.
 */
export interface MailerSuccessResponse {
	message: string;
}

/**
 * Interface representing the response from a mail verification operation.
 */
export type MailerResponse = MailerSuccessResponse | MailerErrorResponse;

const forked = _logger.fork('studiocms:runtime/mailer');
export const makeLogger = Effect.succeed(forked);

export class Logger extends Effect.Tag('studiocms/lib/mailer/Logger')<
	Logger,
	Effect.Effect.Success<typeof makeLogger>
>() {
	static Live = makeLogger;
	static Layer = Layer.scoped(this, this.Live);
}

export class Mailer extends Effect.Service<Mailer>()('studiocms/lib/mailer/Mailer', {
	effect: genLogger('studiocms/lib/mailer/Mailer.effect')(function* () {
		const logger = yield* Logger;
		const SMTP = yield* SMTPMailer;

		/**
		 * Logs the response from the mailer.
		 *
		 * @param data - The response from the mailer.
		 * @returns The response from the mailer.
		 */
		const mailerResponse = (data: MailerResponse) => {
			if ('error' in data) {
				logger.error(data.error);
				return data;
			}
			isVerbose && logger.info(data.message);
			return data;
		};

		/**
		 * Gets the mailer configuration from the database.
		 *
		 * @returns A promise that resolves with the mailer configuration object.
		 */
		const getMailerConfigTable = pipeLogger('studiocms/lib/mailer/Mailer.getMailerConfigTable')(
			sdk.dbService.execute((db) =>
				db.select().from(tsMailerConfig).where(eq(tsMailerConfig.id, CMSMailerConfigId)).get()
			)
		);

		/**
		 * Updates the mailer configuration in the database.
		 *
		 * @param config - The new mailer configuration object.
		 * @returns A promise that resolves when the mailer configuration has been updated.
		 */
		const updateMailerConfigTable = (config: tsMailerInsert) =>
			genLogger('studiocms/lib/mailer/Mailer.updateMailerConfigTable')(function* () {
				yield* sdk.dbService
					.execute((db) =>
						db.update(tsMailerConfig).set(config).where(eq(tsMailerConfig.id, CMSMailerConfigId))
					)
					.pipe(
						Effect.catchAll((e) =>
							Effect.succeed(
								mailerResponse({ error: `Error updating mailer configuration: ${String(e)}` })
							)
						)
					);
				return mailerResponse({ message: 'Mailer configuration updated successfully' });
			});

		const createMailerConfigTable = (config: tsMailerInsert) =>
			pipeLogger('studiocms/lib/mailer/Mailer.createMailerConfigTable')(
				sdk.dbService.execute((db) =>
					db
						.insert(tsMailerConfig)
						.values({ ...config, id: CMSMailerConfigId })
						.onConflictDoUpdate({
							target: tsMailerConfig.id,
							set: config,
							where: eq(tsMailerConfig.id, CMSMailerConfigId),
						})
						.returning()
						.get()
				)
			);

		/**
		 * Sends an email using the provided mailer configuration and mail options.
		 *
		 * @param mailOptions - The options for the mail, including the subject and other message details.
		 * @returns A promise that resolves with the result of the mail sending operation.
		 * @throws Will throw an error if the mail sending operation fails.
		 *
		 * @example
		 * ```typescript
		 * const mailOptions = {
		 *   subject: 'Test Email',
		 *   to: 'recipient@example.com',
		 *   text: 'This is a test email.'
		 * };
		 *
		 * sendMail(mailerConfig, mailOptions)
		 *   .then(result => console.log('Email sent:', result))
		 *   .catch(error => console.error('Error sending email:', error));
		 * ```
		 */
		const sendMail = ({ subject, ...message }: MailOptions) =>
			genLogger('studiocms/lib/mailer/Mailer.sendMail')(function* () {
				// Create the mail options object
				const toSend: Mail.Options = { subject };

				// Set the to field in the mail options
				toSend.to = Array.isArray(message.to) ? message.to.join(', ') : message.to;

				// If the message has a text field and no html field, set the text field in the mail options
				if (message.text && !message.html) {
					toSend.text = message.text;
				}

				// If the message has an html field, set the html field in the mail options
				if (message.html) {
					toSend.html = message.html;
				}

				const result = yield* SMTP.sendMail(toSend);

				return mailerResponse({ message: `Message sent: ${result.messageId}` });
			});

		/**
		 * Verifies the mail connection using the provided transporter configuration.
		 *
		 * @returns A promise that resolves to an object containing either a success message or an error message.
		 *
		 * @example
		 * ```typescript
		 * const result = await verifyMailConnection();
		 * if ('message' in result) {
		 *   console.log(result.message);
		 * } else {
		 *   console.error(result.error);
		 * }
		 * ```
		 */
		const verifyMailConnection = genLogger('studiocms/lib/mailer/Mailer.verifyMailConnection')(
			function* () {
				const result = yield* SMTP.verifyTransport();

				// If the result is not true, log an error and return an error message
				if (result !== true) {
					return mailerResponse({ error: 'Mail connection verification failed' });
				}

				// Log a success message and return a success message
				return mailerResponse({ message: 'Mail connection verified successfully' });
			}
		);

		/**
		 * Checks if the mailer service is enabled in the StudioCMS configuration.
		 *
		 * This function retrieves the configuration from the StudioCMS SDK and
		 * returns the value of the `enableMailer` property. If the configuration
		 * is not available, it defaults to `false`.
		 */
		const isEnabled = genLogger('studiocms/lib/mailer/Mailer.isEnabled')(function* () {
			const config = yield* sdk.GET.siteConfig();
			const status = config?.data?.enableMailer || false;

			return status;
		});

		return {
			getMailerConfigTable,
			updateMailerConfigTable,
			createMailerConfigTable,
			sendMail,
			verifyMailConnection,
			isEnabled,
		};
	}),
	dependencies: [Logger.Layer, SMTPMailer.Default],
	accessors: true,
}) {
	static Provide = Effect.provide(this.Default);
}
