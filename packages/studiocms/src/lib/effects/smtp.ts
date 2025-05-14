import { Brand, Context, Data, Effect, Layer, pipe } from 'effect';
import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import socks from 'socks';
import { errorTap, genLogger, pipeLogger } from './logger.js';

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
 * Represents the base options for configuring an SMTP (Simple Mail Transfer Protocol) connection.
 *
 * @property transport - Specifies the SMTP transport configuration. This can either be an instance of `SMTPTransport`
 * or an object containing transport options.
 * @property defaults - Defines default options for the SMTP transport, such as default sender address or other
 * email-related settings.
 * @property proxy - Indicates whether a proxy should be used for the SMTP connection. Defaults to `false` if not specified.
 */
export type SMTPOptionsBase = {
	transport?: SMTPTransport | SMTPTransport.Options;
	defaults?: SMTPTransport.Options;
	proxy?: boolean;
};

/**
 * Represents the complete set of SMTP options, combining the base options
 * with a branded type to ensure type safety and distinguish it from other types.
 *
 * @extends {SMTPOptionsBase}
 * @see Brand.Brand
 */
export type SMTPOptionsComplete = SMTPOptionsBase & Brand.Brand<'SMTPOptionsComplete'>;

/**
 * A branded type representing complete SMTP options.
 * This is used to ensure type safety by leveraging TypeScript's nominal typing.
 * The `Brand.nominal` utility creates a unique type that cannot be confused with other types.
 *
 * @remarks
 * This type is part of the SMTP effects module and is used to enforce stricter typing
 * for SMTP configuration options.
 *
 * @see Brand.nominal
 */
export const SMTPOptionsComplete = Brand.nominal<SMTPOptionsComplete>();

/**
 * Represents the SMTP options configuration used within the application.
 * This class extends a tagged context to provide a strongly-typed layer
 * for managing SMTP-related options.
 *
 * @template SMTPOptions - The base type for SMTP options.
 * @template SMTPOptionsComplete - The complete type for SMTP options.
 *
 * @method make
 * Creates a new layer containing the SMTP options.
 *
 * @param opts - The base SMTP options to be completed.
 * @returns A layer containing the completed SMTP options.
 */
export class SMTPOptions extends Context.Tag('studiocms/lib/effects/smtp/SMTPOptions')<
	SMTPOptions,
	SMTPOptionsComplete
>() {
	static make = (opts: SMTPOptionsBase) => Layer.succeed(this, this.of(SMTPOptionsComplete(opts)));
}

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
			const { transport, defaults, proxy } = yield* SMTPOptions;
			const transporter = yield* pipeLogger('studiocms/lib/effects/smtp/SMTPMailer.transporter')(
				Effect.try({
					try: () => nodemailer.createTransport(transport, defaults),
					catch: (error) => new SMTPError({ error }),
				})
			);

			// If the proxy is a socks proxy, set the socks module
			if (proxy) {
				transporter.set('proxy_socks_module', socks);
			}

			const { verify: _verify, sendMail: _sendMail } = transporter;

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
						_sendMail(mailOptions, (error, info) => {
							if (error) {
								const toFail = new SMTPError({ error });
								resume(errorTap(Effect.fail(toFail), toFail));
							} else {
								resume(Effect.succeed(info));
							}
						});
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

			return {
				sendMail,
				verify,
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
	static Live = (opts: SMTPOptionsBase) =>
		pipe(this.Default, Layer.provide(SMTPOptions.make(opts)));
}
