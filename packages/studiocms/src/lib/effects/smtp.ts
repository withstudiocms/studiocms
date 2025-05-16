import { eq } from 'astro:db';
import { SDKCoreJs } from 'studiocms:sdk';
import { asDrizzleTable } from '@astrojs/db/utils';
import { Data, Effect, Schema, pipe } from 'effect';
import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import socks from 'socks';
import { CMSMailerConfigId } from '../../consts.js';
import { StudioCMSMailerConfig } from '../../db/tables.js';
import { errorTap, genLogger, pipeLogger } from './logger.js';
import { MailerConfig, TransporterConfig } from './smtp.config.js';

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

/**
 * Gets the mailer configuration from the database.
 *
 * @returns A promise that resolves with the mailer configuration object.
 */
const getMailerConfigTable = pipeLogger('studiocms/lib/effects/smtp/getMailerConfigTable')(
	SDKCoreJs.dbService.execute((db) =>
		db.select().from(tsMailerConfig).where(eq(tsMailerConfig.id, CMSMailerConfigId)).get()
	)
);

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

			// Create the transporter configuration object
			const transporterConfig = new TransporterConfig({
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
			});

			// Return the transporter configuration object
			return new MailerConfig({
				transporter: transporterConfig,
				defaults: { sender: default_sender, from: default_sender },
			});
		})
	);

const buildTransporterConfig = genLogger('studiocms/lib/effects/smtp/buildTransporterConfig')(
	function* () {
		const configTable = yield* getMailerConfigTable;
		// If the mailer configuration is not found, throw an
		// error indicating that the configuration is missing
		if (!configTable) {
			return yield* Effect.fail(
				new Error(
					'Mailer configuration not found, please configure the mailer first using the StudioCMS dashboard'
				)
			);
		}

		return yield* convertTransporterConfig(configTable);
	}
);

/**
 * SMTPMailer is a service that provides functionality for sending emails and verifying SMTP connections.
 * It uses the `nodemailer` library to handle email transport and supports additional configurations
 * such as proxy settings for SOCKS proxies.
 *
 * ### Methods
 *
 * #### `sendMail(mailOptions: Mail.Options): Effect.Effect<SMTPTransport.SentMessageInfo, SMTPError, never>`
 * Sends an email using the provided mail options.
 *
 * - **Parameters:**
 *   - `mailOptions`: The options for the email to be sent, including recipients, subject, and content.
 * - **Returns:** An `Effect` that resolves with the sent message information (`SMTPTransport.SentMessageInfo`)
 *   on success or fails with an `SMTPError` on error.
 *
 * This method uses an asynchronous effect to handle the email sending process. If an error occurs during
 * the sending process, it wraps the error in an `SMTPError` and fails the effect. Otherwise, it succeeds
 * with the information about the sent message.
 *
 * #### `verify(): Effect.Effect<true, SMTPError, never>`
 * Verifies the SMTP connection asynchronously.
 *
 * - **Returns:** An `Effect` that resolves to `true` on success or fails with an `SMTPError` on error.
 *
 * This method wraps the `verify` method of the `nodemailer` transporter and converts its callback-based
 * implementation into an Effect. It resumes with a success or failure Effect based on the result of the verification.
 *
 * ### Static Methods
 *
 * #### `Live(opts: SMTPOptionsBase): Layer`
 * Creates a live instance of the `SMTPMailer` service with the provided SMTP options.
 *
 * - **Parameters:**
 *   - `opts`: The base options for configuring the SMTP connection.
 * - **Returns:** A `Layer` that provides the `SMTPMailer` service.
 *
 * This method uses the default configuration and provides the `SMTPOptions` to the service.
 */
