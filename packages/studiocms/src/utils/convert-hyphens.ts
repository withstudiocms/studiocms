/**
 * Converts all hyphens in a given string to underscores.
 *
 * @param str - The input string containing hyphens to be converted.
 * @returns A new string with all hyphens replaced by underscores.
 */
export function convertHyphensToUnderscores(str: string): string {
	// Convert hyphens to underscores
	return str.replace(/-/g, '_');
}

/**
 * Converts all underscores in a given string to hyphens.
 *
 * @param str - The input string containing underscores to be converted.
 * @returns A new string with all underscores replaced by hyphens.
 */
export function convertUnderscoresToHyphens(str: string): string {
	// Convert underscores to hyphens
	return str.replace(/_/g, '-');
}
