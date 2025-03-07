import logger from 'studiocms:logger';
import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import socks from 'socks';

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
	 * Authentication details for the SMTP server.
	 */
	auth: {
		/**
		 * The username for authentication (optional).
		 */
		user?: string;

		/**
		 * The password for authentication (optional).
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

	/**
	 * The proxy URL to use for the connection (optional).
	 */
	proxy?: string;
}

/**
 * Configuration interface for the mailer.
 */
export interface MailerConfig {
	transporter: TransporterConfig;
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
 * Sends an email using the provided mailer configuration and mail options.
 *
 * @param mailerConfig - The configuration object for the mailer, including the transporter and sender details.
 * @param mailOptions - The options for the mail, including the subject and other message details.
 * @returns A promise that resolves with the result of the mail sending operation.
 * @throws Will throw an error if the mail sending operation fails.
 *
 * @example
 * ```typescript
 * const mailerConfig = {
 *   transporter: {
 *     host: 'smtp.example.com',
 *     port: 587,
 *     auth: {
 *       user: 'username',
 *       pass: 'password'
 *     },
 *     proxy: 'socks5://proxy.example.com:1080'
 *   },
 *   sender: 'no-reply@example.com'
 * };
 *
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
export async function sendMail(mailerConfig: MailerConfig, { subject, ...message }: MailOptions) {
	// Create a new nodemailer transport
	const transporter = nodemailer.createTransport(mailerConfig.transporter, {
		from: mailerConfig.sender,
	});

	// Get the proxy from the transporter config
	const proxy = mailerConfig.transporter.proxy;

	// Create the mail options object
	const toSend: Mail.Options = { subject };

	// If the proxy is a socks proxy, set the socks module
	if (proxy?.startsWith('socks')) {
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
		throw error;
	}
}

/**
 * Verifies the mail connection using the provided transporter configuration.
 *
 * @param transporterConfig - The configuration object for the mail transporter.
 * @returns A promise that resolves to an object containing either a success message or an error message.
 *
 * @example
 * ```typescript
 * const transporterConfig = {
 *   host: 'smtp.example.com',
 *   port: 587,
 *   auth: {
 *     user: 'username',
 *     pass: 'password'
 *   },
 *   proxy: 'socks5://proxy.example.com:1080'
 * };
 *
 * const result = await verifyMailConnection(transporterConfig);
 * if ('message' in result) {
 *   console.log(result.message);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function verifyMailConnection(
	transporterConfig: TransporterConfig
): Promise<{ message: string } | { error: string }> {
	// Create a new nodemailer transport
	const transporter = nodemailer.createTransport(transporterConfig);

	// Get the proxy from the transporter config
	const proxy = transporterConfig.proxy;

	// If the proxy is a socks proxy, set the socks module
	if (proxy?.startsWith('socks')) {
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