export class SMTPMailer extends Effect.Service<SMTPMailer>()(
	'studiocms/lib/effects/smtp/SMTPMailer',
	{
		effect: genLogger('studiocms/lib/effects/smtp/SMTPMailer.effect')(function* () {
			const { transporter: __transporter, defaults } = yield* buildTransporterConfig;
			const MailTransporter = yield* pipeLogger(
				'studiocms/lib/effects/smtp/SMTPMailer.transporter'
			)(
				Effect.try({
					try: () =>
						nodemailer.createTransport(
							__transporter as SMTPTransport.Options,
							defaults as SMTPTransport.Options
						),
					catch: (error) => new SMTPError({ error }),
				})
			);

			// If the proxy is a socks proxy, set the socks module
			if (__transporter.proxy?.startsWith('socks')) {
				MailTransporter.set('proxy_socks_module', socks);
				MailTransporter.setupProxy(__transporter.proxy);
			}

			const {
				options: _options,
				meta: _meta,
				dkim: _dkim,
				transporter: _transporter,
				MailMessage: _MailMessage,
				close: _close,
				isIdle: _isIdle,
				verify: _verify,
				use: _use,
				sendMail: _sendMail,
				getVersionString: _getVersionString,
				setupProxy: _setupProxy,
			} = MailTransporter;

			const options = Effect.succeed(_options);
			const meta = Effect.succeed(_meta);
			const dkim = Effect.succeed(_dkim);
			const transporter = Effect.succeed(_transporter);
			/** Usage: typeof transporter.MailMessage */
			const MailMessage = Effect.succeed(_MailMessage);

			/** Closes all connections in the pool. If there is a message being sent, the connection is closed later */
			const close = pipeLogger('studiocms/lib/effects/smtp/SMTPMailer.close')(
				Effect.try({
					try: () => _close(),
					catch: (error) => new SMTPError({ error }),
				})
			);

			/** Returns true if there are free slots in the queue */
			const isIdle = pipeLogger('studiocms/lib/effects/smtp/SMTPMailer.isIdle')(
				Effect.try({
					try: () => _isIdle(),
					catch: (error) => new SMTPError({ error }),
				})
			);

			/**
			 * Verifies the SMTP connection asynchronously.
			 *
			 * This function wraps the `verify` method and converts its callback-based
			 * implementation into an Effect. It resumes with a success or failure Effect
			 * based on the result of the verification.
			 *
			 * @returns An `Effect` that resolves to `true` on success or fails with an `SMTPError` on error.
			 */
			const verify = (): Effect.Effect<true, SMTPError, never> =>
				pipeLogger('studiocms/lib/effects/smtp/SMTPMailer.verify')(
					Effect.async<true, SMTPError>((resume) => {
						_verify((error, success) => {
							if (error) {
								const toFail = new SMTPError({ error });
								resume(errorTap(Effect.fail(toFail), toFail));
							} else {
								resume(Effect.succeed(success));
							}
						});
					})
				);

			/**
			 * A utility function to safely apply a mail plugin function within an effect.
			 * It wraps the plugin execution in a try-catch block to handle errors gracefully.
			 *
			 * @param step - A string representing the current step or context for the plugin.
			 * @param plugin - The mail plugin function to be executed.
			 * @returns An `Effect` that attempts to execute the plugin and catches any errors,
			 *          wrapping them in an `SMTPError` instance.
			 */
			const use = (step: string, plugin: Mail.PluginFunction) =>
				pipeLogger('studiocms/lib/effects/smtp/SMTPMailer.use')(
					Effect.try({
						try: () => _use(step, plugin),
						catch: (error) => new SMTPError({ error }),
					})
				);

			/**
			 * Sends an email using the provided mail options.
			 *
			 * @param mailOptions - The options for the email to be sent, including recipients, subject, and content.
			 * @returns An `Effect` that resolves with the sent message information (`SMTPTransport.SentMessageInfo`)
			 *          on success or fails with an `SMTPError` on error.
			 *
			 * The function uses an asynchronous effect to handle the email sending process. If an error occurs during
			 * the sending process, it wraps the error in an `SMTPError` and fails the effect. Otherwise, it succeeds
			 * with the information about the sent message.
			 */
			const sendMail = (
				mailOptions: Mail.Options
			): Effect.Effect<SMTPTransport.SentMessageInfo, SMTPError, never> =>
				pipeLogger('studiocms/lib/effects/smtp/SMTPMailer.sendMail')(
					Effect.async<SMTPTransport.SentMessageInfo, SMTPError>((resume) => {
						const send = _sendMail(mailOptions, (error, info) => {
							if (error) {
								const toFail = new SMTPError({ error });
								resume(errorTap(Effect.fail(toFail), toFail));
							} else {
								resume(Effect.succeed(info));
							}
						});
						() => {
							try {
								send;
							} catch {}
						};
					})
				);

			/**
			 * An effect that attempts to retrieve the version string by invoking the `_getVersionString` function.
			 * If an error occurs during the operation, it catches the error and wraps it in an `SMTPError` instance.
			 *
			 * @constant
			 * @throws {SMTPError} If an error occurs while retrieving the version string.
			 */
			const getVersionString = pipeLogger('studiocms/lib/effects/smtp/SMTPMailer.getVersionString')(
				Effect.try({
					try: () => _getVersionString(),
					catch: (error) => new SMTPError({ error }),
				})
			);

			/**
			 * Sets up a proxy for SMTP communication.
			 *
			 * This function wraps the `_setupProxy` function in an `Effect.try` block to handle
			 * potential errors gracefully. If an error occurs during the setup, it will be
			 * caught and wrapped in an `SMTPError` instance.
			 *
			 * @param proxyUrl - The URL of the proxy to be set up.
			 * @returns An `Effect` that attempts to set up the proxy and handles any errors.
			 */
			const setupProxy = (proxyUrl: string) =>
				pipeLogger('studiocms/lib/effects/smtp/SMTPMailer.setupProxy')(
					Effect.try({
						try: () => _setupProxy(proxyUrl),
						catch: (error) => new SMTPError({ error }),
					})
				);

			return {
				options,
				meta,
				dkim,
				transporter,
				MailMessage,
				close,
				isIdle,
				verify,
				use,
				sendMail,
				getVersionString,
				setupProxy,
			};
		}),
	}
) {
	/**
	 * Creates a live SMTP layer by combining the default SMTP configuration
	 * with the provided options.
	 *
	 * @param opts - The SMTP options to configure the live layer.
	 * @returns A new SMTP layer with the provided options applied.
	 */
	static Live = () => pipe(this.Default);
}
