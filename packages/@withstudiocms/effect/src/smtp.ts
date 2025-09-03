import _nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import socks from 'socks';
import { Brand, Context, Effect, Layer } from './effect.js';

export type { Mail, SMTPTransport };

/**
 * Custom Transport interface for nodemailer that extends the SMTPTransport.Options to
 * include an optional proxy configuration.
 */
export interface Transport extends SMTPTransport.Options {
	proxy?: string;
}

/**
 * Configuration interface for the mail transporter.
 *
 * This interface defines the structure for configuring the mail transporter,
 * including options for the SMTP server, authentication, and TLS settings.
 * @interface TransportConfig
 * @property {Transport} [transport] - The transport options for the mail transporter.
 * @property {SMTPTransport.Options} [defaults] - Default options for the mail transporter.
 * Note: Proxy configuration is specified on `transport.proxy`.
 */
export type TransportConfig = {
	transport?: Transport;
	defaults?: SMTPTransport.Options;
} & Brand.Brand<'TransportConfig'>;

/**
 * Nominal type for TransportConfig to ensure type safety and prevent accidental misuse.
 * @remarks
 * The `Brand.nominal` utility is used to create a unique type that cannot be
 * accidentally substituted with other types, even if they have the same structure.
 * @example
 * ```typescript
 * const config: TransportConfig = {
 *   transport: {
 *     host: 'smtp.example.com',
 *     port: 587,
 *     secure: false,
 *     auth: {
 *       user: 'user',
 *       pass: 'pass'
 *     }
 *   }
 * };
 *
 * // This ensures that the config variable is treated as a TransportConfig type,
 * // preventing accidental assignment of incompatible types.
 * const transportConfig: TransportConfig = TransportConfig(config);
 * ```
 */
export const TransportConfig = Brand.nominal<TransportConfig>();

/**
 * Converts a TransportConfig object into a format suitable for nodemailer.
 *
 * This function extracts the transport options and proxy configuration from the provided
 * TransportConfig and returns an object that can be used to create a nodemailer transport.
 *
 * @param config - The TransportConfig object containing transport and defaults.
 * @returns An object with transport options, defaults, and proxy configuration.
 */
const convertTransporterConfig = Effect.fn((config: TransportConfig) =>
	Effect.try({
		try: () => {
			const { transport, defaults } = config;

			let transportOptions: SMTPTransport.Options | undefined;
			let proxyConfig: string | undefined;

			if (transport) {
				const { proxy, ...rest } = transport;
				transportOptions = rest as SMTPTransport.Options;
				proxyConfig = proxy;
			}
			return {
				proxy: proxyConfig,
				transport: transportOptions,
				defaults: defaults || undefined,
			};
		},
		catch: (cause) =>
			new Error(
				`Failed to convert TransportConfig: ${cause instanceof Error ? cause.message : String(cause)}`
			),
	})
);

/**
 * A context tag for SMTP transport configuration, extending the base Context.Tag
 * with the specific identifier 'SMTPTransportConfig'. This class is used to
 * provide and manage SMTP transport configuration within the application's context.
 *
 * @template SMTPTransportConfig - The type representing the SMTP transport config context.
 * @template TransportConfig - The type representing the SMTP transport configuration.
 *
 * @example
 * ```typescript
 * const smtpLayer = SMTPTransportConfig.makeLive({
 *   host: 'smtp.example.com',
 *   port: 587,
 *   secure: false,
 *   auth: { user: 'user', pass: 'pass' }
 * });
 * ```
 */
export class SMTPTransportConfig extends Context.Tag('SMTPTransportConfig')<
	SMTPTransportConfig,
	TransportConfig
>() {
	static makeLive(config: TransportConfig) {
		return Layer.succeed(SMTPTransportConfig, SMTPTransportConfig.of(TransportConfig(config)));
	}
}

/**
 * The `SMTPService` provides an Effect-based abstraction for sending emails using SMTP via nodemailer.
 *
 * This service is responsible for:
 * - Creating and configuring a nodemailer transport instance with support for proxies.
 * - Exposing a `Mailer` function to run user-defined operations with the configured mailer.
 * - Verifying the SMTP transport configuration.
 * - Sending emails using the configured SMTP transport.
 * - Checking if the SMTP transport is idle.
 * - Retrieving the version string of the SMTP transport.
 *
 * All operations are wrapped in Effect for composability and error handling.
 *
 * @remarks
 * This service expects an `SMTPTransportConfig` to be available in the Effect context.
 *
 * @example
 * ```typescript
 * const result = Effect.runPromise(
 *   SMTPService.sendMail({ to: "user@example.com", subject: "Hello", text: "Hi!" })
 * );
 * ```
 */
