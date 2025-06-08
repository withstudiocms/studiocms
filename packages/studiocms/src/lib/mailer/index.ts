import { eq } from 'astro:db';
import { logger as _logger, isVerbose } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import { asDrizzleTable } from '@astrojs/db/utils';
import { Effect, Layer } from 'effect';
import { CMSMailerConfigId } from '../../consts.js';
import { StudioCMSMailerConfig } from '../../db/tables.js';
import { type Mail, SMTPMailer, genLogger, pipeLogger } from '../effects/index.js';

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
		const sdk = yield* SDKCore;
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
						// @ts-expect-error drizzle broke the id variable...
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
				const result = yield* SMTP.verify();

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
			const { data } = yield* sdk.GET.siteConfig();
			const status = data?.enableMailer || false;

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
	dependencies: [SDKCore.Default, Logger.Layer, SMTPMailer.Default],
	accessors: true,
}) {
	static Provide = Effect.provide(this.Default);
}

/**
 * Gets the mailer configuration from the database.
 *
 * @deprecated
 * @returns A promise that resolves with the mailer configuration object.
 */
export const getMailerConfigTable = async (): Promise<tsMailer | undefined> => {
	const program = Effect.gen(function* () {
		const mailer = yield* Mailer;
		return yield* mailer.getMailerConfigTable;
	}).pipe(Effect.provide(Mailer.Default));

	return await Effect.runPromise(program);
};

/**
 * Updates the mailer configuration in the database.
 *
 * @deprecated
 * @param config - The new mailer configuration object.
 * @returns A promise that resolves when the mailer configuration has been updated.
 */
export const updateMailerConfigTable = async (config: tsMailerInsert): Promise<MailerResponse> => {
	const program = Effect.gen(function* () {
		const mailer = yield* Mailer;
		return yield* mailer.updateMailerConfigTable(config);
	}).pipe(Effect.provide(Mailer.Default));

	return await Effect.runPromise(program);
};

/**
 * Creates a new mailer configuration in the database.
 *
 * @deprecated
 * @param config - The mailer configuration object to create.
 * @returns A promise that resolves with the new mailer configuration object.
 */
export const createMailerConfigTable = async (
	config: tsMailerInsert
): Promise<tsMailer | MailerErrorResponse> => {
	const program = Effect.gen(function* () {
		const mailer = yield* Mailer;
		return yield* mailer.createMailerConfigTable(config);
	}).pipe(Effect.provide(Mailer.Default));

	return await Effect.runPromise(program);
};

/**
 * Sends an email using the provided mailer configuration and mail options.
 *
 * @param mailOptions - The options for the mail, including the subject and other message details.
 * @returns A promise that resolves with the result of the mail sending operation.
 * @throws Will throw an error if the mail sending operation fails.
 *
 * @deprecated
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
export async function sendMail(config: MailOptions): Promise<MailerResponse> {
	const program = Effect.gen(function* () {
		const mailer = yield* Mailer;
		return yield* mailer.sendMail(config);
	}).pipe(Effect.provide(Mailer.Default));

	return await Effect.runPromise(program);
}

/**
 * Verifies the mail connection using the provided transporter configuration.
 *
 * @returns A promise that resolves to an object containing either a success message or an error message.
 * @deprecated
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
export async function verifyMailConnection(): Promise<MailerResponse> {
	const program = Effect.gen(function* () {
		const mailer = yield* Mailer;
		return yield* mailer.verifyMailConnection;
	}).pipe(Effect.provide(Mailer.Default));

	return await Effect.runPromise(program);
}

/**
 * Checks if the mailer service is enabled in the StudioCMS configuration.
 *
 * This function retrieves the configuration from the StudioCMS SDK and
 * returns the value of the `enableMailer` property. If the configuration
 * is not available, it defaults to `false`.
 * @deprecated
 *
 * @returns {Promise<boolean>} A promise that resolves to `true` if the mailer
 * service is enabled, otherwise `false`.
 */
export async function isMailerEnabled(): Promise<boolean> {
	const program = Effect.gen(function* () {
		const mailer = yield* Mailer;
		return yield* mailer.isEnabled;
	}).pipe(Effect.provide(Mailer.Default));

	return await Effect.runPromise(program);
}
