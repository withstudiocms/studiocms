import { z } from 'astro/zod';

/**
 * Ensures the input value is returned as an array of strings.
 *
 * - If the input is `undefined`, `null`, or an empty string, returns an empty array.
 * - If the input is already an array of strings, returns it as-is.
 * - If the input is a JSON string representing an array, parses and returns the array.
 * - For any other input, returns an empty array.
 *
 * @param val - The value to convert to a string array. Can be a string, an array of strings, or undefined.
 * @returns An array of strings derived from the input value.
 */
function ensureStringArray(val: string | string[] | undefined): string[] {
	if (!val) return [];
	if (typeof val === 'string' && val.trim() === '') return [];
	if (Array.isArray(val)) return val;
	try {
		const parsed = JSON.parse(val);
		if (Array.isArray(parsed)) return parsed;
		return [];
	} catch {
		return [];
	}
}

/**
 * Zod schema for validating and transforming data when creating a new StudioCMS page.
 *
 * Fields:
 * - `title`: Required string. The title of the page. Must not be empty.
 * - `slug`: Required string. Must be lowercase, only contain letters, numbers, and hyphens (no leading/trailing hyphens).
 * - `description`: Optional string. A description of the page.
 * - `package`: Required string. The package associated with the page.
 * - `showOnNav`: Optional boolean (default: false). Whether to show the page in navigation.
 * - `heroImage`: Optional string. URL or path to the hero image.
 * - `parentFolder`: Optional string or null (default: null). The parent folder for the page.
 * - `draft`: Optional boolean (default: false). Whether the page is a draft.
 * - `showAuthor`: Optional boolean (default: false). Whether to display the author.
 * - `showContributors`: Optional boolean (default: false). Whether to display contributors.
 * - `categories`: Optional string or array of strings (default: []). Transformed to an array of strings.
 * - `tags`: Optional string or array of strings (default: []). Transformed to an array of strings.
 *
 * Uses custom transformations to ensure `categories` and `tags` are always arrays of strings.
 */
export const studioCMSCreatePageDataSchema = z.object({
	title: z.string().min(1, { message: 'Title is required' }),
	slug: z.string().refine((val) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(val), {
		message:
			'Slug must be lowercase and can only contain letters, numbers, and hyphens (no leading/trailing hyphens)',
	}),
	description: z.string().optional(),
	package: z.string(),
	showOnNav: z
		.string()
		.optional()
		.transform((v) => !!v && v.toLowerCase() === 'true'),
	heroImage: z.string().optional(),
	parentFolder: z
		.union([z.string(), z.null()])
		.transform((value) => (value === 'null' || value === null ? null : value))
		.optional()
		.default(null),
	draft: z
		.string()
		.optional()
		.transform((v) => !!v && v.toLowerCase() === 'true'),
	showAuthor: z
		.string()
		.optional()
		.transform((v) => !!v && v.toLowerCase() === 'true'),
	showContributors: z
		.string()
		.optional()
		.transform((v) => !!v && v.toLowerCase() === 'true'),
	categories: z
		.string()
		.or(z.array(z.string()))
		.optional()
		.transform(ensureStringArray)
		.default([]),
	tags: z.string().or(z.array(z.string())).optional().transform(ensureStringArray).default([]),
});

/**
 * Schema for editing page data and content in StudioCMS.
 *
 * Extends the `studioCMSCreatePageDataSchema` with additional fields required for editing:
 * - `id`: The unique identifier for the page.
 * - `content`: The main content of the page as a string.
 * - `contentId`: The unique identifier for the content.
 * - `pluginFields`: An optional record of plugin-specific fields, where each value is a `FormDataEntryValue` or null.
 */
export const studioCMSEditPageDataAndContentSchema = studioCMSCreatePageDataSchema.extend({
	id: z.string(),
	content: z.string(),
	contentId: z.string(),
	pluginFields: z.record(z.custom<FormDataEntryValue>().nullable()).optional().default({}),
	augments: z.array(z.string()).optional(),
});

/**
 * Converts a FormData object into a plain record object, optionally remapping keys.
 *
 * @param formData - The FormData instance to convert.
 * @param keyRemapping - An optional mapping of original keys to new keys.
 * @returns A record object where each key is either the original or remapped key, and each value is the corresponding FormData entry value.
 */
export function formDataToRecord(formData: FormData, keyRemapping?: Record<string, string>) {
	const record: Record<string, FormDataEntryValue> = {};
	for (const [key, value] of formData.entries()) {
		const mappedKey = keyRemapping?.[key] || key;
		record[mappedKey] = value;
	}
	return record;
}
