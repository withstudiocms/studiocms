/**
 * Converts a given string into a "safe" string by replacing all non-alphanumeric
 * characters with underscores, trimming leading and trailing underscores, and converting
 * the result to lowercase.
 *
 * @param string - The input string to be converted.
 * @returns The sanitized, lowercase string with non-alphanumeric characters replaced by underscores.
 */
export function convertToSafeString(string: string) {
	return string
		.replace(/[^a-zA-Z0-9]/g, '_')
		.replace(/^_+|_+$/g, '')
		.toLowerCase();
}
