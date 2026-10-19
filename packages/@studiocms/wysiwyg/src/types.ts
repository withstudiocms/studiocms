import { Schema } from 'studiocms/effect';
import { SanitizeOptionsSchema } from 'studiocms/schemas';
import type { studioCMSProjectDataSchema } from './schema.js';

export interface WysiwygDBContent
	extends Schema.SimplifyMutable<typeof studioCMSProjectDataSchema.Type> {}

/**
 * Schema for WYSIWYG configuration options.
 */
export const WYSIWYGSchema = Schema.mutable(
	Schema.Struct({
		sanitize: Schema.optionalWith(SanitizeOptionsSchema, {
			default: () => ({}),
		}).annotations({
			description:
				'Sanitization options for WYSIWYG content. See {@link SanitizeOptionsSchema} for details.',
		}),
	})
).annotations({
	title: 'WYSIWYG Configuration Options',
	identifier: 'WYSIWYGSchema',
	description: 'Defines the schema for HTML configuration options.',
});

/**
 * Type representing the WYSIWYG schema options.
 */
export type WYSIWYGSchemaOptions = typeof WYSIWYGSchema.Encoded;
