import { z } from 'astro/zod';
import { StudioCMSSanitizeOptionsSchema } from 'studiocms/schemas';

/**
 * Defines the schema for HTML configuration options.
 *
 * The schema includes an optional `sanitize` property, which is validated
 * using the `StudioCMSSanitizeOptionsSchema`. If no value is provided,
 * the default is an empty object.
 */
export const HTMLSchema = z
	.object({
		/** Sanitization options for HTML content. See {@link StudioCMSSanitizeOptionsSchema} for details. */
		sanitize: StudioCMSSanitizeOptionsSchema,
	})
	.optional()
	.default({});

export type HTMLSchemaOptions = z.infer<typeof HTMLSchema>;
