/**
 * Converts a string into a URL-safe slug
 * @param text - The text to slugify
 * @param options - Optional configuration
 * @returns A URL-safe slug string
 */
export function slugify(
	text: string,
	options: {
		separator?: string;
		lowercase?: boolean;
	} = {}
): string {
	const { separator = '-', lowercase = true } = options;

	let slug = text
		.toString()
		.normalize('NFD') // Normalize Unicode characters
		.replace(/[\u0300-\u036f]/g, '') // Remove diacritics
		.replace(/[^a-zA-Z0-9\s-]/g, '') // Remove invalid characters
		.trim()
		.replace(/\s+/g, separator) // Replace spaces with separator
		.replace(new RegExp(`${separator}+`, 'g'), separator); // Replace multiple separators with single

	if (lowercase) {
		slug = slug.toLowerCase();
	}

	return slug;
}
