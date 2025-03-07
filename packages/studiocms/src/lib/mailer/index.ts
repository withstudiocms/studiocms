import { db, eq } from 'astro:db';
import _logger from 'studiocms:logger';
import { asDrizzleTable } from '@astrojs/db/utils';
import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import socks from 'socks';
import { CMSMailerConfigId } from '../../consts.js';
import { StudioCMSMailerConfig } from '../../db/tables.js';
import { StudioCMSCoreError } from '../../errors.js';

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
 * Configuration options for the mail transporter.
 */
export interface TransporterConfig {
	/**
	 * The hostname or IP address of the SMTP server.
	 */
	host: string;

	/**
	 * The port number to connect to the SMTP server.
	 */
	port: number;

	/**
	 * If true, the connection will use TLS when connecting to the server.
	 */
	secure: boolean;

	/**
	 * The proxy URL to use for the connection (optional).
	 */
	proxy?: string;

	/**
	 * Authentication details for the SMTP server.
	 */
	auth: {
		/**
		 * The username for authentication.
		 */
		user?: string;

		/**
		 * The password for authentication.
		 */
		pass?: string;
	};

	/**
	 * TLS configuration options (optional).
	 */
	tls?: {
		/**
		 * If true, the server certificate will not be validated (optional).
		 */
		rejectUnauthorized?: boolean;

		/**
		 * The server name for SNI (optional).
		 */
		servername?: string;
	};
}

/**
 * Configuration interface for the mailer.
 */
export interface MailerConfig {
	/**
	 * The configuration object for the mail transporter.
	 */
	transporter: TransporterConfig;

	/**
	 * The email address of the sender.
	 */
	sender: string;
}

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
 * Interface representing the response from a mail verification operation.
 */
export type VerificationResponse = { message: string } | { error: string };

/**
 * The logger for the mailer module.
 */
const logger = _logger.fork('studiocms:runtime/mailer');

/**
 * Error class for mailer errors.
 */
class StudioCMSMailerError extends StudioCMSCoreError {
	name = 'StudioCMSMailer_Error';
}

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
 * Gets the mailer configuration from the database.
 *
 * @returns A promise that resolves with the mailer configuration object.
 */
export const getMailerConfigTable = async (): Promise<tsMailer | undefined> =>
	await db.select().from(tsMailerConfig).where(eq(tsMailerConfig.id, CMSMailerConfigId)).get();

/**
 * Updates the mailer configuration in the database.
 *
 * @param config - The new mailer configuration object.
 * @returns A promise that resolves when the mailer configuration has been updated.
 */
export const updateMailerConfigTable = async (config: tsMailerInsert): Promise<void> => {
	try {
		await db.update(tsMailerConfig).set(config).where(eq(tsMailerConfig.id, CMSMailerConfigId));
	} catch (error) {
		logger.error(`Error updating mailer configuration: ${error}`);
		throw new StudioCMSMailerError('Error updating mailer configuration', (error as Error).message);
	}
};

/**
 * Creates a new mailer configuration in the database.
 *
 * @param config - The mailer configuration object to create.
 * @returns A promise that resolves with the new mailer configuration object.
 */
export const createMailerConfigTable = async (config: tsMailerInsert): Promise<tsMailer> => {
	try {
		return await db
			.insert(tsMailerConfig)
			.values({ ...config, id: CMSMailerConfigId })
			.onConflictDoUpdate({
				target: tsMailerConfig.id,
				set: config,
				where: eq(tsMailerConfig.id, CMSMailerConfigId),
			})
			.returning()
			.get();
	} catch (error) {
		logger.error(`Error creating mailer configuration: ${error}`);
		throw new StudioCMSMailerError('Error creating mailer configuration', (error as Error).message);
	}
};

/**
 * Converts a StudioCMS mailer configuration object to a nodemailer transporter configuration object.
 *
 * @param config - The StudioCMS mailer configuration object.
 * @returns The nodemailer transporter configuration object.
 */
export function convertTransporterConfig(config: tsMailer): MailerConfig {
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
	const transporterConfig: TransporterConfig = {
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
	};

	// Return the transporter configuration object
	return { transporter: transporterConfig, sender: default_sender };
}

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
export async function sendMail({ subject, ...message }: MailOptions) {
	// Get the mailer configuration from the database
	const mailerConfigTable = await getMailerConfigTable();

	// If the mailer configuration is not found, throw an
	// error indicating that the configuration is missing
	if (!mailerConfigTable) {
		throw new StudioCMSMailerError('Mailer configuration not found');
	}

	// Convert the mailer configuration to a nodemailer transporter configuration
	const mailerConfig = convertTransporterConfig(mailerConfigTable);

	// Create a new nodemailer transport
	const transporter = nodemailer.createTransport(mailerConfig.transporter, {
		from: mailerConfig.sender,
	});

	// Create the mail options object
	const toSend: Mail.Options = { subject };

	// If the proxy is a socks proxy, set the socks module
	if (mailerConfig.transporter.proxy?.startsWith('socks')) {
		transporter.set('proxy_socks_module', socks);
	}

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

	// Try to send the mail
	try {
		const result = await transporter.sendMail(toSend);

		logger.info(`Message sent: ${result.messageId}`);

		return result;
	} catch (error) {
		logger.error(`Error sending mail: ${error}`);
		throw new StudioCMSMailerError('Error sending mail', (error as Error).message);
	}
}

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
export async function verifyMailConnection(): Promise<VerificationResponse> {
	// Get the mailer configuration from the database
	const mailerConfigTable = await getMailerConfigTable();

	// If the mailer configuration is not found, throw an
	// error indicating that the configuration is missing
	if (!mailerConfigTable) {
		throw new StudioCMSMailerError('Mailer configuration not found');
	}

	// Convert the mailer configuration to a nodemailer transporter configuration
	const { transporter: transporterConfig } = convertTransporterConfig(mailerConfigTable);

	// Create a new nodemailer transport
	const transporter = nodemailer.createTransport(transporterConfig);

	// If the proxy is a socks proxy, set the socks module
	if (transporterConfig.proxy?.startsWith('socks')) {
		transporter.set('proxy_socks_module', socks);
	}

	// Verify the mail connection
	const result = await transporter.verify();

	// If the result is not true, log an error and return an error message
	if (result !== true) {
		logger.error('Mail connection verification failed');
		return { error: 'Mail connection verification failed' };
	}

	// Log a success message and return a success message
	logger.info('Mail connection verified successfully');
	return { message: 'Mail connection verified successfully' };
}
