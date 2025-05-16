import { Schema } from 'effect';

export class Address extends Schema.Class<Address>('Address')({
	name: Schema.String,
	address: Schema.String,
}) {}

export class BaseMailOptions extends Schema.Class<BaseMailOptions>('BaseMailOptions')({
	/** The e-mail address of the sender. All e-mail addresses can be plain 'sender@server.com' or formatted 'Sender Name <sender@server.com>' */
	from: Schema.optional(Schema.Union(Schema.String, Address, Schema.Undefined)),
	/** An e-mail address that will appear on the Sender: field */
	sender: Schema.optional(Schema.Union(Schema.String, Address, Schema.Undefined)),
	/** Comma separated list or an array of recipients e-mail addresses that will appear on the To: field */
	to: Schema.optional(
		Schema.Union(
			Schema.String,
			Address,
			Schema.Array(Schema.Union(Schema.String, Address)),
			Schema.Undefined
		)
	),
	/** Comma separated list or an array of recipients e-mail addresses that will appear on the Cc: field */
	cc: Schema.optional(
		Schema.Union(
			Schema.String,
			Address,
			Schema.Array(Schema.Union(Schema.String, Address)),
			Schema.Undefined
		)
	),
	/** Comma separated list or an array of recipients e-mail addresses that will appear on the Bcc: field */
	bcc: Schema.optional(
		Schema.Union(
			Schema.String,
			Address,
			Schema.Array(Schema.Union(Schema.String, Address)),
			Schema.Undefined
		)
	),
	/** Comma separated list or an array of e-mail addresses that will appear on the Reply-To: field */
	replyTo: Schema.optional(
		Schema.Union(
			Schema.String,
			Address,
			Schema.Array(Schema.Union(Schema.String, Address)),
			Schema.Undefined
		)
	),
	/** The message-id this message is replying */
	inReplyTo: Schema.optional(Schema.Union(Schema.String, Address, Schema.Undefined)),
	/** Message-id list (an array or space separated string) */
	references: Schema.optional(
		Schema.Union(Schema.String, Schema.Array(Schema.String), Schema.Undefined)
	),
	/** The subject of the e-mail */
	subject: Schema.optional(Schema.Union(Schema.String, Schema.Undefined)),
}) {}

/**
 * Configuration options for the mail transporter.
 */
export class TransporterConfig extends Schema.Class<TransporterConfig>('TransporterConfig')({
	/**
	 * The hostname or IP address of the SMTP server.
	 */
	host: Schema.optional(Schema.String),
	/**
	 * The port number to connect to the SMTP server.
	 */
	port: Schema.optional(Schema.Number),
	/**
	 * If true, the connection will use TLS when connecting to the server.
	 */
	secure: Schema.optional(Schema.Boolean),
	/**
	 * The proxy URL to use for the connection (optional).
	 */
	proxy: Schema.optional(Schema.String),
	/**
	 * Authentication details for the SMTP server.
	 */
	auth: Schema.optional(
		Schema.Struct({
			/**
			 * The username for authentication.
			 */
			user: Schema.optional(Schema.String),
			/**
			 * The password for authentication.
			 */
			pass: Schema.optional(Schema.String),
		})
	),
	/**
	 * TLS configuration options (optional).
	 */
	tls: Schema.optional(
		Schema.Struct({
			/**
			 * If true, the server certificate will not be validated (optional).
			 */
			rejectUnauthorized: Schema.optional(Schema.Boolean),
			/**
			 * The server name for SNI (optional).
			 */
			servername: Schema.optional(Schema.String),
		})
	),
}) {}

/**
 * Configuration interface for the mailer.
 */
export class MailerConfig extends Schema.Class<MailerConfig>('MailerConfig')({
	/**
	 * The configuration object for the mail transporter.
	 */
	transporter: TransporterConfig,
	/**
	 * The email address of the sender.
	 */
	defaults: Schema.optional(BaseMailOptions),
}) {}
