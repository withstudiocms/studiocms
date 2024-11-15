export function parseFormDataEntryToString(formData: FormData, key: string): string | null {
	const value = formData.get(key);
	if (typeof value !== 'string') {
		return null;
	}
	return value;
}

export const badFormDataEntry = (message?: string | undefined): Response => {
	const error = message || 'Invalid form data';

	return new Response(JSON.stringify({ error }), {
		status: 400,
		statusText: 'Bad Request',
	});
};
