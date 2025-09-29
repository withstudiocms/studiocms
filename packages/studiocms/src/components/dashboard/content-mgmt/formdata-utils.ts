import { z } from 'astro/zod';

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

export const studioCMSCreatePageDataSchema = z.object({
	title: z.string().min(1, { message: 'Title is required' }),
	slug: z.string().refine((val) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(val), {
		message:
			'Slug must be lowercase and can only contain letters, numbers, and hyphens (no leading/trailing hyphens)',
	}),
	description: z.string().optional(),
	package: z.string(),
	showOnNav: z.coerce.boolean().optional().default(false),
	heroImage: z.string().optional(),
	parentFolder: z.string().or(z.null()).optional().default(null),
	draft: z.coerce.boolean().optional().default(false),
	showAuthor: z.coerce.boolean().optional().default(false),
	showContributors: z.coerce.boolean().optional().default(false),
	categories: z
		.string()
		.or(z.array(z.string()))
		.optional()
		.transform(ensureStringArray)
		.default([]),
	tags: z.string().or(z.array(z.string())).optional().transform(ensureStringArray).default([]),
});

export const studioCMSEditPageDataAndContentSchema = studioCMSCreatePageDataSchema.extend({
	id: z.string(),
	content: z.string(),
	contentId: z.string(),
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
