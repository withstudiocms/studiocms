export function convertToSafeString(string: string) {
	return string
		.replace(/[^a-zA-Z0-9]/g, '_')
		.replace(/^_+|_+$/g, '')
		.toLowerCase();
}
