/**
 * Escapes special characters in a string for use in a regular expression
 * @param str - The string to escape
 * @returns The escaped string
 */
function escapeRegExp(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Converts an empty string to undefined
 * @param value - The string to check
 * @returns Undefined if the string is empty, otherwise the original string
 */
function emptyStringToUndefined(value: string): string | undefined {
	return value.trim() === '' ? undefined : value;
}

/**
 * Options for the slugify function
 */
export interface SlugifyOptions {
	/**
	 * The separator to use in the slug
	 * @default '-'
	 */
	separator?: string;

	/**
	 * Whether to convert the slug to lowercase
	 * @default true
	 */
	lowercase?: boolean;
}

/**
 * Converts a string into a URL-safe slug
 * @param text - The text to slugify
 * @param options - Optional configuration
 * @returns A URL-safe slug string
 */
export function slugify(text: string, options: SlugifyOptions = {}): string {
	const { separator: rawSeparator = '-', lowercase = true } = options;
	const separator = emptyStringToUndefined(rawSeparator) || '-'; // avoid empty separator causing invalid RegExp
	const escapedSeparator = escapeRegExp(separator);

	let slug = text
		.toString()
		.normalize('NFD') // Normalize Unicode characters
		.replace(/[\u0300-\u036f]/g, '') // Remove diacritics
		.replace(new RegExp(`[^a-zA-Z0-9\\s${escapedSeparator}]`, 'g'), '') // Remove invalid characters
		.trim()
		.replace(/\s+/g, separator) // Replace spaces with separator
		.replace(new RegExp(`(?:${escapedSeparator})+`, 'g'), separator); // Replace multiple separators with single

	if (lowercase) {
		slug = slug.toLowerCase();
	}

	return slug;
}
