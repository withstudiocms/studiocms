import logger from 'studiocms:logger';
import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';

export interface TransporterConfig {
	host: string;
	port: number;
	secure: boolean;
	auth: {
		user?: string;
		pass?: string;
	};
	tls?: {
		// do not fail on invalid certs
		rejectUnauthorized?: boolean;
	};
}

export interface MailerConfig {
	transporter: TransporterConfig;
	sender: string;
}

export interface MailOptions {
	to: string | string[];
	subject: string;
	text?: string | undefined;
	html?: string | undefined;
}

export async function sendMail(mailerConfig: MailerConfig, { subject, ...message }: MailOptions) {
	const transporter = nodemailer.createTransport(mailerConfig.transporter, {
		from: mailerConfig.sender,
	});

	const toSend: Mail.Options = { subject };

	toSend.to = Array.isArray(message.to) ? message.to.join(', ') : message.to;

	if (message.text && !message.html) {
		toSend.text = message.text;
	}

	if (message.html) {
		toSend.html = message.html;
	}

	try {
		const result = await transporter.sendMail(toSend);

		logger.info(`Message sent: ${result.messageId}`);

		return result;
	} catch (error) {
		logger.error(`Error sending mail: ${error}`);
		throw error;
	}
}

export async function verifyMailConnection(
	transporterConfig: TransporterConfig
): Promise<{ message: string } | { error: string }> {
	const transporter = nodemailer.createTransport(transporterConfig);

	const result = await transporter.verify();

	if (result !== true) {
		logger.error('Mail connection verification failed');
		return { error: 'Mail connection verification failed' };
	}

	logger.info('Mail connection verified successfully');
	return { message: 'Mail connection verified successfully' };
}
