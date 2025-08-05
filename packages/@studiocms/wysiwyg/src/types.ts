import { z } from 'astro/zod';
import type { ProjectData } from 'grapesjs';
import { StudioCMSSanitizeOptionsSchema } from 'studiocms/schemas';

export interface WysiwygDBContent extends ProjectData {
	/** The HTML content of the WYSIWYG editor */
	__STUDIOCMS_HTML: string;
}

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
