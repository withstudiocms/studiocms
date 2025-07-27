import { z } from 'astro/zod';

/**
 * Schema for options used to sanitize HTML content in StudioCMS.
 *
 * @remarks
 * This schema defines the configuration for controlling which elements and attributes
 * are allowed, blocked, or dropped during the sanitization process. It also provides
 * options for handling components, custom elements, and comments.
 *
 * @property allowElements - An array of strings specifying elements that should not be removed. All other elements will be dropped.
 * @property blockElements - An array of strings specifying elements that should be removed, but their children will be kept.
 * @property dropElements - An array of strings specifying elements (including nested elements) that should be removed entirely.
 * @property allowAttributes - An object mapping attribute names to arrays of allowed tag names. Only matching attributes will be retained.
 * @property dropAttributes - An object mapping attribute names to arrays of tag names for which the attribute should be dropped.
 * @property allowComponents - If true, components will be checked against built-in and custom configuration to determine retention. Default is false.
 * @property allowCustomElements - If true, custom elements will be checked against built-in and custom configuration to determine retention. Default is false.
 * @property allowComments - If true, HTML comments will be retained. Default is false.
 */
export const StudioCMSSanitizeOptionsSchema = z
	.object({
		/** An Array of strings indicating elements that the sanitizer should not remove. All elements not in the array will be dropped. */
		allowElements: z.array(z.string()).optional(),
		/** An Array of strings indicating elements that the sanitizer should remove. Children will be kept. */
		blockElements: z.array(z.string()).optional(),
		/** An Array of strings indicating elements (including nested elements) that the sanitizer should remove. */
		dropElements: z.array(z.string()).optional(),
		/** An object where each key is the attribute name and the value is an array of allowed tag names. Matching attributes will not be removed. All attributes that are not in the array will be dropped. */
		allowAttributes: z.record(z.array(z.string())).optional(),
		/** An object where each key is the attribute name and the value is an array of dropped tag names. Matching attributes will be removed. */
		dropAttributes: z.record(z.array(z.string())).optional(),
		/** A boolean value to remove components and their children. If set to true, components will be subject to built-in and custom configuration checks (and will be retained or dropped based on those checks). Default is `false`. */
		allowComponents: z.boolean().optional(),
		/** A boolean value to remove custom elements and their children. If set to true, custom elements will be subject to built-in and custom configuration checks (and will be retained or dropped based on those checks). Default is `false` */
		allowCustomElements: z.boolean().optional(),
		/** A boolean value to remove HTML comments. Set to true in order to keep comments. Default is `false`. */
		allowComments: z.boolean().optional(),
	})
	.optional();

/**
 * Defines the schema for HTML configuration options.
 *
 * The schema includes an optional `sanitize` property, which is validated
 * using the `StudioCMSSanitizeOptionsSchema`. If no value is provided,
 * the default is an empty object.
 */
export const HTMLSchema = z
	.object({
		/**
		 * Schema for options used to sanitize HTML content in StudioCMS.
		 *
		 * @remarks
		 * This schema defines the configuration for controlling which elements and attributes
		 * are allowed, blocked, or dropped during the sanitization process. It also provides
		 * options for handling components, custom elements, and comments.
		 *
		 * @property allowElements - An array of strings specifying elements that should not be removed. All other elements will be dropped.
		 * @property blockElements - An array of strings specifying elements that should be removed, but their children will be kept.
		 * @property dropElements - An array of strings specifying elements (including nested elements) that should be removed entirely.
		 * @property allowAttributes - An object mapping attribute names to arrays of allowed tag names. Only matching attributes will be retained.
		 * @property dropAttributes - An object mapping attribute names to arrays of tag names for which the attribute should be dropped.
		 * @property allowComponents - If true, components will be checked against built-in and custom configuration to determine retention. Default is false.
		 * @property allowCustomElements - If true, custom elements will be checked against built-in and custom configuration to determine retention. Default is false.
		 * @property allowComments - If true, HTML comments will be retained. Default is false.
		 */
		sanitize: StudioCMSSanitizeOptionsSchema,
	})
	.optional()
	.default({});

export type HTMLSchemaOptions = z.infer<typeof HTMLSchema>;