export class SMTPService extends Effect.Service<SMTPService>()('SMTPService', {
	effect: Effect.gen(function* () {
		//// Internal functions to handle nodemailer and SMTP transport creation

		/**
		 * Creates a nodemailer transport instance with the provided configuration.
		 */
		const nodemailer = Effect.fn(<T>(fn: (mailer: typeof _nodemailer) => T) =>
			Effect.try({
				try: () => fn(_nodemailer),
				// If an error occurs, we throw a new Error with a custom message.
				// This is useful for debugging and understanding where the error originated.
				// The cause is checked to see if it's an instance of Error, and if so,
				// we use its message; otherwise, we convert it to a string.
				catch: (cause) =>
					new Error(
						`Failed to run nodemailer function: ${cause instanceof Error ? cause.message : String(cause)}`
					),
			})
		);

		/**
		 * Creates a nodemailer transport instance with the provided options.
		 *
		 * @param transport - The transport options or instance to use.
		 * @param defaults - Default options for the transport.
		 * @param proxy - Optional proxy URL to use for the connection.
		 * @returns A promise that resolves with the created transport instance.
		 */
		const createTransport = Effect.fn(function* (rawMailerConfig: TransportConfig) {
			// Convert the raw configuration into a format suitable for nodemailer
			const { transport, defaults, proxy } = yield* convertTransporterConfig(rawMailerConfig);

			const transportInstance = yield* nodemailer((mailer) =>
				mailer.createTransport(transport, defaults)
			);

			if (proxy?.startsWith('socks')) {
				// If a proxy is provided, we need to set it up for the transport.
				transportInstance.set('proxy_socks_module', socks);
				transportInstance.setupProxy(proxy);
			}

			return transportInstance;
		});

		//// Main service setup

		// Load the SMTPTransportConfig from the context
		const rawMailerConfig = yield* SMTPTransportConfig;

		// Create the nodemailer transport instance with the provided configuration
		const _mailer = yield* createTransport(rawMailerConfig);

		//// Public methods exposed by the SMTPService

		/**
		 * Runs a function with the nodemailer transport instance within an Effect context.
		 */
		const Mailer = Effect.fn(function* <T>(fn: (mailer: typeof _mailer) => Promise<T> | T) {
			return yield* Effect.tryPromise({
				try: () => Promise.resolve().then(() => fn(_mailer)),
				catch: (cause) =>
					new Error(
						`Failed to run Mailer function: ${
							cause instanceof Error ? cause.message : String(cause)
						}`
					),
			});
		});

		/**
		 * Verifies the SMTP transport configuration.
		 *
		 * This function checks if the SMTP transport is correctly configured and can connect to the server.
		 * It returns a promise that resolves with a boolean indicating success or failure.
		 *
		 * @returns A promise that resolves with true if the transport is verified, or throws an error if verification fails.
		 */
		const verifyTransport = Effect.fn(function* () {
			return yield* Effect.tryPromise({
				try: () => _mailer.verify(),
				// If an error occurs during verification, we throw a new Error with a custom message.
				// This helps in debugging SMTP configuration issues.
				catch: (cause) =>
					new Error(
						`Failed to verify SMTP transport: ${cause instanceof Error ? cause.message : String(cause)}`
					),
			});
		});

		/**
		 * Sends an email using the configured SMTP transport.
		 *
		 * This function takes mail options and sends an email, returning a promise that resolves with the sent message info.
		 *
		 * @param mailOptions - The options for the email to be sent.
		 * @returns A promise that resolves with the sent message info or throws an error if sending fails.
		 */
		const sendMail = (mailOptions: Mail.Options) =>
			Effect.tryPromise({
				try: () => _mailer.sendMail(mailOptions),
				catch: (cause) =>
					new Error(
						`Failed to send mail: ${cause instanceof Error ? cause.message : String(cause)}`
					),
			});

		/**
		 * Checks if the SMTP transport is idle.
		 *
		 * This function returns a promise that resolves with a boolean indicating whether the transport is idle or not.
		 *
		 * @returns A promise that resolves with true if the transport is idle, or throws an error if checking fails.
		 */
		const isIdle = Effect.fn(function* () {
			return yield* Effect.try({
				try: () => _mailer.isIdle(),
				catch: (cause) =>
					new Error(
						`Failed to check if SMTP transport is idle: ${cause instanceof Error ? cause.message : String(cause)}`
					),
			});
		});

		/**
		 * Gets the version string of the SMTP transport.
		 *
		 * This function returns a promise that resolves with the version string of the transport.
		 *
		 * @returns A promise that resolves with the version string or throws an error if fetching fails.
		 */
		const getVersionString = Effect.fn(function* () {
			return yield* Effect.try({
				try: () => _mailer.getVersionString(),
				catch: (cause) =>
					new Error(
						`Failed to get SMTP transport version string: ${cause instanceof Error ? cause.message : String(cause)}`
					),
			});
		});

		/**
		 * Closes the SMTP transport connection.
		 *
		 * This function returns a promise that resolves when the transport is closed or throws an error if closing fails.
		 *
		 * @returns A promise that resolves when the transport is closed or throws an error if closing fails.
		 */
		const close = () =>
			Effect.try({
				try: () => _mailer.close(),
				catch: (cause) =>
					new Error(
						`Failed to close SMTP transport: ${
							cause instanceof Error ? cause.message : String(cause)
						}`
					),
			});

		return {
			Mailer,
			verifyTransport,
			sendMail,
			isIdle,
			getVersionString,
			close,
		};
	}),
}) {}
