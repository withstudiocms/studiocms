import { z } from 'astro/zod';
import type { Schema } from 'studiocms/effect';
import { StudioCMSSanitizeOptionsSchema } from 'studiocms/schemas';
import type { studioCMSProjectDataSchema } from './schema.js';

export interface WysiwygDBContent extends Schema.SimplifyMutable<typeof studioCMSProjectDataSchema.Type> {}

/**
 * Defines the schema for HTML configuration options.
 *
 * The schema includes an optional `sanitize` property, which is validated
 * using the `StudioCMSSanitizeOptionsSchema`. If no value is provided,
 * the default is an empty object.
 */
export const WYSIWYGSchema = z
	.object({
		/** Sanitization options for WYSIWYG content. See {@link StudioCMSSanitizeOptionsSchema} for details. */
		sanitize: StudioCMSSanitizeOptionsSchema,
	})
	.optional()
	.default({});

export type WYSIWYGSchemaOptions = z.infer<typeof WYSIWYGSchema>;
