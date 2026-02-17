import { Schema } from 'studiocms/effect';
import { SanitizeOptionsSchema } from 'studiocms/schemas';

/**
 * Schema definition for HTML configuration in StudioCMS.
 */
export const HTMLSchema = Schema.Struct({
	sanitize: Schema.optionalWith(
		SanitizeOptionsSchema.annotations({
			description:
				'Sanitization options for HTML content. See StudioCMSSanitizeOptionsSchema for details.',
		}),
		{
			default: () => ({}),
			exact: true,
		}
	),
}).annotations({
	description: 'The configuration for HTML content in StudioCMS.',
	title: 'HTML Configuration',
	identifier: 'HTMLSchemaBase',
});

/**
 * Type definition for the HTML configuration options in StudioCMS.
 */
export type HTMLSchemaOptions = typeof HTMLSchema.Encoded;
